import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import {
  OrdersDocument,
  OrdersServiceStatus,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { ResponseService } from 'src/response/response.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { unescape } from 'querystring';
import {
  OrderHistoriesDocument,
  OrderHistoriesServiceStatus,
  OrderHistoriesStatus,
} from 'src/database/entities/orders-history.entity';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';

@Injectable()
export class DeliveriesMultipleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly responseService: ResponseService,
    private readonly settingRepository: SettingsRepository,
    private readonly messageService: MessageService,
    private readonly natsService: NatsService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
    private readonly orderHistoriesRepository: OrderHistoriesRepository,
  ) {}

  logger = new Logger();

  async createMultipleOrder(natsdata: any) {
    this.logger.log(natsdata, 'PREPARE CREATE MULTIPLE ORDER');
    if (natsdata.delivery_type == 'DELIVERY') {
      // GET DATA CUSTOMER
      this.logger.log('PREPARE GET CUSTOMER DATA');
      const customer = await this.getDataCustomer(natsdata);

      //** ELOG DATA */
      this.logger.log('PREPARE FETCH ELOG DATA');
      const elogData = this.elogData(customer, natsdata);

      this.logger.log('PREPARE PICKUP DESTINATIONS');

      for (let index = 0; index < natsdata.orders.length; index++) {
        const rows = natsdata.orders[index];
        const store = await this.getDataStore(rows);
        const CartItems = [];
        if (rows.cart_payload.length > 0) {
          const payload = rows.cart_payload;
          payload.forEach((Items) => {
            CartItems.push({
              name: Items.menu.name,
              price: Items.price,
              weight: 1,
              quantity: Items.quantity,
            });
          });
        }

        elogData.pickup_destinations.push({
          latitude: store.location_latitude,
          longitude: store.location_longitude,
          address: store.address,
          address_name: store.name,
          contact_phone_no: store.phone,
          contact_name: store.name,
          note: '',
          location_description: '',
          items: CartItems,
        });
      }

      this.logger.log(elogData, 'ELOG DATA PAYLOAD');

      //** ELOG SETTING */
      await this.elogApisHandling(natsdata, elogData);
      return elogData;
    }
  }

  //** GET SETUP ELOG */
  async getElogSettings() {
    try {
      const result = {};
      const settings = await this.settingRepository
        .createQueryBuilder()
        .where('name like :name', { name: '%elog_%' })
        .withDeleted()
        .getMany();

      for (const Item in settings) {
        result[settings[Item].name] = JSON.parse(
          settings[Item].value.replace('{', '[').replace('}', ']'),
        );
      }

      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  elogData(customer, data) {
    const elogData = {
      pickup_destinations: [],
      dropoff_destinations: [
        {
          longitude: data.customer_address.location_longitude,
          latitude: data.customer_address.location_latitude,
          contact_name: customer.name,
          contact_phone_no: customer.phone,
          address: data.customer_address.address,
          address_name: data.customer_address.name,
          location_description: data.customer_address.address_detail,
          note: '',
        },
      ],
      price: 'ongkir' in data ? data.ongkir : 0,
    };
    return elogData;
  }

  async getDataCustomer(data: any) {
    //** GET DATA CUSTOMER BY ID */
    const url = `${process.env.BASEURL_CUSTOMERS_SERVICE}/api/v1/internal/customers/${data.customer_id}`;
    const customer: any = await this.commonService.getHttp(url);

    if (!customer) {
      const errContaint: any = {
        value: data.customer_id,
        property: 'customer_id',
        constraint: ['Customer Id tidak ditemukan.'],
      };
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.group_id,
        response_payload: errContaint,
        logistic_platform: 'ELOG',
      };
      await this.saveNegativeResultOrder(deliveryData, errContaint);
    }
    return customer;
  }

  async getDataStore(data: any) {
    const urlStore = `${process.env.BASEURL_MERCHANTS_SERVICE}/api/v1/internal/merchants/stores/${data.store_id}`;
    const store: any = this.commonService.getHttp(urlStore);
    if (!store) {
      const errContaint: any = {
        value: data.store_id,
        property: 'store_id',
        constraint: ['Store Id tidak ditemukan.'],
      };
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.group_id,
        response_payload: errContaint,
        logistic_platform: 'ELOG',
      };
      await this.saveNegativeResultOrder(deliveryData, errContaint);
    }
    return store;
  }

  async elogApisHandling(natsdata, elogData) {
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

    //** EXECUTE CREATE ORDER BY POST */
    const urlDeliveryElog = `${elogUrl}/openapi/v0/order/send`;
    const headerRequest = {
      'Content-Type': 'application/json',
      Authorization:
        'basic ' +
        btoa(unescape(encodeURIComponent(elogUsername + ':' + elogPassword))),
    };

    const headersData = {
      headerRequest: headerRequest,
      url: urlDeliveryElog,
    };

    //** EXECUTE CREATE ORDER BY POST */
    const orderDelivery: any = await this.commonService
      .postHttp(urlDeliveryElog, elogData, headerRequest)
      .catch(async (err) => {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: natsdata.group_id,
          status: OrdersStatus.DRIVER_NOT_FOUND,
          response_payload: err,
          logistic_platform: natsdata.logistic_platform,
        };

        //** BROADCAST */
        this.natsService.clientEmit(
          `deliveries.order.multipickupfailed`,
          deliveryData,
        );

        this.thirdPartyRequestsRepository.save({
          request: {
            logistic_platform: 'elog',
            header: headersData.headerRequest,
            url: headersData.url,
            data: elogData,
            method: 'POST',
          },
          response: err,
        });

        //** IF ERROR */
        await this.saveNegativeResultOrder(deliveryData, err);
      });
    // const orderDelivery = this.dummyOrderDelivery();
    if (orderDelivery) {
      this.logger.log('ELOG RESPONSE DATA');
      console.log(orderDelivery);

      await this.saveToThirdPartyRequest(headersData, elogData, orderDelivery);

      await this.saveToDeliveryOrders(orderDelivery, natsdata);
    }
  }

  async saveToThirdPartyRequest(headersData, elogData, orderDelivery) {
    //** EXECUTE CREATE ORDER BY POST */
    const request = {
      header: headersData.headerRequest,
      url: headersData.url,
      data: elogData,
      method: 'POST',
    };
    console.log(request);

    //** SAVE ELOG DELIVERIES TO DELIVERIES ORDERS */
    this.thirdPartyRequestsRepository.save({
      request,
      response: orderDelivery,
      code: orderDelivery.data.id,
    });
  }

  async saveToDeliveryOrders(orderDelivery, natsdata) {
    if (orderDelivery) {
      const status = this.statusConverter(orderDelivery.data.status);
      const deliveryData: Partial<OrdersDocument> = {
        order_id: natsdata.group_id,
        delivery_id: orderDelivery.data.id,
        price: natsdata.ongkir,
        response_payload: orderDelivery,
        status: status.orderStatus,
        service_status: status.deliveryStatus,
        waybill_id: orderDelivery.data.airway_bill,
        tracking_url: orderDelivery.data.tracking_url,
        logistic_platform: natsdata.logistic_platform,
        driver_name: orderDelivery.data.driver_name,
        driver_phone: orderDelivery.data.driver_phone_no,
      };
      console.log('SAVE TO DELIVERIES ORDER TABLE');
      console.log(deliveryData);
      const order = await this.ordersRepository.save(deliveryData);

      console.log('SAVE TO DELIVERIES HISTORIES TABLE');
      const historyData: Partial<OrderHistoriesDocument> = {
        order_id: order.id,
        status: status.orderStatus,
        service_status: status.deliveryStatus,
      };
      console.log(historyData);
      await this.orderHistoriesRepository.save(historyData);

      const getOrder = await this.ordersRepository.findOne(order.id, {
        relations: ['histories'],
      });

      //broadcast
      let eventName = orderDelivery.data.status;
      if (
        natsdata.delivery_status == 'CANCELLED' ||
        natsdata.delivery_status == 'DRIVER_NOT_FOUND'
      ) {
        eventName = 'reordered';
      }
      eventName = eventName.toLowerCase();
      this.natsService.clientEmit(
        `deliveries.order.multipickup${eventName}`,
        getOrder,
      );
    } else {
      const deliveryData: Partial<OrdersDocument> = {
        order_id: natsdata.group_id,
        status: OrdersStatus.DRIVER_NOT_FOUND,
        response_payload: 'null',
        logistic_platform: natsdata.logistic_platform,
      };

      //broadcast
      this.natsService.clientEmit(
        `deliveries.order.multipickupfailed`,
        deliveryData,
      );

      await this.saveNegativeResultOrder(deliveryData, 'null');
    }
  }

  async saveNegativeResultOrder(
    deliveryData: Partial<OrdersDocument>,
    errContaint: any,
  ) {
    try {
      await this.ordersRepository.save(deliveryData);
    } catch (error) {
      console.log(error);

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errContaint,
          'Bad Request',
        ),
      );
    }
  }

  async cancelMultipleOrder(order_id: string): Promise<any> {
    const orderDelivery = await this.ordersRepository.findOne({
      where: { order_id: order_id, status: 'FINDING_DRIVER' },
    });
    if (!orderDelivery) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: order_id,
            property: 'order_id',
            constraint: [
              this.messageService.get('delivery.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

    //** EXECUTE CREATE ORDER BY POST */
    const urlDeliveryElog = `${elogUrl}/openapi/v0/order/send`;
    const headerRequest = {
      'Content-Type': 'application/json',
      Authorization:
        'basic ' +
        btoa(unescape(encodeURIComponent(elogUsername + ':' + elogPassword))),
    };
    const data = {
      cancel_reason: 'Permintaan store',
    };
    const cancelOrderDelivery: any = await this.commonService
      .deleteHttp(urlDeliveryElog, data, headerRequest)
      .catch((err1) => {
        console.error(err1);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: order_id,
              property: 'order_id',
              constraint: [err1.error],
            },
            'Bad Request',
          ),
        );
      });
    const request = {
      header: headerRequest,
      url: urlDeliveryElog,
      data: data,
      method: 'DELETE',
    };
    this.thirdPartyRequestsRepository.save({
      request,
      response: cancelOrderDelivery,
      code: order_id,
    });

    const orderHistory: Partial<OrderHistoriesDocument> = {
      order_id: orderDelivery.id,
      status: OrderHistoriesStatus.CANCELLED,
      service_status: OrderHistoriesServiceStatus.Cancelled,
    };
    await this.orderHistoriesRepository.save(orderHistory);

    orderDelivery.status = OrdersStatus.CANCELLED;
    orderDelivery.service_status = OrdersServiceStatus.Cancelled;
    const order = await this.ordersRepository.save(orderDelivery);

    //broadcast
    this.natsService.clientEmit(`deliveries.order.multipickupcancelled`, order);

    return cancelOrderDelivery;
  }

  statusConverter(status: string) {
    let delivStatus = OrdersServiceStatus.Confirmed;
    switch (status) {
      case 'CONFIRMED':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Confirmed;
        break;
      case 'ON_GOING':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Allocated;
        break;
      case 'GO_TO_LOCATION_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Allocated;
        break;
      case 'ARRIVE_AT_LOCATION_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Allocated;
        break;
      case 'LOADING_GOODS_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Picking_up;
        break;
      case 'GO_TO_LOCATION_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'ARRIVE_AT_LOCATION_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'LOADING_GOODS_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'FINISHED':
        status = OrdersStatus.COMPLETED;
        delivStatus = OrdersServiceStatus.Delivered;
        break;
      case 'CANCELLED':
        status = OrdersStatus.CANCELLED;
        delivStatus = OrdersServiceStatus.Cancelled;
        break;
    }
    return {
      orderStatus: status,
      deliveryStatus: delivStatus,
    };
  }

  dummyOrderDelivery() {
    return {
      status: 'success',
      message: 'Berhasil membuat order.',
      data: {
        id: '20915f8c-0553-485c-867b-f10d79f26ad4',
        airway_bill: 'ELN13012111600001',
        tracking_url:
          'https://dev.elog.co.id/tracking/20915f8c-0553-485c-867b-f10d79f26ad4',
        delivery_type: 'INSTANT',
        status: 'CONFIRMED',
        pickup_destinations: [
          {
            id: 'fd301087-32fe-4504-a4a8-351c31596f80',
            longitude: 107.59653259049831,
            latitude: -6.877444678496585,
            contact_name: 'Richeese Factory Flamboyan ',
            contact_phone: '6282214863662',
            address:
              'Jl. Sukajadi No.234, Gegerkalong, Kec. Sukasari, Kota Bandung, Jawa Barat 40153',
            address_name: 'Richeese Factory Flamboyan ',
            location_description: '',
            note: '',
            destination_order: 0,
            items: [
              {
                name: 'Combo Rich Burger - Beef',
                weight: 1,
                quantity: 1,
                price: 48000,
                note: null,
              },
            ],
            external_id: null,
          },
        ],
        dropoff_destinations: [
          {
            id: 'c34d3a23-1040-46d5-b078-3d2d4307bb2a',
            longitude: 107.5785705,
            latitude: -6.8905558,
            contact_name: 'Fatkhur Roni',
            contact_phone: '6285648636747',
            address:
              'WU Tower, Jalan Doktor Djunjunan, Sukawarna, Bandung City, West Java, Indonesia',
            address_name: 'kantor',
            location_description: '',
            note: '',
            destination_order: 1,
          },
        ],
      },
    };
  }

  dummyOrderFailed() {
    return {
      status: 'error',
      error: 'ERR_NOT_FOUND',
      message: 'Tidak dapat menemukan pengemudi di sekitar anda',
      data: null,
    };
  }
}

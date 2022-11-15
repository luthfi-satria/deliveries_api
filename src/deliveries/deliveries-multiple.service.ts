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

  async createMultipleOrder(data: any) {
    this.logger.log(data, 'PREPARE CREATE MULTIPLE ORDER');
    if (data.delivery_type == 'DELIVERY') {
      // GET DATA CUSTOMER
      this.logger.log('PREPARE GET CUSTOMER DATA');
      const customer = await this.getDataCustomer(data);

      //** ELOG DATA */
      this.logger.log('PREPARE FETCH ELOG DATA');
      const elogData = this.elogData(customer, data);

      this.logger.log('PREPARE PICKUP DESTINATIONS');

      for (let index = 0; index < data.orders.length; index++) {
        const rows = data.orders[index];
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

      this.logger.log(elogData, 'ELOG DATA RESULTS');

      //** ELOG SETTING */
      await this.elogApisHandling(data, elogData);
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
      price: 'price' in data ? data.price : 0,
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
        order_id: data.id,
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
        order_id: data.id,
        response_payload: errContaint,
        logistic_platform: 'ELOG',
      };
      await this.saveNegativeResultOrder(deliveryData, errContaint);
    }
    return store;
  }

  async elogApisHandling(data, elogData) {
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

    //** EXECUTE CREATE ORDER BY POST */
    const orderDelivery: any = await this.commonService
      .postHttp(urlDeliveryElog, elogData, headerRequest)
      .catch(async (err) => {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.group_id,
          status: OrdersStatus.DRIVER_NOT_FOUND,
          response_payload: err,
          logistic_platform: data.logistic_platform,
        };

        //** BROADCAST */
        this.natsService.clientEmit(
          `deliveries.multiple.order.failed`,
          deliveryData,
        );

        //** IF ERROR */
        await this.saveNegativeResultOrder(deliveryData, err);
      });

    const headersData = {
      headerRequest: headerRequest,
      url: urlDeliveryElog,
    };

    await this.saveToThirdPartyRequest(headersData, elogData, orderDelivery);

    await this.saveToDeliveryOrders(orderDelivery, data);
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
      code: orderDelivery.id,
    });
  }

  async saveToDeliveryOrders(orderDelivery, data) {
    if (orderDelivery) {
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.id,
        delivery_id: orderDelivery.id,
        price: orderDelivery.price,
        response_payload: orderDelivery,
        status: OrdersStatus.FINDING_DRIVER,
        service_status: orderDelivery.status,
        tracking_url: orderDelivery.tracking_url,
        logistic_platform: data.logistic_platform,
      };
      const order = await this.ordersRepository.save(deliveryData);
      const historyData: Partial<OrderHistoriesDocument> = {
        order_id: order.id,
        status: OrderHistoriesStatus.FINDING_DRIVER,
        service_status: orderDelivery.status,
      };
      await this.orderHistoriesRepository.save(historyData);
      const getOrder = await this.ordersRepository.findOne(order.id, {
        relations: ['histories'],
      });

      //broadcast
      let eventName = orderDelivery.status;
      if (
        data.delivery_status == 'CANCELLED' ||
        data.delivery_status == 'DRIVER_NOT_FOUND'
      ) {
        eventName = 'reordered';
      }
      this.natsService.clientEmit(
        `deliveries.multiple.order.${eventName}`,
        getOrder,
      );
    } else {
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.id,
        status: OrdersStatus.DRIVER_NOT_FOUND,
        response_payload: 'null',
        logistic_platform: data.logistic_platform,
      };

      //broadcast
      this.natsService.clientEmit(
        `deliveries.multiple.order.failed`,
        deliveryData,
      );

      await this.saveNegativeResultOrder(deliveryData, 'null');
    }
  }

  async saveNegativeResultOrder(
    deliveryData: Partial<OrdersDocument>,
    errContaint: any,
  ) {
    const test = await this.ordersRepository.save(deliveryData);
    console.log(test);

    throw new BadRequestException(
      this.responseService.error(
        HttpStatus.BAD_REQUEST,
        errContaint,
        'Bad Request',
      ),
    );
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
    this.natsService.clientEmit(`deliveries.multiple.order.cancelled`, order);

    return cancelOrderDelivery;
  }

  dummyBroadcast() {
    const dummy = {
      group_id: 'de2af395-c500-4ece-8bcb-be70ea61a5d7',
      logistic_platform: 'ELOG',
      courier_id: 'ef70a958-ad59-4d00-8d64-350b537ae25e',
      customer_id: '53ca9038-0a27-4fd1-b786-bb77e07b63ed',
      customer_address: {
        id: 'b842f6e2-712b-49e2-9f7c-1a36c7bc2b0f',
        name: 'Rumah',
        address:
          'Jl. Pluit Selatan I Blok K No. 7, RT.1/RW.10, Pluit, Kec. Penjaringan, Jakarta Utara 14450',
        location_latitude: -6.302862454540228,
        location_longitude: 106.72258744050023,
        address_detail: 'Lobby K Tower Alamanda',
        postal_code: '12450',
        created_at: '2022-11-03T09:19:16.456Z',
        updated_at: '2022-11-03T09:19:16.456Z',
        deleted_at: null,
      },
      delivery_type: 'DELIVERY',
      orders: [
        {
          id: '56fe2fcb-34c2-4379-8936-e9c2b31213a1',
          no: 'EF218',
          store_id: 'a0e6fc6e-d64c-408d-a291-dcf2b698ab5b',
          merchant_id: 'b0db71eb-0f30-49e2-bc3c-917285084e4c',
          cart_payload: [
            {
              uniqId: '01c6ad35-fa6b-4096-986e-5b809eb73f9d',
              quantity: 1,
              menu: {
                id: '7213fa21-1976-4bb8-9cd2-ed4638195187',
                photo:
                  '/api/v1/orders/order/56fe2fcb-34c2-4379-8936-e9c2b31213a1/0/image/ice-cream-cone-0000.jpg',
                name: 'Combo 1 Chicken ',
                description: 'Combo 1 Chicken ',
                status: 'ACTIVE',
                recomendation: false,
                merchant_id: 'b0db71eb-0f30-49e2-bc3c-917285084e4c',
                sequence: null,
                created_at: '2021-11-08 14:21:34',
                updated_at: '2021-11-08 14:21:34',
                store_avilability_id: null,
                store_id: 'a0e6fc6e-d64c-408d-a291-dcf2b698ab5b',
                menu_prices: [
                  {
                    id: '989cb403-af69-42a7-b3d1-6f058d945646',
                    price: 20000,
                    menu_category_prices: [
                      {
                        id: 'e8917220-dd11-414a-b772-7057adf7a2c4',
                        name: 'DKI Jakarta',
                      },
                    ],
                    menu_sales_channels: [
                      {
                        id: 'c1a089c7-5047-48fe-801e-2f65f0e87997',
                        name: 'eFOOD',
                        platform: 'ONLINE',
                      },
                    ],
                  },
                ],
                variations: [],
                stock_available: true,
                discounted_price: null,
                type: null,
              },
              storeAvilabiltyId: null,
              variantSelected: [],
              note: '',
              price: 20000,
              priceTotal: 20000,
              addOns: [],
              discounted_price: null,
              totalPrice: 20000,
            },
          ],
        },
      ],
      price: 20000,
    };
    this.natsService.clientEmit(`orders.multiple.order.accepted`, dummy);
    return dummy;
  }
}

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
    data = await this.dummyBroadcast();
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
          //logistic_platform: data.logistic_platform,
        };

        //** BROADCAST */
        this.natsService.clientEmit(
          `deliveries.order.multipickup.failed`,
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
        //logistic_platform: data.logistic_platform,
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
        `deliveries.order.multipickup.${eventName}`,
        getOrder,
      );
    } else {
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.id,
        status: OrdersStatus.DRIVER_NOT_FOUND,
        response_payload: 'null',
        //logistic_platform: data.logistic_platform,
      };

      //broadcast
      this.natsService.clientEmit(
        `deliveries.order.multipickup.failed`,
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

  async dummyBroadcast() {
    const dummy = {
      group_id: 'de2af395-c500-4ece-8bcb-be70ea61a5d7',
      logistic_platform: 'ELOG',
      courier_id: 'ef70a958-ad59-4d00-8d64-350b537ae25e',
      customer_id: 'f364f4cc-6934-4c83-a156-f00b8bcd3ba6',
      customer_address: {
        id: '044978cf-2acd-4242-b840-82c582e2fbcb',
        name: 'Unnamed Road',
        address:
          'Unnamed Road, Margaasih, Kec. Margaasih, Kabupaten Bandung, Jawa Barat 40215, Indonesia',
        location_latitude: -6.934957543106043,
        location_longitude: 107.55019046366215,
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
          store_id: '310cf510-028e-4821-a919-d5fc54201ceb',
          merchant_id: '87e9af68-8f23-4697-b900-ac2ac380795c',
          cart_payload: [
            {
              uniqId: '01c6ad35-fa6b-4096-986e-5b809eb73f9d',
              quantity: 1,
              menu: {
                id: 'b0bf901c-dad4-4713-a54c-87706d6da9d8',
                photo:
                  'https://dummyimage.com/600x600/827b82/ffffff&text=Photo+Menu',
                name: 'Paket nasi ayam',
                description: null,
                status: 'ACTIVE',
                recomendation: false,
                merchant_id: '87e9af68-8f23-4697-b900-ac2ac380795c',
                sequence: null,
                created_at: '2022-07-20 14:56:40',
                updated_at: '2022-07-20 14:56:40',
                store_avilability_id: null,
                store_id: '310cf510-028e-4821-a919-d5fc54201ceb',
                menu_prices: [
                  {
                    id: '15196377-c185-420a-8201-7af82eedad36',
                    price: 25000,
                    menu_category_prices: [
                      {
                        id: 'a675d452-89bf-4f3f-9a43-68da93075317',
                        name: 'Kategori 1',
                      },
                    ],
                    menu_sales_channels: [
                      {
                        id: '9384fa74-6dab-484e-ba6a-751a67e69013',
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
        {
          id: '56fe2fcb-34c2-4379-8936-e9c2b31213a2',
          no: 'EF219',
          store_id: '0b5115a6-0f3e-4f7d-95c3-6ee40743739b',
          merchant_id: 'c37588f9-3dfb-4e44-88da-b2bbe1ac3a8b',
          cart_payload: [
            {
              uniqId: '01c6ad35-fa6b-4096-986e-5b809eb73f9d',
              quantity: 1,
              menu: {
                id: '476665e9-bc17-48a9-8a1b-702189af0937',
                photo:
                  'https://s3.ap-southeast-1.amazonaws.com/efood-production/upload_menus/1660750045784-image.png',
                name: 'Vietnamese Chicken',
                description: null,
                status: 'ACTIVE',
                recomendation: false,
                merchant_id: 'c37588f9-3dfb-4e44-88da-b2bbe1ac3a8b',
                sequence: 12,
                created_at: '2022-08-17 22:27:25',
                updated_at: '2022-09-11 19:34:36',
                store_avilability_id: null,
                store_id: '0b5115a6-0f3e-4f7d-95c3-6ee40743739b',
                menu_prices: [
                  {
                    id: '2faba88e-0bc6-48cb-aab8-ecfb63fded03',
                    price: 60500,
                    menu_category_prices: [
                      {
                        id: '1c85b1d0-cc44-49e7-8a3a-885b628b46c6',
                        name: 'Kategori 1',
                      },
                    ],
                    menu_sales_channels: [
                      {
                        id: '63d45d11-ae4e-4af7-bc1c-a99620435c37',
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
    return dummy;
  }
}

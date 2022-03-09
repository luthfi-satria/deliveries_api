import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import {
  OrderHistoriesDocument,
  OrderHistoriesServiceStatus,
  OrderHistoriesStatus,
} from 'src/database/entities/orders-history.entity';
import {
  OrdersDocument,
  OrdersServiceStatus,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import moment from 'moment';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class DeliveriesService {
  logger = new Logger();

  constructor(
    private readonly couriersService: CouriersService,
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderHistoriesRepository: OrderHistoriesRepository,
    private readonly natsService: NatsService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}
  async createOrder(data: any) {
    if (data.delivery_type == 'DELIVERY') {
      const courier = await this.couriersService.findOne(data.courier_id);
      if (!courier) {
        const errContaint: any = {
          value: data.courier_id,
          property: 'courier_id',
          constraint: ['Courier Id tidak ditemukan.'],
        };
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.id,
          response_payload: errContaint,
        };
        this.saveNegativeResultOrder(deliveryData, errContaint);
      }

      const url = `${process.env.BASEURL_CUSTOMERS_SERVICE}/api/v1/internal/customerS/${data.customer_id}`;
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
        this.saveNegativeResultOrder(deliveryData, errContaint);
      }
      const urlStore = `${process.env.BASEURL_MERCHANTS_SERVICE}/api/v1/internal/merchants/stores/${data.store_id}`;
      const store: any = await this.commonService.getHttp(urlStore);
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
        this.saveNegativeResultOrder(deliveryData, errContaint);
      }
      const orderData = {
        origin_contact_name: store.name,
        origin_contact_phone: store.phone,
        origin_address: store.address,
        origin_note: '',
        origin_postal_code: 0,
        origin_coordinate: {
          latitude: store.location_latitude,
          longitude: store.location_longitude,
        },
        destination_contact_name: customer.name,
        destination_contact_phone: customer.phone,
        destination_contact_email: customer.email,
        destination_address: `${data.address.address}`,
        destination_postal_code: data.address.postal_code,
        destination_note: `${data.address.address_detail}`,
        destination_coordinate: {
          latitude: data.address.location_latitude,
          longitude: data.address.location_longitude,
        },
        courier_company: courier.courier.code,
        courier_type: courier.courier.service_code,
        courier_insurance: 0,
        delivery_type: 'now',
        delivery_date: moment().format('YYYY-MM-DD'),
        delivery_time: moment().format('HH:mm'),
        order_note: `No. order: ${data.no}\n `,
        metadata: {},
        items: [],
      };

      if (data.cart_payload.length > 0) {
        let countMenu = 0;
        for (const cartItem of data.cart_payload) {
          const item = {
            id: cartItem.menu.id,
            name: cartItem.menu.name,
            image: cartItem.menu.photo,
            description: cartItem.menu.description,
            value: cartItem.priceTotal,
            quantity: cartItem.quantity,
            height: 1,
            length: 1,
            weight: 1,
            width: 1,
          };
          orderData.items.push(item);

          orderData.order_note += `${cartItem.quantity}x ${cartItem.menu.name} `;
          if (cartItem.variantSelected && cartItem.variantSelected.length > 0) {
            let variations = '';

            for (const variation of cartItem.variantSelected) {
              variations += `${cartItem.quantity}x ${variation.name}, `;
            }
            variations = `(${variations.substring(0, variations.length - 2)}) `;
            orderData.order_note += variations;
          }
          if (cartItem.addOns && cartItem.addOns.length > 0) {
            let addon = '';
            for (const addons of cartItem.addOns) {
              addon += `${addons.qty * cartItem.quantity}x ${
                addons.addons.menu.name
              }, `;
            }
            addon = `(${addon.substring(0, addon.length - 2)}) `;
            orderData.order_note += addon;
          }
          countMenu += 1;
          if (countMenu == data.cart_payload.length) {
            orderData.order_note += `Note: ${cartItem.note}. `;
          } else {
            orderData.order_note += `Note: ${cartItem.note}.\n `;
          }
        }
      }
      orderData.origin_note = orderData.order_note;

      const urlDelivery = `${process.env.BITESHIP_API_BASEURL}/v1/orders`;
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      };
      this.logger.log(orderData, 'Payload Biteship');
      const orderDelivery: any = await this.commonService
        .postHttp(urlDelivery, orderData, headerRequest)
        .catch((err) => {
          const deliveryData: Partial<OrdersDocument> = {
            order_id: data.id,
            status: OrdersStatus.DRIVER_NOT_FOUND,
            response_payload: err,
          };

          //broadcast
          this.natsService.clientEmit(`deliveries.order.failed`, deliveryData);

          this.saveNegativeResultOrder(deliveryData, err);
        });

      if (orderDelivery) {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.id,
          delivery_id: orderDelivery.id,
          price: orderDelivery.price,
          response_payload: orderDelivery,
          status: OrdersStatus.FINDING_DRIVER,
          service_status: orderDelivery.status,
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
        this.natsService.clientEmit(`deliveries.order.${eventName}`, getOrder);
      } else {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.id,
          status: OrdersStatus.DRIVER_NOT_FOUND,
          response_payload: 'null',
        };

        //broadcast
        this.natsService.clientEmit(`deliveries.order.failed`, deliveryData);

        this.saveNegativeResultOrder(deliveryData, 'null');
      }
    }
  }

  saveNegativeResultOrder(
    deliveryData: Partial<OrdersDocument>,
    errContaint: any,
  ) {
    this.ordersRepository.save(deliveryData);

    throw new BadRequestException(
      this.responseService.error(
        HttpStatus.BAD_REQUEST,
        errContaint,
        'Bad Request',
      ),
    );
  }

  async findOrderDeliveryByCriteria(
    data: Partial<OrdersDocument>,
  ): Promise<OrdersDocument> {
    return this.ordersRepository.findOne({ where: data });
  }

  async saveOrderDelivery(
    data: Partial<OrdersDocument>,
  ): Promise<OrdersDocument> {
    return this.ordersRepository.findOne(
      (await this.ordersRepository.save(data)).id,
      {
        relations: ['histories'],
      },
    );
  }

  async saveOrderDeliveryHistory(
    data: Partial<OrderHistoriesDocument>,
  ): Promise<OrderHistoriesDocument> {
    return this.orderHistoriesRepository.save(data);
  }

  async cancelOrder(order_id: string): Promise<any> {
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
    const urlDelivery = `${process.env.BITESHIP_API_BASEURL}/v1/orders/${orderDelivery.delivery_id}`;
    const headerRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
    };
    const data = {
      cancellation_reason: 'Permintaan store',
    };
    const cancelOrderDelivery: any = await this.commonService
      .deleteHttp(urlDelivery, data, headerRequest)
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
    this.natsService.clientEmit(`deliveries.order.cancelled`, order);

    return cancelOrderDelivery;
  }
}

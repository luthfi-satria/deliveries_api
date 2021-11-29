import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { OrderHistoriesDocument } from 'src/database/entities/orders-history.entity';
import { OrdersDocument } from 'src/database/entities/orders.entity';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import moment from 'moment';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly couriersService: CouriersService,
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderHistoriesRepository: OrderHistoriesRepository,
    private readonly natsService: NatsService,
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
        destination_address: data.address.address,
        destination_postal_code: data.address.postal_code,
        destination_note: '',
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
        order_note: '',
        metadata: {},
        items: [],
      };

      if (data.cart_payload.length > 0) {
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
        }
      }
      const urlDelivery = `${process.env.BITESHIP_API_BASEURL}/v1/orders`;
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      };
      const orderDelivery: any = await this.commonService
        .postHttp(urlDelivery, orderData, headerRequest)
        .catch((err) => {
          const deliveryData: Partial<OrdersDocument> = {
            order_id: data.id,
            response_payload: err,
          };
          this.saveNegativeResultOrder(deliveryData, err);
          // throw err;
        });
      if (orderDelivery) {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.id,
          delivery_id: orderDelivery.id,
          price: orderDelivery.price,
          response_payload: orderDelivery,
          status: orderDelivery.status,
        };
        const order = await this.ordersRepository.save(deliveryData);
        const historyData: Partial<OrderHistoriesDocument> = {
          order_id: order.id,
          status: orderDelivery.status,
        };
        await this.orderHistoriesRepository.save(historyData);
        const getOrder = await this.ordersRepository.findOne(order.id, {
          relations: ['histories'],
        });

        //broadcast
        this.natsService.clientEmit(
          `deliveries.order.${orderDelivery.status}`,
          getOrder,
        );
      }
    }
  }

  async saveNegativeResultOrder(
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
}

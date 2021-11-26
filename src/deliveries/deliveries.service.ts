import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { OrderHistoriesDocument } from 'src/database/entities/orders-history.entity';
import { OrdersDocument } from 'src/database/entities/orders.entity';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly couriersService: CouriersService,
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderHistoriesRepository: OrderHistoriesRepository,
    private readonly natsService: NatsService,
  ) {}
  async createOrder(data: any) {
    if (data.delivery_type == 'DELIVERY') {
      const courier = await this.couriersService.findOne(data.courier_id);
      const url = `${process.env.BASEURL_CUSTOMERS_SERVICE}/api/v1/internal/customerS/${data.customer_id}`;
      const customer: any = await this.commonService.getHttp(url);
      const orderData = {
        origin_contact_name: courier.courier.name,
        origin_contact_phone: '081740781720',
        origin_address: 'Plaza Senayan, Jalan Asia Afrik...',
        origin_note: 'Deket pintu masuk STC',
        origin_postal_code: 12440,
        origin_coordinate: {
          latitude: -6.2253114,
          longitude: 106.7993735,
        },
        destination_contact_name: customer.name,
        destination_contact_phone: customer.phone,
        destination_contact_email: customer.email,
        destination_address: data.address.address,
        destination_postal_code: data.address.postal_code,
        destination_note: '',
        destination_coordinate: {
          latitude: -6.28927, // data.address.location_latitude,
          longitude: 106.77492000000007, //data.address.location_longitude,
        },
        courier_company: 'grab', // courier.courier.name,
        courier_type: 'instant', // courier.courier.service_type,
        courier_insurance: 50000,
        delivery_type: 'now',
        order_note: 'Please be carefull',
        metadata: {},
        items: [
          {
            id: '5db7ee67382e185bd6a14608',
            name: 'Black L',
            image: '',
            description: 'White Shirt',
            value: 165000,
            quantity: 1,
            height: 1,
            length: 1,
            weight: 1000,
            width: 1,
          },
        ],
      };
      const urlDelivery = `${process.env.BITESHIP_API_BASEURL}/v1/orders`;
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      };
      const orderDelivery: any = await this.commonService.postHttp(
        urlDelivery,
        orderData,
        headerRequest,
      );
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
      this.orderHistoriesRepository.save(historyData);

      //broadcast
      this.natsService.clientEmit(
        `deliveries.order.${orderDelivery.status}`,
        orderDelivery,
      );
    }
  }

  async findOrderDeliveryByCriteria(
    data: Partial<OrdersDocument>,
  ): Promise<OrdersDocument> {
    return this.ordersRepository.findOne({ where: data });
  }

  async saveOrderDelivery(
    data: Partial<OrdersDocument>,
  ): Promise<OrdersDocument> {
    return this.ordersRepository.save(data);
  }

  async saveOrderDeliveryHistory(
    data: Partial<OrderHistoriesDocument>,
  ): Promise<OrderHistoriesDocument> {
    return this.orderHistoriesRepository.save(data);
  }
}

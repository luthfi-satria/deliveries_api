import { Injectable } from '@nestjs/common';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { OrderHistoriesDocument } from 'src/database/entities/orders-history.entity';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Injectable()
export class CallbacksService {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly natsService: NatsService,
  ) {}

  async biteshipOrderStatus(data: any) {
    console.log(typeof data, '<<===== TYPEOF DATA');
    console.log(data, '<<===== DATA');

    const orderDelivery =
      await this.deliveriesService.findOrderDeliveryByCriteria({
        delivery_id: data.order_id,
      });

    if (orderDelivery) {
      let eventName = '';
      switch (data.status) {
        case 'picking_up':
          eventName = 'routed_to_origin';
          break;
        case 'dropping_off':
          eventName = 'dropped';
          break;
        default:
          eventName = data.status;
      }
      const orderHistory: Partial<OrderHistoriesDocument> = {
        order_id: orderDelivery.id,
        status: eventName,
      };
      await this.deliveriesService.saveOrderDeliveryHistory(orderHistory);

      orderDelivery.status = eventName;
      const order = await this.deliveriesService.saveOrderDelivery(
        orderDelivery,
      );

      //broadcast
      this.natsService.clientEmit(`deliveries.order.${eventName}`, order);
      return { status: true };
    } else {
      return { status: false };
    }
  }
}

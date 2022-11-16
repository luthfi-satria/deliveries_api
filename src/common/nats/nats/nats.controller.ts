import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Controller('nats')
export class NatsController {
  logger = new Logger(NatsController.name);

  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveriesMultipleService: DeliveriesMultipleService,
  ) {}

  @EventPattern('orders.order.accepted')
  async saveMenuEfood(@Payload() data: any) {
    this.logger.log('orders.order.accepted');
    // console.log('data: ', data);
    this.deliveriesService.createOrder(data);
  }

  @EventPattern('orders.delivery.reordered')
  async deliveryReordered(@Payload() data: any) {
    this.logger.log('orders.delivery.reordered');
    data.delivery_status = 'DRIVER_NOT_FOUND';
    this.deliveriesService.createOrder(data);
  }

  //** Handling Multipickup order Elog */
  @EventPattern('orders.order.multipickupaccepted')
  async saveEfoodMultipickup(@Payload() data: any) {
    this.logger.log('orders.order.multipickupaccepted');
    this.deliveriesMultipleService.createMultipleOrder(data);
  }

  //** Deliveries Multipickup Elog Reordered */
  @EventPattern('orders.order.multipickupreordered')
  async deliveryReorderedMultipickup(@Payload() data: any) {
    this.logger.log('orders.order.multipickupreordered');
    data.delivery_status = 'DRIVER_NOT_FOUND';
    this.deliveriesMultipleService.createMultipleOrder(data);
  }
}

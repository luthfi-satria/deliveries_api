import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Controller('rabbitmq')
export class RabbitMQController {
  logger = new Logger(RabbitMQController.name);

  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveriesMultipleService: DeliveriesMultipleService,
  ) {}

  @EventPattern('orders.order.accepted')
  async saveMenuEfood(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('orders.order.accepted');
    // console.log('data: ', data);
    this.deliveriesService.createOrder(data);
    this.acknowledgement(context);
  }

  @EventPattern('orders.delivery.reordered')
  async deliveryReordered(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('orders.delivery.reordered');
    data.delivery_status = 'DRIVER_NOT_FOUND';
    this.deliveriesService.createOrder(data);
    this.acknowledgement(context);
  }

  //** Handling Multipickup order Elog */
  @EventPattern('orders.order.multipickupaccepted')
  async saveEfoodMultipickup(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('orders.order.multipickupaccepted');
    this.deliveriesMultipleService.createMultipleOrder(data);
    this.acknowledgement(context);
  }

  //** Deliveries Multipickup Elog Reordered */
  @EventPattern('orders.delivery.multipickupreordered')
  async deliveryReorderedMultipickup(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log('orders.delivery.multipickupreordered');
    data.delivery_status = 'DRIVER_NOT_FOUND';
    this.deliveriesMultipleService.createMultipleOrder(data);
    this.acknowledgement(context);
  }

  @EventPattern('deliveries.order.rmq')
  async testRmQMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(data, '<= deliveries.order.rmq');
    this.acknowledgement(context);
  }

  acknowledgement(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    channel.ack(originalMsg);
  }
}

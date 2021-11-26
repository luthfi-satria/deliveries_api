import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Controller('nats')
export class NatsController {
  logger = new Logger(NatsController.name);

  constructor(private readonly deliveriesService: DeliveriesService) {}

  @EventPattern('orders.order.accepted')
  async saveMenuEfood(@Payload() data: any) {
    this.logger.log('orders.order.accepted');
    this.deliveriesService.createOrder(data);
  }
}

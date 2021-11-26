import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRepository,
      OrdersRepository,
      OrderHistoriesRepository,
    ]),
    HttpModule,
  ],
  controllers: [DeliveriesController],
  providers: [
    DeliveriesService,
    CouriersService,
    CommonService,
    ResponseService,
    MessageService,
    NatsService,
  ],
})
export class DeliveriesModule {}

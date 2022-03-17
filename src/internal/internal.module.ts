import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRepository,
      OrdersRepository,
      OrderHistoriesRepository,
    ]),
    HttpModule,
  ],
  controllers: [InternalController],
  providers: [
    InternalService,
    AuthInternalService,
    CommonService,
    ResponseService,
    MessageService,
    CouriersService,
    DeliveriesService,
    NatsService,
  ],
  exports: [AuthInternalService],
})
export class InternalModule {}

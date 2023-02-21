import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
// import { NatsService } from 'src/common/nats/nats/nats.service';
import { RedisDeliveryService } from 'src/common/redis/redis-delivery.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { DeliveriesMultipleDummyService } from 'src/deliveries/deliveries-multiple-dummy.service';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { ElogService } from 'src/elog/elog.service';
import { ElogRepository } from 'src/elog/repository/elog.repository';
import { MessageService } from 'src/message/message.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { ResponseService } from 'src/response/response.service';
import { SettingService } from 'src/setting/setting.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { InternalMultipickupController } from './multipickup-internal.controller';
import { InternalMultipickupService } from './multipickup-internal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRepository,
      OrdersRepository,
      ThirdPartyRequestsRepository,
      OrderHistoriesRepository,
      SettingsRepository,
      ElogRepository,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [InternalController, InternalMultipickupController],
  providers: [
    InternalService,
    AuthInternalService,
    InternalMultipickupService,
    CommonService,
    ResponseService,
    RedisDeliveryService,
    MessageService,
    SettingService,
    CouriersService,
    DeliveriesService,
    // NatsService,
    ElogService,
    DeliveriesMultipleService,
    DeliveriesMultipleDummyService,
    RabbitMQService,
  ],
  exports: [AuthInternalService],
})
export class InternalModule {}

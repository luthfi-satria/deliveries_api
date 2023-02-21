import { Module } from '@nestjs/common';
import { CallbacksService } from './callbacks.service';
import { CallbacksController } from './callbacks.controller';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
// import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CommonService } from 'src/common/common.service';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { SettingService } from 'src/setting/setting.service';
import { RedisDeliveryService } from 'src/common/redis/redis-delivery.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { BullModule } from '@nestjs/bull';
import { ThirdPartyCallbacksRepository } from 'src/database/repository/third-party-callback.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { DeliveriesMultipleDummyService } from 'src/deliveries/deliveries-multiple-dummy.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdersRepository,
      OrderHistoriesRepository,
      CourierRepository,
      SettingsRepository,
      ThirdPartyCallbacksRepository,
      ThirdPartyRequestsRepository,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [CallbacksController],
  providers: [
    CallbacksService,
    ResponseService,
    MessageService,
    DeliveriesService,
    // NatsService,
    CouriersService,
    CommonService,
    SettingService,
    RedisDeliveryService,
    DeliveriesMultipleService,
    DeliveriesMultipleDummyService,
    RabbitMQService,
  ],
})
export class CallbacksModule {}

import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { RedisDeliveryService } from 'src/common/redis/redis-delivery.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingService } from 'src/setting/setting.service';
import { DeliveriesMultipleDummyService } from './deliveries-multiple-dummy.service';
import { DeliveriesMultipleService } from './deliveries-multiple.service';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRepository,
      OrdersRepository,
      OrderHistoriesRepository,
      ThirdPartyRequestsRepository,
      SettingsRepository,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [DeliveriesController],
  providers: [
    DeliveriesService,
    DeliveriesMultipleService,
    CouriersService,
    CommonService,
    ResponseService,
    MessageService,
    NatsService,
    SettingService,
    RedisDeliveryService,
    DeliveriesMultipleDummyService,
  ],
})
export class DeliveriesModule {}

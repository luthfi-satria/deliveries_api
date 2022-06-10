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
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingService } from 'src/setting/setting.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRepository,
      OrdersRepository,
      ThirdPartyRequestsRepository,
      OrderHistoriesRepository,
      SettingsRepository,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [InternalController],
  providers: [
    InternalService,
    AuthInternalService,
    CommonService,
    ResponseService,
    RedisDeliveryService,
    MessageService,
    SettingService,
    CouriersService,
    DeliveriesService,
    NatsService,
  ],
  exports: [AuthInternalService],
})
export class InternalModule {}

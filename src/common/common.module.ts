import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonStorageService } from './storage/storage.service';
import { NotificationService } from './notification/notification.service';
import { FetchCourierService } from './courier/fetch-courier.service';
import { HttpModule } from '@nestjs/axios';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { NatsController } from './nats/nats/nats.controller';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { NatsService } from './nats/nats/nats.service';
import { BullModule } from '@nestjs/bull';
import { RedisDeliveryService } from './redis/redis-delivery.service';
import { RedisDeliveryProcessor } from './redis/redis-delivery.processor';
import { SettingService } from 'src/setting/setting.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    TypeOrmModule.forFeature([
      CourierRepository,
      ThirdPartyRequestsRepository,
      OrdersRepository,
      OrderHistoriesRepository,
      SettingsRepository,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  providers: [
    CommonStorageService,
    CommonService,
    NotificationService,
    FetchCourierService,
    ResponseService,
    MessageService,
    SettingService,
    DeliveriesService,
    DeliveriesMultipleService,
    RedisDeliveryService,
    RedisDeliveryProcessor,
    CouriersService,
    NatsService,
  ],
  exports: [CommonStorageService, NotificationService, FetchCourierService],
  controllers: [NatsController],
})
export class CommonModule {}

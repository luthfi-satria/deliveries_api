import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
// import { NatsService } from 'src/common/nats/nats/nats.service';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { DeliveriesMultipleDummyService } from 'src/deliveries/deliveries-multiple-dummy.service';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { ElogService } from 'src/elog/elog.service';
import { MessageService } from 'src/message/message.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { ResponseService } from 'src/response/response.service';
import { CronElogRecreateMultipickupService } from './cron-elog-recreate-multipickup.service';
import { CronElogController } from './cron-elog.controller';
import { CronElogService } from './cron-elog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdersRepository,
      SettingsRepository,
      OrderHistoriesRepository,
      ThirdPartyRequestsRepository,
    ]),
    BullModule.registerQueue({
      name: 'deliveries',
    }),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [CronElogController],
  providers: [
    CronElogService,
    ElogService,
    MessageService,
    ResponseService,
    Logger,
    CronElogRecreateMultipickupService,
    CommonService,
    DeliveriesMultipleService,
    // NatsService,
    DeliveriesMultipleDummyService,
    RabbitMQService,
  ],
  exports: [TypeOrmModule],
})
export class CronElogModule {}

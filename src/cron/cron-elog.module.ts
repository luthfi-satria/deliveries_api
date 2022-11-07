import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ElogService } from 'src/elog/elog.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CronElogController } from './cron-elog.controller';
import { CronElogService } from './cron-elog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdersRepository,
      SettingsRepository,
      OrderHistoriesRepository,
    ]),
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
  ],
  exports: [TypeOrmModule],
})
export class CronElogModule {}

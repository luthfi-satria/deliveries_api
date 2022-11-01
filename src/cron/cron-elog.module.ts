import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CronElogController } from './cron-elog.controller';
import { CronElogService } from './cron-elog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdersRepository]),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [CronElogController],
  providers: [CronElogService, MessageService, ResponseService, Logger],
  exports: [TypeOrmModule],
})
export class CronElogModule {}

import { RedisDeliveryService } from './../common/redis/redis-delivery.service';
import { Module } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { CouriersController } from './couriers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { SettingService } from 'src/setting/setting.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourierRepository, SettingsRepository]),
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [CouriersController],
  providers: [
    CouriersService,
    SettingService,
    ResponseService,
    MessageService,
    RedisDeliveryService,
  ],
})
export class CouriersModule {}

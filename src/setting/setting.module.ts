import { RedisDeliveryService } from './../common/redis/redis-delivery.service';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsRepository, CourierRepository]),
    forwardRef(() => CommonModule),
    BullModule.registerQueue({
      name: 'deliveries',
    }),
  ],
  controllers: [SettingController],
  providers: [
    SettingService,
    MessageService,
    ResponseService,
    RedisDeliveryService,
    CouriersService,
  ],
  exports: [TypeOrmModule, SettingService],
})
export class SettingModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsRepository]),
    forwardRef(() => CommonModule),
  ],
  controllers: [SettingController],
  providers: [SettingService, MessageService, ResponseService],
  exports: [TypeOrmModule, SettingService],
})
export class SettingModule {}

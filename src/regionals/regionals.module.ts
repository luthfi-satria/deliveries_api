import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { RegionalsController } from './regionals.controller';
import { RegionalsService } from './regionals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsRepository]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [RegionalsController],
  providers: [
    RegionalsService, 
    MessageService, 
    ResponseService, 
    CommonService,
  ],
  exports: [RegionalsService],
})
export class RegionalsModule {}

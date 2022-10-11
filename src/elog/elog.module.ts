import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ElogController } from './elog.controller';
import { ElogService } from './elog.service';
import { ElogRepository } from './repository/elog.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ElogRepository, SettingsRepository]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [ElogController],
  providers: [ElogService, MessageService, ResponseService],
  exports: [ElogService],
})
export class ElogModule {}

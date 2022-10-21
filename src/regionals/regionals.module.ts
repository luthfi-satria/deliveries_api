import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonService } from 'src/common/common.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { RegionalsController } from './regionals.controller';
import { RegionalsService } from './regionals.service';

@Module({
  imports: [
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

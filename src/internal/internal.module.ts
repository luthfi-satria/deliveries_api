import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourierRepository]), HttpModule],
  controllers: [InternalController],
  providers: [
    InternalService,
    AuthInternalService,
    CommonService,
    ResponseService,
    MessageService,
    CouriersService,
  ],
  exports: [AuthInternalService],
})
export class InternalModule {}

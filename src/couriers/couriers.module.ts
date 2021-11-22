import { Module } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { CouriersController } from './couriers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CourierRepository])],
  controllers: [CouriersController],
  providers: [CouriersService, ResponseService, MessageService],
})
export class CouriersModule {}

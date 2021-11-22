import { Module } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { CouriersController } from './couriers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierDocument } from 'src/database/entities/couriers.entity';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourierDocument])],
  controllers: [CouriersController],
  providers: [CouriersService, ResponseService, MessageService],
})
export class CouriersModule {}

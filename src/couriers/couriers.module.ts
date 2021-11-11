import { Module } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { CouriersController } from './couriers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierDocument } from 'src/database/entities/couriers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourierDocument])],
  controllers: [CouriersController],
  providers: [CouriersService],
})
export class CouriersModule {}

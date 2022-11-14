import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouriersModule } from 'src/couriers/couriers.module';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { ElogCourierSeederService } from './elog-courier-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourierRepository]), CouriersModule],
  providers: [ElogCourierSeederService],
  exports: [ElogCourierSeederService],
})
export class CourierSeederModule {}

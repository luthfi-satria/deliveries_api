import { Injectable, Logger } from '@nestjs/common';
import { CourierDocument } from 'src/database/entities/couriers.entity';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { elogCouriersData } from './elog-courier-seed.data';

@Injectable()
export class ElogCourierSeederService {
  constructor(private readonly courierRepo: CourierRepository) {}
  async create(): Promise<CourierDocument[]> {
    const elogCouriers = await this.courierRepo
      .createQueryBuilder()
      .where('code = :code', { code: 'elog' })
      .getCount();
    if (elogCouriers) {
      Logger.verbose('Data elog couriers seeder had been inserted');
      return null;
    }

    try {
      console.log(elogCouriersData);
      await this.courierRepo.save(elogCouriersData);
    } catch (err) {
      Logger.error(err);
    }
  }
}

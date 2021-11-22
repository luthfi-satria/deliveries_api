import { EntityRepository, Repository } from 'typeorm';
import { CourierDocument } from '../entities/couriers.entity';

@EntityRepository(CourierDocument)
export class CourierRepository extends Repository<CourierDocument> {
  constructor() {
    super();
  }
}

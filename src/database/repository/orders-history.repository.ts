import { EntityRepository, Repository } from 'typeorm';
import { OrderHistoriesDocument } from '../entities/orders-history.entity';

@EntityRepository(OrderHistoriesDocument)
export class OrderHistoriesRepository extends Repository<OrderHistoriesDocument> {
  constructor() {
    super();
  }
}

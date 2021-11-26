import { EntityRepository, Repository } from 'typeorm';
import { OrdersDocument } from '../entities/orders.entity';

@EntityRepository(OrdersDocument)
export class OrdersRepository extends Repository<OrdersDocument> {
  constructor() {
    super();
  }
}

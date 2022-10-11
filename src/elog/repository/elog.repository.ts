import { EntityRepository, Repository } from 'typeorm';
import { elogDocuments } from '../entities/elog.entities';

@EntityRepository(elogDocuments)
export class ElogRepository extends Repository<elogDocuments> {
  constructor() {
    super();
  }
}

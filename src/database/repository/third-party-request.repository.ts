import { EntityRepository, Repository } from 'typeorm';
import { ThirdPartyRequestsDocument } from '../entities/third-party-request.entity';

@EntityRepository(ThirdPartyRequestsDocument)
export class ThirdPartyRequestsRepository extends Repository<ThirdPartyRequestsDocument> {
  constructor() {
    super();
  }
}

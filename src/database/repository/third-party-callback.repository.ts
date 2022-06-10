import { EntityRepository, Repository } from 'typeorm';
import { ThirdPartyCallbacksDocument } from '../entities/third-party-callback.entity';

@EntityRepository(ThirdPartyCallbacksDocument)
export class ThirdPartyCallbacksRepository extends Repository<ThirdPartyCallbacksDocument> {
  constructor() {
    super();
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class CallbacksService {
  biteshipOrderStatus(data: any) {
    console.log(typeof data, '<<===== TYPEOF DATA');
    console.log(data, '<<===== DATA');
    return { status: true };
  }
}

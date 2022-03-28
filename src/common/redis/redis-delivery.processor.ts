import { CouriersService } from 'src/couriers/couriers.service';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
// import { StoresService } from 'src/stores/stores.service';

@Processor('deliveries')
export class RedisDeliveryProcessor {
  constructor(private couriersService: CouriersService) {}
  logger = new Logger(RedisDeliveryProcessor.name);

  @Process('autoSyncCourier')
  async handleAutoSyncCourier(job: Job) {
    try {
      this.logger.debug('AUTO DELIVERY JOB EXECUTED. JOB: ', job.data);
      await this.couriersService.fetch();
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}

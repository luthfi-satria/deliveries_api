import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Queue } from 'bull';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  CreateAutoSyncDeliveryDto,
  ClearAutoSyncDeliveryDto,
} from './dto/redis-delivery.dto';

@Injectable()
export class RedisDeliveryService {
  constructor(
    @InjectQueue('deliveries') private readonly deliveriesQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  logger = new Logger(RedisDeliveryService.name);

  async createAutoSyncCourierJob(data: CreateAutoSyncDeliveryDto) {
    try {
      const jobId = `couriers-${data.job_id}`;

      await this.deliveriesQueue.add('autoSyncCourier', data, {
        repeat: data.repeat,
        jobId: jobId,
      });

      this.logger.debug('AUTO COURIER CREATED. PAYLOAD: ');
      console.log(data.repeat);

      //=> list all repeat job
      const js = await this.deliveriesQueue.getRepeatableJobs();
      this.logger.debug('ACTIVE JOBS: ');
      console.log(js);
    } catch (error) {
      console.error(error);
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [
          this.messageService.get('general.redis.createQueueFail'),
          error.message,
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  async clearAutoSyncCourierJobs(data: ClearAutoSyncDeliveryDto) {
    try {
      this.logger.debug('CLEAR JOBS EXECUTED');
      const jobId = `couriers-${data.job_id}`;

      //=> list all repeat job
      const js = await this.deliveriesQueue.getRepeatableJobs();

      //=> find repeat job with id
      const findJobs = js.filter((item) => item.id == jobId);

      //=> delete every repeat job
      for (const findJob of findJobs) {
        await this.deliveriesQueue.removeRepeatable('autoSyncCourier', {
          cron: findJob.cron,
          jobId: findJob.id,
          endDate: findJob.endDate,
          tz: findJob.tz,
        });
      }
    } catch (error) {
      console.error(error);
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [
          this.messageService.get('general.redis.createQueueFail'),
          error.message,
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  async checkJobs() {
    console.log(await this.deliveriesQueue.getJobs([]));
    // return this.deliveriesQueue.getJobs([]);
  }

  // async DeleteAutoSyncBalanceDto(data: DeleteAutoSyncBalanceDto) {
  //   try {
  //     const queueId = `orders-${data.order_id}`;
  //     this.logger.debug('AUTO CANCEL QUEUE DELETED. ID: ' + data.order_id);
  //     return await this.ordersQueue.removeJobs(data.order_id);
  //   } catch (error) {
  //     console.error(error);
  //     const errors: RMessage = {
  //       value: '',
  //       property: '',
  //       constraint: [
  //         this.messageService.get('general.redis.createQueueFail'),
  //         error.message,
  //       ],
  //     };
  //     throw new BadRequestException(
  //       this.responseService.error(
  //         HttpStatus.BAD_REQUEST,
  //         errors,
  //         'Bad Request',
  //       ),
  //     );
  //   }
  // }
}

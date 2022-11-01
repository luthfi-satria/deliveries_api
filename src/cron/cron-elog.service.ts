import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom, map } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class CronElogService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly httpService: HttpService,
  ) {}

  private readonly logger = new Logger(CronElogService.name);

  @Cron('45 * * * * *')
  retrieveElogStatus() {
    this.logger.log('Cron is Running');
    // this.getDeliveriesOrderData();
  }

  async getMultiPickupOrders() {}

  /**
   *
   * @param store_ids
   * @returns
   */
  async callInternalOrders(store_ids: string[]) {
    // Communicate with merchants service
    try {
      const headerRequest = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const url = `${process.env.BASEURL_ORDERS_SERVICE}/api/v1/internal/orders-group`;

      const targetStatus = await firstValueFrom(
        this.httpService
          .post(url, { store_ids: store_ids }, headerRequest)
          .pipe(map((resp) => resp.data)),
      );
      return targetStatus;
    } catch (error) {
      throw error;
    }
  }
}

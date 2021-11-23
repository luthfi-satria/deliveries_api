import { Injectable } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonService } from 'src/common/common.service';
import { CouriersService } from 'src/couriers/couriers.service';

@Injectable()
export class InternalService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
    private readonly couriersService: CouriersService,
  ) {}

  async getCouriersBulk(ids: string[]): Promise<any> {
    try {
      return { couriers: await this.couriersService.getBulkCouriers(ids) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

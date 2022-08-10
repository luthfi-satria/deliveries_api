import { Injectable } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonService } from 'src/common/common.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { DeliveriesService } from '../deliveries/deliveries.service';

@Injectable()
export class InternalService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
    private readonly couriersService: CouriersService,
    private readonly deliveryService: DeliveriesService,
  ) {}

  async getCouriersBulk(ids: string[]): Promise<any> {
    try {
      return { couriers: await this.couriersService.getBulkCouriers(ids) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getDeliveryPrice(data: any): Promise<any> {
    try {
      return { data: await this.couriersService.findAll(data) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async cancelDelivery(orderId: string) {
    return await this.deliveryService.cancelOrder(orderId);
  }
}

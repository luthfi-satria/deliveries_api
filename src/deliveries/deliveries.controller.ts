import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DeliveriesMultipleService } from './deliveries-multiple.service';
import { DeliveriesService } from './deliveries.service';

@Controller('api/v1/deliveries')
export class DeliveriesController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveriesMultipleService: DeliveriesMultipleService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Delete('orders/:oid')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteOrder(@Param('oid') order_id: string): Promise<RSuccessMessage> {
    try {
      await this.deliveriesService.cancelOrder(order_id);
      return this.responseService.success(
        true,
        this.messageService.get('delivery.general.success'),
      );
    } catch (errList) {
      console.error(errList);
      throw errList;
    }
  }

  @Post('testting-elog')
  @ResponseStatusCode()
  async testElog(@Payload() data: any): Promise<any> {
    await this.deliveriesMultipleService.createMultipleOrder(data);
    return this.responseService.success(
      true,
      this.messageService.get('delivery.general.success'),
    );
  }
}

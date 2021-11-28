import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CallbacksService } from './callbacks.service';

@Controller('api/v1/deliveries')
export class CallbacksController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly callbacksService: CallbacksService,
  ) {}

  @Post('callbacks/biteship-order-status')
  @HttpCode(200)
  async biteshipOrderStatus(@Body() data: any) {
    return this.responseService.success(
      true,
      this.messageService.get('delivery.general.success'),
      this.callbacksService.biteshipOrderStatus(data),
    );
  }
}

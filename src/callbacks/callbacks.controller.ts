import { Body, Controller, Post } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CallbacksService } from './callbacks.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';

@Controller('api/v1/deliveries')
export class CallbacksController {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly callbacksService: CallbacksService,
  ) {}

  @Post('callbacks/biteship-order-status')
  async biteshipOrderStatus(@Body() data: any) {
    return this.responseService.success(
      true,
      this.messageService.get('delivery.general.success'),
      this.callbacksService.biteshipOrderStatus(data),
    );
  }
}

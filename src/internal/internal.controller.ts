import { Controller, Get, Query } from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { InternalService } from './internal.service';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';

@Controller('api/v1/deliveries')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('internal/couriers/bulk')
  @ResponseStatusCode()
  async getCouriersBulk(@Query() data: any): Promise<any> {
    return this.internalService.getCouriersBulk(data.ids);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { InternalService } from './internal.service';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { GetCouriersBulk, GetDeliveryPrice } from './dto/courier.dto';

@Controller('api/v1/deliveries')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('internal/couriers/bulk')
  @ResponseStatusCode()
  async getCouriersBulk(@Query() data: GetCouriersBulk): Promise<any> {
    return this.internalService.getCouriersBulk(data.ids);
  }

  @Get('internal/couriers/price')
  @ResponseStatusCode()
  async getDeliveryPrice(@Query() data: GetDeliveryPrice): Promise<any> {
    return this.internalService.getDeliveryPrice(data);
  }
}

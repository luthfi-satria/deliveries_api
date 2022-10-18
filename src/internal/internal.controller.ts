import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { InternalService } from './internal.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { GetCouriersBulk, GetDeliveryPrice } from './dto/courier.dto';
import { ElogService } from 'src/elog/elog.service';

@Controller('api/v1/deliveries')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly elogService: ElogService,
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

  @Delete('internal/orders/:oid')
  @ResponseStatusCode()
  async deleteOrder(@Param('oid') order_id: string): Promise<any> {
    try {
      return await this.internalService.cancelDelivery(order_id);
    } catch (errList) {
      console.error(errList);
      throw errList;
    }
  }

  @Get('internal/elog/settings')
  @ResponseStatusCode()
  async listElogSettings(): Promise<any> {
    try {
      return await this.elogService.listElogSettings();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

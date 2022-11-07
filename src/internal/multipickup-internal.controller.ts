import { Body, Controller, Get, Query } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { GetDeliveryPrice } from './dto/courier.dto';
import { InternalMultipickupService } from './multipickup-internal.service';

@Controller('api/v1/deliveries')
export class InternalMultipickupController {
  constructor(
    private readonly internalMultipickupService: InternalMultipickupService,
  ) {}

  @Get('internal/couriers-multipickup/price')
  @ResponseStatusCode()
  async getDeliveryMultipickupPrice(): Promise<any> {
    return this.internalMultipickupService.getDeliveryMultipickupPrice();
  }
}

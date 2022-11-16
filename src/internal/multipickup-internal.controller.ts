import { Body, Controller, Post } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ElogCouriersAvailabilityDocuments } from './dto/elog-couriers.dto';
import { InternalMultipickupService } from './multipickup-internal.service';

@Controller('api/v1/deliveries')
export class InternalMultipickupController {
  constructor(
    private readonly internalMultipickupService: InternalMultipickupService,
  ) {}

  @Post('internal/couriers/price-multipickup')
  @ResponseStatusCode()
  async getDeliveryMultipickupPrice(@Body() data: any): Promise<any> {
    return this.internalMultipickupService.getDeliveryMultipickupPrice(data);
  }

  @Post('internal/couriers/elog/driver-availability')
  @ResponseStatusCode()
  async getElogDriverAvailability(
    @Body() data: ElogCouriersAvailabilityDocuments,
  ): Promise<any> {
    return this.internalMultipickupService.getElogDriverAvailability(data);
  }
}

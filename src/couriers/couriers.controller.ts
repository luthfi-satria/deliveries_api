import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { FindCourierDto } from './dto/find-courier.dto';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';

@Controller('api/v1/deliveries')
export class CouriersController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly couriersService: CouriersService,
  ) {}

  @Get('couriers')
  @ResponseStatusCode()
  async findAll(@Query() data: FindCourierDto) {
    return this.responseService.success(
      true,
      this.messageService.get('delivery.getAllCouriers.success'),
      await this.couriersService.findAll(data),
    );
  }

  @Get('couriers/:courier_id')
  @ResponseStatusCode()
  async findOne(@Param('courier_id') id: string) {
    return this.responseService.success(
      true,
      this.messageService.get('delivery.getAllCouriers.success'),
      await this.couriersService.findOne(id),
    );
  }

  @Post('couriers/fetch')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async fetch() {
    return this.responseService.success(
      true,
      this.messageService.get('delivery.fetchCouriers.success'),
      await this.couriersService.fetch(),
    );
  }

  @Put('couriers/:courier_id')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateCourier(
    @Param('courier_id') courierId: string,
    @Body() updateCourierDto: UpdateCourierDto,
  ) {
    updateCourierDto.courierId = courierId;
    return this.responseService.success(
      true,
      this.messageService.get('delivery.updateCourier.success'),
      await this.couriersService.updateCourier(updateCourierDto),
    );
  }
}

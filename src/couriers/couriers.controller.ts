import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { CreateCourierDto } from './dto/create-courier.dto';
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

  @Post()
  create(@Body() createCourierDto: CreateCourierDto) {
    return this.couriersService.create(createCourierDto);
  }

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourierDto: UpdateCourierDto) {
    return this.couriersService.update(+id, updateCourierDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couriersService.remove(+id);
  }
}

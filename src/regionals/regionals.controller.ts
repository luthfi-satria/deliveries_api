import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { RegionalsService } from './regionals.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { RegionalsDTO } from './dto/regionals.dto';
import { elogDocuments } from 'src/elog/entities/elog.entities';

@Controller('api/v1/deliveries/elog')
export class RegionalsController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly regionalsService: RegionalsService,
  ) {}

  //** ADD REGIONAL ELOG */
  @Get('/regionals')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getAllRegionals(@Query() data: RegionalsDTO): Promise<RSuccessMessage> {
    try {
      const elogRegionals = await this.regionalsService.getAllRegionals(data);
      return this.responseService.success(
        true,
        this.messageService.get('delivery.general.success'),
        elogRegionals,
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  //** UPDATED REGIONALS */
  @Put('/regionals')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatedStatus(@Body() param: elogDocuments): Promise<RSuccessMessage> {
    try {
      const updatedRegionals = await this.regionalsService.updatedStatus(param);
      return this.responseService.success(
        true,
        this.messageService.get('delivery.general.success'),
        updatedRegionals,
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

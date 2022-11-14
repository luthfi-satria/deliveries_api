import { Controller, Get, Query } from '@nestjs/common';
import { RegionalsService } from './regionals.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { RegionalsDTO } from './dto/regionals.dto';

@Controller('api/v1/deliveries/elog')
export class RegionalsController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly regionalsService: RegionalsService,
  ) {}

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
}

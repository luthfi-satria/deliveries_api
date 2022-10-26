import { Controller, Get, Param } from '@nestjs/common';
import { RegionalsService } from './regionals.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';

@Controller('api/v1/deliveries/elog')
export class RegionalsController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly regionalsService: RegionalsService,
  ) {}

  @Get('/regionals/:name/:page/:limit')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async regionalsElogByName(
    @Param('name') name: string,
    @Param('limit') limit: string,
    @Param('page') page: string,
  ): Promise<RSuccessMessage> {
    try {
      const elogRegionals =  await this.regionalsService.listElogRegionals(
        name, 
        limit, 
        page
        );
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

  @Get('/regionals/:page/:limit')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getAllRegionals(
    @Param('limit') limit: any,
    @Param('page') page: any,
  ): Promise<RSuccessMessage> {
    try {
      console.log('testting');
      const elogRegionals =  await this.regionalsService.getAllRegionals(
        limit, 
        page
        );
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

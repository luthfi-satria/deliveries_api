import { Body, Controller, Get, Put } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { EditElogSettingsDto } from './dto/elog.dto';
import { ElogService } from './elog.service';

@Controller('api/v1/deliveries/elog')
export class ElogController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly elogService: ElogService,
  ) {}

  /**
   *
   * @returns
   */
  @Get('/settings')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listElogSettings(): Promise<RSuccessMessage> {
    try {
      const ElogSettings = await this.elogService.listElogSettings();
      return this.responseService.success(
        true,
        this.messageService.get('delivery.general.success'),
        ElogSettings,
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   *
   * @param param
   * {
   *  "id" : string,
   *  "value" : string,
   * }
   * @returns
   */
  @Put('/settings')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async editElogSettings(
    @Body() param: EditElogSettingsDto,
  ): Promise<RSuccessMessage> {
    try {
      const updateElogSettings = await this.elogService.updateElogSettings(
        param,
      );
      return this.responseService.success(
        true,
        this.messageService.get('delivery.general.success'),
        updateElogSettings,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

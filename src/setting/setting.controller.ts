import { Body, Controller, Get, Put } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { SettingService } from './setting.service';

@Controller('api/v1/deliveries')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Put('settings/sync-time-couriers')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateSetting(
    @Body() payload: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const result = await this.settingService.updateSetting(payload);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }

  @Get('settings/sync-time-couriers')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getSetting(): Promise<RSuccessMessage> {
    const result = await this.settingService.getSetting();
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }
}

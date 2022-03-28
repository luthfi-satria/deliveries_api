import { CouriersService } from 'src/couriers/couriers.service';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import _ from 'lodash';
import { SettingsDocument } from 'src/database/entities/settings.entity';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class SettingService {
  private readonly logger = new Logger(SettingService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly settingsRepository: SettingsRepository,
    @Inject(forwardRef(() => CouriersService))
    private readonly couriersService: CouriersService,
  ) {}

  async updateSetting(data: any) {
    const names = [];
    const paramInsert: Partial<SettingsDocument>[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!data[key]) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: data[key],
                property: key,
                constraint: [
                  this.messageService.get('general.general.dataInvalid'),
                ],
              },
              'Bad Request',
            ),
          );
        }

        names.push(key);
        const setting: Partial<SettingsDocument> = {
          name: key,
          value: data[key],
        };
        paramInsert.push(setting);
      }
    }
    const settings: Partial<SettingsDocument>[] =
      await this.settingsRepository.findSettingsByNames(names);

    paramInsert.forEach((param) => {
      const element = param;
      const index = _.findIndex(settings, { name: element.name });
      if (index >= 0) {
        settings[index].value = element.value;
      } else {
        settings.push(element);
      }
    });

    const result = await this.settingsRepository.save(settings);
    await this.couriersService.createAutoSync();
    return result;
  }

  async getSetting() {
    const settings: Partial<SettingsDocument>[] =
      await this.settingsRepository.findAllSettings();
    if (settings.length < 1) {
      throw new NotFoundException(
        this.responseService.error(
          HttpStatus.NOT_FOUND,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.general.notFound'),
              this.messageService.get('general.get.fail'),
            ],
          },
          'Not Found',
        ),
      );
    }
    const result: any = {};
    settings.forEach((setting) => {
      result[`${setting.name}`] = JSON.parse(
        setting.value.replace('{', '[').replace('}', ']'),
      );
    });
    return result;
  }
}

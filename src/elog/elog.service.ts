import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class ElogService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly settingRepo: SettingsRepository,
    private readonly httpService: HttpService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
  ) {}

  private readonly logger = new Logger(ElogService.name);
  async listElogSettings() {
    try {
      const query = await this.settingRepo
        .createQueryBuilder()
        .where('name like :name', { name: '%elog_%' })
        .withDeleted()
        .getMany();

      return query;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('delivery.general.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async updateElogSettings(param) {
    try {
      const updateQuery = await this.settingRepo
        .createQueryBuilder()
        .update('deliveries_settings')
        .set(param)
        .where('id = :id', { id: param.id })
        .execute();
      return {
        affected: updateQuery.affected,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('delivery.general.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  //** GET SETUP ELOG */
  async getElogSettings() {
    try {
      const result = {};
      const settings = await this.listElogSettings();

      for (const Item in settings) {
        result[settings[Item].name] = JSON.parse(
          settings[Item].value.replace('{', '[').replace('}', ']'),
        );
      }

      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // async removeElogSettings() {}
}

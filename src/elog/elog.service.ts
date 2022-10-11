import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ElogRepository } from './repository/elog.repository';

@Injectable()
export class ElogService {
  constructor(
    private readonly elogRepository: ElogRepository,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly httpService: HttpService,
    private readonly settingRepo: SettingsRepository,
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
        .set({ value: param.value })
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

  // async removeElogSettings() {}
}

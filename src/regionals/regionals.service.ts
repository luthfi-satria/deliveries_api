import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { SettingsDocument } from 'src/database/entities/settings.entity';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class RegionalsService {
  private readonly logger = new Logger(RegionalsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly settingRepostory: SettingsRepository,
  ) {}

  async urlElog() {
    try {
      const query = await this.settingRepostory
        .createQueryBuilder('d')
        .select(['d.value'])
        .where('name like :name', { name: '%elog_api_url%' })
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

  async listElogRegionals(
    name: string,
    limit: string,
    page: string,
  ): Promise<any> {
    try {
      const link: Partial<SettingsDocument>[] = await this.urlElog();
      const url = Object.values(link).shift();
      const urls = url.value
        .replace('{', '')
        .replace('}', '')
        .replace('"', '')
        .replace('"', '');
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      return await firstValueFrom(
        this.httpService
          .get(
            `${urls}/master/area/regency?page=${page}&limit=${limit}&name=${name}`,
            { headers: headerRequest, params: { data: [] } },
          )
          .pipe(map((resp) => resp.data)),
      );
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

  async getAllRegionals(limit: any, page: any): Promise<any> {
    try {
      const link: Partial<SettingsDocument>[] = await this.urlElog();
      const url = Object.values(link).shift();
      const urls = url.value
        .replace('{', '')
        .replace('}', '')
        .replace('"', '')
        .replace('"', '');
      const parameters = `${urls}/master/area/regency?page=${page}&limit=${limit}`;
      return await firstValueFrom(
        this.httpService
          .get(parameters, {
            params: {
              data: [],
            },
          })
          .pipe(map((resp) => resp.data)),
      );
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
}

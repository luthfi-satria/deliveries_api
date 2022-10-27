import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { RegionalsDTO } from './dto/regionals.dto';

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
        .where('name = :name', { name: 'elog_api_url' })
        .getOne();

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

  async getAllRegionals(data: RegionalsDTO) {
    try {
      const search = data.search || null;
      const perLimit = data.limit || 10;
      const perPage = data.page || 1;
      const link = await this.urlElog();
      const urls = link.value
        .replace('{', '')
        .replace('}', '')
        .replace('"', '')
        .replace('"', '');
      console.log(urls);
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      // condtion this for search name regionals
      if (!search) {
        return await firstValueFrom(
          this.httpService
            .get(
              `${urls}/master/area/regency?page=${perPage}&limit=${perLimit}`,
              { headers: headerRequest, params: { data: [] } },
            )
            .pipe(map((resp) => resp.data)),
        );
      } else {
        return await firstValueFrom(
          this.httpService
            .get(
              `${urls}/master/area/regency?name=${search}&page=${perPage}&limit=${perLimit}`,
              { headers: headerRequest, params: { data: [] } },
            )
            .pipe(map((resp) => resp.data)),
        );
      }
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

import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { elogDocuments } from 'src/elog/entities/elog.entities';
import { ElogRepository } from 'src/elog/repository/elog.repository';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { ILike } from 'typeorm';
import { RegionalsDTO } from './dto/regionals.dto';

@Injectable()
export class RegionalsService {
  private readonly logger = new Logger(RegionalsService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly elogRepository: ElogRepository,
    private readonly commonService: CommonService,
  ) {}

  //** REGIONALS */
  async getAllRegionals(data: RegionalsDTO) {
    try {
      const search = data.search || null;
      const perLimit = data.limit || 10;
      const perPage = data.page || 1;
      const offset = (perPage - 1) * perLimit;

      let qry = {};
      if (data.search) qry = { ...qry, regional_name: ILike(`%${search}%`) };
      if (data.status)
        qry = {
          ...qry,
          status: data.status ? data.status : true ? data.status : false,
        };

      const existing = await this.elogRepository.count();
      console.log(existing);

      if (existing == 0) {
        // initialize insert into deliveries_elog_couriers
        const allCities = await this.getAllCities();
        console.log(allCities);
        const bulkInsert: elogDocuments[] = [];
        if (allCities && allCities.data.items) {
          allCities.data.items.forEach((rows) => {
            bulkInsert.push({
              id: rows.id,
              regional_name: rows.name,
              status: false,
              created_at: 'now()',
              updated_at: 'now()',
              deleted_at: null,
            });
          });

          await this.elogRepository.save(bulkInsert);
        }
      }

      const RegionalList = this.elogRepository
        .createQueryBuilder()
        .where(qry)
        .take(perLimit)
        .skip(offset)
        .orderBy('regional_name');

      const [getAllRegionals, totalRows] = await RegionalList.getManyAndCount();

      const listItems: ListResponse = {
        current_page: perPage,
        total_item: totalRows,
        limit: perPage,
        items: getAllRegionals,
      };
      return listItems;
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

  //** REGIONALS DETAILS */
  async detailRegionals(regionals_id): Promise<any> {
    try {
      const query = await this.elogRepository.findOne({
        where: { id: regionals_id },
      });

      if (!query) {
        const errors: RMessage = {
          value: regionals_id.id,
          property: 'regionals_id',
          constraint: [
            this.messageService.get('Data regionals tidak dapat ditemukan.'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
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

  //** UPDATED REGIONALS */
  async updatedStatus(param): Promise<any> {
    try {
      const updateQuery = await this.elogRepository
        .createQueryBuilder()
        .update('deliveries_elog_regionals')
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

  async getAllCities() {
    //** GET DATA CITIES */
    const url = `${process.env.BASEURL_ADMINS_SERVICE}/api/v1/admins/query/cities/all`;
    const cities: any = await this.commonService.getHttp(url);

    return cities;
  }
}

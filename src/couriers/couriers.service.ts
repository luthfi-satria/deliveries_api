import { RedisDeliveryService } from './../common/redis/redis-delivery.service';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CourierDocument } from 'src/database/entities/couriers.entity';
import { cronGen, dbOutputTime } from 'src/utils/general-utils';
import { FindCourierDto } from './dto/find-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { FetchCourierService } from 'src/common/courier/fetch-courier.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { RMessage } from 'src/response/response.interface';
import { SettingService } from 'src/setting/setting.service';
import { CreateAutoSyncDeliveryDto } from 'src/common/redis/dto/redis-delivery.dto';
// import { SettingsDocument } from 'src/database/entities/settings.entity';
import { Not } from 'typeorm';

@Injectable()
export class CouriersService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly courierRepository: CourierRepository,
    private readonly fetchCourierService: FetchCourierService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    private readonly redisDeliveryService: RedisDeliveryService,
  ) {}

  async findAll(data: FindCourierDto) {
    try {
      const search = data.search || null;
      const perPage = data.limit || 10;
      const currentPage = data.page || 1;
      const statuses = data.statuses?.length ? data.statuses : null;
      const originLatitude = data.location_latitude;
      const originLongitude = data.location_longitude;
      const destinationLatitude = data.destination_latitude;
      const destinationLongitude = data.destination_longitude;
      const isIncludePrice =
        originLatitude &&
        originLongitude &&
        destinationLatitude &&
        destinationLongitude
          ? true
          : false;
      const courierId = data.courier_id || null;
      const courierCodes = data.courier_codes?.length
        ? data.courier_codes
        : null;

      const query = this.courierRepository.createQueryBuilder('couriers');

      if (courierId) {
        query.andWhere('couriers.id = :courierId', { courierId });
      }

      if (courierCodes) {
        query.andWhere('courier.code in (:...courierCode)', { courierCodes });
      }

      if (search) {
        query.andWhere('couriers.name ilike :search', {
          search: `%${search}%`,
        });
        query.orWhere('couriers.service_name ilike :search', {
          search: `%${search}%`,
        });
      }

      const [items, count] = await query
        .orderBy('couriers.status', 'ASC')
        .addOrderBy('couriers.name', 'ASC')
        .take(perPage)
        .skip((currentPage - 1) * perPage)
        .getManyAndCount()
        .catch((error) => {
          console.error(error);
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: '',
                property: '',
                constraint: [
                  this.messageService.get('delivery.getAllCouriers.fail'),
                  error.message,
                ],
              },
              'Bad Request',
            ),
          );
        });

      console.log('couriers_count: ' + count);

      let itemsWithInfos: any[] = [];
      if (isIncludePrice && items.length) {
        const CourierCodesObj: any = {};
        const CourierPrices: any = {};
        let ElogCouriers = {};
        items.forEach((courier: any) => {
          CourierCodesObj[courier.code] = true;
          if (courier.code == 'elog') {
            ElogCouriers = courier;
          }
        });

        const couriersWithPrice: any[] = await this.fetchCourierService
          .fetchCouriersWithPrice({
            origin_latitude: originLatitude,
            origin_longitude: originLongitude,
            destination_latitude: destinationLatitude,
            destination_longitude: destinationLongitude,
            couriers: Object.keys(CourierCodesObj).join(','),
            items: [],
          })
          .catch(() => {
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: '',
                  property: '',
                  constraint: [
                    this.messageService.get(
                      'delivery.getAllCouriers.courierNotFound',
                    ),
                  ],
                },
                'Bad Request',
              ),
            );
          });

        couriersWithPrice.forEach((courier) => {
          CourierPrices[courier.courier_code + courier.courier_service_code] =
            courier.price;
        });

        items.forEach((courier: any) => {
          if (
            CourierPrices[courier.code + courier.service_code] ||
            CourierPrices[courier.code + courier.service_code] === 0
          ) {
            itemsWithInfos.push({
              ...courier,
              ongkir: CourierPrices[courier.code + courier.service_code],
            });
          }
        });

        // Get elog price
        const elogCouriersPrice: any =
          await this.fetchCourierService.fetchElogPrice({
            origin_latitude: originLatitude,
            origin_longitude: originLongitude,
            destination_latitude: destinationLatitude,
            destination_longitude: destinationLongitude,
            couriers: '',
            items: [],
          });

        if (elogCouriersPrice && elogCouriersPrice.data) {
          ElogCouriers['ongkir'] = elogCouriersPrice.data.total_price;
        }
        itemsWithInfos.push(ElogCouriers);
      } else {
        itemsWithInfos = [...items];
      }

      if (statuses) {
        itemsWithInfos = itemsWithInfos.filter((item) => {
          return statuses.includes(item.status);
        });
      }

      return {
        total_item: itemsWithInfos.length,
        limit: perPage,
        current_page: currentPage,
        items: itemsWithInfos.map((courier: any) => {
          return dbOutputTime(courier);
        }),
      };
    } catch (error) {
      console.error(error);
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('delivery.general.fail'),
            error.message,
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
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: 'courier_id',
              constraint: [
                this.messageService.get(
                  'delivery.getAllCouriers.courierNotFound',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      }
      const item = await this.courierRepository.findOneOrFail(id).catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: id,
              property: 'courier_id',
              constraint: [
                this.messageService.get(
                  'delivery.getAllCouriers.courierNotFound',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      });
      return { courier: dbOutputTime(item) };
    } catch (error) {
      console.error(error);
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('delivery.general.fail'),
            error.message,
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
    }
  }

  async fetch() {
    try {
      const fetchData = await this.fetchCourierService
        .fetchCouriersFromBiteship()
        .catch((error) => {
          console.error(error);
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: '',
                property: '',
                constraint: [
                  this.messageService.get('delivery.fetchCouriers.fail'),
                ],
              },
              'Bad Request',
            ),
          );
        });

      let maxSeq = 0;
      const maxSeqOrder = await this.courierRepository.findOne({
        order: { sequence: 'DESC' },
      });
      if (maxSeqOrder && maxSeqOrder.sequence >= 0) {
        maxSeq = maxSeqOrder.sequence;
      }

      const courierIndex: any = {};

      const couriersToSave: Partial<CourierDocument>[] = [];

      fetchData.forEach((courier: any) => {
        const save: Partial<CourierDocument> = {
          name: courier.courier_name,
          code: courier.courier_code,
          service_name: courier.courier_service_name,
          service_code: courier.courier_service_code,
          tier: courier.tier,
          description: courier.description,
          service_type: courier.service_type,
          shipping_type: courier.shipping_type,
          duration_range: courier.shipment_duration_range,
          duration_unit: courier.shipment_duration_unit,
        };
        courierIndex[courier.courier_code + courier.courier_service_code] =
          save;
      });

      const couriers = await this.courierRepository.find({
        where: {
          code: Not('elog'),
        },
      });

      couriers.forEach((courier: any) => {
        if (!courierIndex[courier.code + courier.service_code]) {
          couriersToSave.push({ ...courier, deleted_at: new Date() });
        } else {
          courierIndex[courier.code + courier.service_code] = {
            ...courier,
            ...courierIndex[courier.code + courier.service_code],
          };
        }
      });

      couriersToSave.push(...Object.values(courierIndex));
      couriersToSave?.forEach((item) => {
        if (!item.id) {
          maxSeq++;
          item.sequence = maxSeq;
        }
      });

      await this.courierRepository
        .createQueryBuilder('courier')
        .insert()
        .into(CourierDocument)
        .values(couriersToSave)
        .orUpdate(
          [
            'name',
            'service_name',
            'tier',
            'description',
            'service_type',
            'shipping_type',
            'duration_range',
            'duration_unit',
            'deleted_at',
          ],
          ['id'],
        )
        .execute();
      return { status: true };
    } catch (error) {
      console.error(error);
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('delivery.general.fail'),
            error.message,
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
    }
  }

  async createAutoSync() {
    const settings = await this.settingService.getSetting();

    const crons = this.generateCronsFromSettings(settings);
    const jobId = 'autoSyncCourier';

    //=> clear the cron jobs first
    await this.redisDeliveryService.clearAutoSyncCourierJobs({
      job_id: jobId,
    });

    //=> then create new jobs
    for (const cron of crons) {
      const payload: CreateAutoSyncDeliveryDto = {
        job_id: jobId,
        repeat: {
          cron,
          tz: 'Asia/Jakarta',
        },
      };
      await this.redisDeliveryService.createAutoSyncCourierJob(payload);
    }
  }

  generateCronsFromSettings(settings): string[] {
    let automaticSyncTime = null;
    const automaticDisburseMinute = {};
    const crons = [];
    console.log(settings);

    if (settings) {
      automaticSyncTime = settings.sync_time_couriers;
    }
    // for (const setting of settings) {
    //   switch (setting.name) {
    //     case 'sync_time_couriers':
    //       automaticSyncTime = setting.value;
    //       break;
    //   }
    // }

    console.log(automaticSyncTime);

    //=> cek multiple minute patterns
    if (automaticSyncTime && automaticSyncTime?.length) {
      for (const time of automaticSyncTime) {
        const [hour, minute] = time.split(':');
        if (automaticDisburseMinute[minute]) {
          automaticDisburseMinute[minute].push(hour);
        } else {
          automaticDisburseMinute[minute] = [hour];
        }
      }
    }

    for (const minute in automaticDisburseMinute) {
      if (
        Object.prototype.hasOwnProperty.call(automaticDisburseMinute, minute)
      ) {
        const hours: string[] = automaticDisburseMinute[minute];
        const hoursString = hours.toString();

        const cron = cronGen(minute, hoursString, '*', '*', '*');

        if (cron) {
          crons.push(cron);
        }
      }
    }

    return crons;
  }

  async updateCourier(updateCourierDto: UpdateCourierDto): Promise<any> {
    try {
      const status = updateCourierDto.status || null;
      let sequence = updateCourierDto.sequence;
      if (!sequence && sequence !== 0) {
        sequence = null;
      }

      const courier = await this.courierRepository
        .findOneOrFail(updateCourierDto.courierId)
        .catch(() => {
          const errors: RMessage = {
            value: updateCourierDto.courierId,
            property: 'courierId',
            constraint: [
              this.messageService.get('delivery.general.idNotFound'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        });

      courier.status = status ? status : courier.status;
      courier.sequence = sequence !== null ? sequence : courier.sequence;

      const result = await this.courierRepository.save(courier);

      return { courier: result };
    } catch (error) {
      console.error(error);
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('delivery.general.fail'),
            error.message,
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
    }
  }

  async getBulkCouriers(ids: string[]): Promise<any> {
    try {
      return await this.courierRepository.findByIds(ids);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

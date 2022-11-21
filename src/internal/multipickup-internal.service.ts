import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { unescape } from 'querystring';
import { firstValueFrom, map } from 'rxjs';
import { CommonService } from 'src/common/common.service';
import { CourierRepository } from 'src/database/repository/couriers.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { ElogCouriersAvailabilityDocuments } from './dto/elog-couriers.dto';

@Injectable()
export class InternalMultipickupService {
  constructor(
    private readonly settingRepository: SettingsRepository,
    private readonly httpService: HttpService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
    private readonly courierRepository: CourierRepository,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
  ) {}

  logger = new Logger();

  async getDeliveryMultipickupPrice(data: any) {
    //** CREATE PAYLOAD FOR ELOG DATA */
    const elogData = await this.elogData(data);
    //this.logger.log(data, 'ELOG DATA RESULT');

    //** ELOG SETUP */
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

    //** SEARCH COURIER BY ID */
    const ids = data.courier_id;
    const values = await this.searchCourierElog(ids);
    const code = values[0].code;

    //** LOOP FOR CREATE MULTI PICKUP */
    for (let index = 0; index < data.pickup_destinations.length; index++) {
      const rows = data.pickup_destinations[index];
      const CartItems = [];
      if (rows.items.length > 0) {
        const payload = rows.items;
        payload.forEach((Items) => {
          CartItems.push({
            name: Items.name,
            price: Items.price,
            weight: Items.weight,
            quantity: Items.quantity,
          });
        });
      }

      //** PUSH FOR ELOG DATA */
      elogData.pickup_destinations.push({
        latitude: data.pickup_destinations[0].location_latitude,
        longitude: data.pickup_destinations[0].location_longitude,
        items: CartItems,
      });
    }

    //** EXECUTE GET DELIVERIES ELOG PRICE */
    const urlDeliveryElog = `${elogUrl}/openapi/v0/rate/send`;
    const headerRequest = {
      'Content-Type': 'application/json',
      Authorization:
        'basic ' +
        btoa(unescape(encodeURIComponent(elogUsername + ':' + elogPassword))),
    };

    //** EXECUTE BY AXIOS DATA */
    const get_request = this.httpService
      .post(urlDeliveryElog, elogData, { headers: headerRequest })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data;
        }),
      );

    //** REQUEST DATA */
    const request = {
      header: headerRequest,
      urlDeliveryElog,
      body: data,
      method: 'POST',
    };

    //** RESULT BY ELOG */
    const response = await firstValueFrom(get_request);
    // this.logger.log(request, 'ELOG DATA REQUEST');
    this.logger.log(response, 'ELOG DATA RESPONSES');

    //** SAVE RATES ELOG */
    await this.thirdPartyRequestsRepository.save({ code, request, response });

    //** BACK TO GET RESPONSE */
    return response;
  }

  //** GET SETUP ELOG */
  async getElogSettings() {
    try {
      const result = {};
      const settings = await this.settingRepository
        .createQueryBuilder()
        .where('name like :name', { name: '%elog_%' })
        .withDeleted()
        .getMany();

      //** CREATE EXTRACT DATA BY REPLACE */
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

  //** SEARCH COURIER BY ID */
  async searchCourierElog(ids: string) {
    return this.courierRepository
      .find({
        where: { id: ids },
        select: ['code'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: 'Courier tidak dapat di temukan.',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  //** ELOG DATA DELIVERIES */
  elogData(data) {
    const elogData = {
      pickup_destinations: [],
      dropoff_destinations: [
        {
          latitude: data.dropoff_destinations[0].location_latitude,
          longitude: data.dropoff_destinations[0].location_longitude,
        },
      ],
    };
    return elogData;
  }

  async getElogDriverAvailability(data: ElogCouriersAvailabilityDocuments) {
    this.logger.log(data, 'ELOG DATA PAYLOAD CHECK DRIVER');

    //** ELOG SETUP */
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

    //** EXECUTE GET DELIVERIES ELOG PRICE */
    const urlDeliveryElog = `${elogUrl}/openapi/v0/availability/send`;
    const headerRequest = {
      'Content-Type': 'application/json',
      Authorization:
        'basic ' +
        btoa(unescape(encodeURIComponent(elogUsername + ':' + elogPassword))),
    };

    //** EXECUTE BY AXIOS DATA */
    const getDriver: any = await this.commonService
      .postHttp(urlDeliveryElog, data, headerRequest)
      .catch((err1) => {
        console.error(err1);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            err1,
            'Bad Request',
          ),
        );
      });

    console.log(getDriver);
    this.logger.log(getDriver, 'ELOG CHECK DRIVER RESPONSES');
    return getDriver;
  }
}

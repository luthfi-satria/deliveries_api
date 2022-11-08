import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { unescape } from 'querystring';
import { firstValueFrom, map } from 'rxjs';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';

@Injectable()
export class InternalMultipickupService {
  constructor(
    private readonly settingRepository: SettingsRepository,
    private readonly httpService: HttpService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
  ) {}

  logger = new Logger();

  async getDeliveryMultipickupPrice(data: any) {
    // const data = await this.dummyData();
    // this.logger.log(data, 'DUMMY DATA');

    //** CREATE PAYLOAD FOR ELOG DATA */
    const elogData = await this.elogData(data);
    this.logger.log(data, 'ELOG DATA RESULT');

    //** ELOG SETUP */
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

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

    //** HEADERS DATA */
    const request = {
      header: headerRequest,
      urlDeliveryElog,
      body: data,
      method: 'POST',
    };

    //** RESULT BY ELOG */
    const response = await firstValueFrom(get_request);

    //** SAVE TO THIRD PARTY REQUEST */
    this.thirdPartyRequestsRepository.save({ request, response });
    this.logger.log(response, 'ELOG DATA RESPONSE');

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

  dummyData() {
    const data = {
      pickup_destinations: [
        {
          location_latitude: -6.2394271,
          location_longitude: 106.8456447,
          items: [
            {
              name: ' handphone',
              price: 10000,
              weight: 0,
              quantity: 1,
            },
          ],
        },
      ],
      dropoff_destinations: [
        {
          location_latitude: -6.2394271,
          location_longitude: 106.8556447,
        },
      ],
    };
    return data;
  }
}

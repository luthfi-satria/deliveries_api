import { ThirdPartyRequestsRepository } from './../../database/repository/third-party-request.repository';
import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { CommonService } from '../common.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { AxiosResponse } from 'axios';
import { FetchCourierWithPrice } from './dto/courier.dto';

@Injectable()
export class FetchCourierService {
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
  ) {}

  logger = new Logger();

  async fetchCouriersFromBiteship(): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      };
      const url = `${process.env.BITESHIP_API_BASEURL}/v1/couriers`;
      const get_request = this.httpService
        .get(url, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response: {
        success: boolean;
        object: string;
        couriers: any[];
      } = await firstValueFrom(get_request);

      // const request = { header: headerRequest, url };
      // this.thirdPartyRequestsRepository.save({ request, response });

      return response.couriers;
    } catch (e) {
      this.logger.error(`${process.env.BITESHIP_API_BASEURL}/v1/couriers`);
      if (e.response) {
        throw new HttpException(
          e.response.data?.message,
          e.response.data?.statusCode,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async fetchCouriersWithPrice(data: FetchCourierWithPrice): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      };
      const url = `${process.env.BITESHIP_API_BASEURL}/v1/rates/couriers`;
      const get_request = this.httpService
        .post(url, data, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response = await firstValueFrom(get_request);
      const request = {
        header: headerRequest,
        url,
        body: data,
        method: 'POST',
      };
      this.thirdPartyRequestsRepository.save({ request, response });

      return response.pricing;
    } catch (e) {
      console.log(e.response, 'ERROR');

      if (e.response.data.code == 40001002) {
        return [];
      }

      if (e.response.data && e.response.status) {
        throw new HttpException(e.response.data, e.response.status);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}

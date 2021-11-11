import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';
import { CommonService } from '../common.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { AxiosResponse } from 'axios';

@Injectable()
export class FetchCourierService {
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  logger = new Logger();

  //   async getMenuByStoreId(id: string, opt: any = {}): Promise<any> {
  //     try {
  //       const urlInternal = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/menu/${id}`;
  //       // const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`;
  //       const options: any = {
  //         limit: 100,
  //       };
  //       if (opt.search) {
  //         options.search = opt.search;
  //       }
  //       return await firstValueFrom(
  //         this.httpService
  //           .get(urlInternal, {
  //             params: options,
  //           })
  //           .pipe(map((resp) => resp.data)),
  //       );
  //     } catch (e) {
  //       this.logger.error(
  //         `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`,
  //       );
  //       if (e.response) {
  //         throw new HttpException(
  //           e.response.data.message,
  //           e.response.data.statusCode,
  //         );
  //       } else {
  //         throw new InternalServerErrorException();
  //       }
  //     }
  //   }

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

      return response.couriers;
    } catch (e) {
      this.logger.error(`${process.env.BITESHIP_API_BASEURL}/v1/couriers`);
      if (e.response) {
        throw new HttpException(
          e.response.data.message,
          e.response.data.statusCode,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}

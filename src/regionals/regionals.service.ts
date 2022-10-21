import { HttpService } from '@nestjs/axios';
import { 
  BadRequestException, 
  HttpStatus, 
  Injectable, 
  Logger 
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class RegionalsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger();

  async listElogRegionals(
    name: string,
    limit: string,
    page: string,
  ): Promise<any> {
    try {
      const url = `${process.env.BASEURL_ELOG}/master/area/regency?page=${page}&limit=${limit}&name=${name}`;
      return await firstValueFrom(
        this.httpService
          .get(url, {
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

  async getAllRegionals(
    limit: any,
    page: any,
  ): Promise<any> {
    try {
      const url = `${process.env.BASEURL_ELOG}/master/area/regency?page=${page}&limit=${limit}`;
      return await firstValueFrom(
        this.httpService
          .get(url, {
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

import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrdersDocument } from 'src/database/entities/orders.entity';
import { ResponseService } from 'src/response/response.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class DeliveriesMultipleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly responseService: ResponseService,
    private readonly settingRepository: SettingsRepository,
    private readonly messageService: MessageService,
  ) {}

  logger = new Logger();

  //** GET SETUP ELOG */
  async getElogSettings() {
    try {
      const result = {};
      const settings = await this.listElogSettings();

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

  //** GET SETUP ELOG */
  async listElogSettings() {
    try {
      const query = await this.settingRepository
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

  async createMultipleOrder(data: any) {
    if (data.delivery_type == 'DELIVERY') {
      //** GET DATA CUSTOMER BY ID */
      const url = `${process.env.BASEURL_CUSTOMERS_SERVICE}/api/v1/internal/customerS/${data.customer_id}`;
      const customer: any = await this.commonService.getHttp(url);
      if (!customer) {
        const errContaint: any = {
          value: data.customer_id,
          property: 'customer_id',
          constraint: ['Customer Id tidak ditemukan.'],
        };
        const deliveryData: Partial<OrdersDocument> = {
          order_id: data.id,
          response_payload: errContaint,
        };
        this.saveNegativeResultOrder(deliveryData, errContaint);
      }
    }

    //** GET DATA STORE BY ID */
    const urlStore = `${process.env.BASEURL_MERCHANTS_SERVICE}/api/v1/internal/merchants/stores/${data.store_id}`;
    const store: any = await this.commonService.getHttp(urlStore);
    if (!store) {
      const errContaint: any = {
        value: data.store_id,
        property: 'store_id',
        constraint: ['Store Id tidak ditemukan.'],
      };
      const deliveryData: Partial<OrdersDocument> = {
        order_id: data.id,
        response_payload: errContaint,
      };
      this.saveNegativeResultOrder(deliveryData, errContaint);
    }

    //** ELOG SETTING */
    const elogSettings = await this.getElogSettings();
    const elogUrl = elogSettings['elog_api_url'][0];
    const elogUsername = elogSettings['elog_username'][0];
    const elogPassword = elogSettings['elog_password'][0];

    //** CREATE ORDER TO ELOG */
    const elogData = [];
    elogData.push({});
  }

  saveNegativeResultOrder(
    deliveryData: Partial<OrdersDocument>,
    errContaint: any,
  ) {
    this.ordersRepository.save(deliveryData);

    throw new BadRequestException(
      this.responseService.error(
        HttpStatus.BAD_REQUEST,
        errContaint,
        'Bad Request',
      ),
    );
  }
}

import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import {
  OrdersDocument,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { ResponseService } from 'src/response/response.service';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { MessageService } from 'src/message/message.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { unescape } from 'querystring';

@Injectable()
export class DeliveriesMultipleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly responseService: ResponseService,
    private readonly settingRepository: SettingsRepository,
    private readonly messageService: MessageService,
    private readonly natsService: NatsService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
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
      const url = `${process.env.BASEURL_CUSTOMERS_SERVICE}/api/v1/internal/customers/${data.customer_id}`;
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

      console.log(customer['active_addresses'].location_latitude);

      //** ELOG DATA */
      const elogData = {
        pickup_destinations: [
          {
            longitude: store.location_latitude,
            latitude: store.location_longitude,
            contact_name: store.name,
            contact_phone: store.phone,
            address: store.address,
            address_name: store.name,
            location_description: '',
            note: '',
            item: [
              {
                name: ' handphone',
                weight: 0,
                quantity: 1,
                price: 10000,
              },
            ],
          },
        ],
        dropoff_destinations: [
          {
            longitude: store.location_latitude,
            latitude: store.location_longitude,
            contact_name: customer.name,
            contact_phone: customer.phone,
            address: 'jl mampang no 26',
            address_name: customer.address_detail,
            location_description: '',
            note: '',
          },
        ],
        price: 10000,
      };

      console.log(elogData);

      //** ELOG SETTING */
      const elogSettings = await this.getElogSettings();
      const elogUrl = elogSettings['elog_api_url'][0];
      const elogUsername = elogSettings['elog_username'][0];
      const elogPassword = elogSettings['elog_password'][0];

      //** EXECUTE CREATE ORDER BY POST */
      const urlDeliveryElog = `${elogUrl}/openapi/v0/order/send`;
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization:
          'basic ' +
          btoa(unescape(encodeURIComponent(elogUsername + ':' + elogPassword))),
      };

      console.log(urlDeliveryElog);

      //** EXECUTE CREATE ORDER BY POST */
      const orderDelivery: any = await this.commonService
        .postHttp(urlDeliveryElog, elogData, headerRequest)
        .catch((err) => {
          const deliveryData: Partial<OrdersDocument> = {
            order_id: data.id,
            status: OrdersStatus.DRIVER_NOT_FOUND,
            response_payload: err,
          };

          //** BROADCAST */
          this.natsService.clientEmit(`deliveries.order.failed`, deliveryData);

          //** IF ERROR */
          this.saveNegativeResultOrder(deliveryData, err);
        });

      //** EXECUTE CREATE ORDER BY POST */
      const request = {
        header: headerRequest,
        url: urlDeliveryElog,
        data: elogData,
        method: 'POST',
      };
      console.log(request);

      //** SAVE ELOG DELIVERIES TO DELIVERIES ORDERS */
      this.thirdPartyRequestsRepository.save({
        request,
        response: orderDelivery,
        code: orderDelivery.id,
      });
    }
  }

  async saveNegativeResultOrder(
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

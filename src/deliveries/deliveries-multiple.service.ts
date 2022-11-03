import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import moment from 'moment';
import { unescape } from 'querystring';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import {
  OrderHistoriesDocument,
  OrderHistoriesServiceStatus,
  OrderHistoriesStatus,
} from 'src/database/entities/orders-history.entity';
import {
  OrdersDocument,
  OrdersServiceStatus,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { SettingsRepository } from 'src/database/repository/settings.repository';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { ElogService } from 'src/elog/elog.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class DeliveriesMultipleService {
  logger = new Logger();

  constructor(
    private readonly couriersService: CouriersService,
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderHistoriesRepository: OrderHistoriesRepository,
    private readonly natsService: NatsService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
    private readonly settingRepository: SettingsRepository,
    private readonly elogService: ElogService,
  ) {}

  //** Elog API Setup */
  async urlElog() {
    try {
      const result = {};
      const settings = await this.elogService.listElogSettings();

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

  //** Create Order Elog */
  async createMultipleOrder(data: any) {
    if (data.delivery_type == 'DELIVERY') {
      //** SEARCH CUSTOEMR BY ID */
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

      //** SEARCH STORE BY ID */
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

      let OrderNotes = `No. order: ${data.no}\n `;
      OrderNotes =
        OrderNotes.length > 500
          ? OrderNotes.substring(0, 496) + '...'
          : OrderNotes;

      const elogData = {
        pickup_destinations: [],
        dropoff_destinations: [
          {
            latitude: customer.location_latitude,
            longitude: customer.location_longitude,
            address: `${customer.address}`,
            address_name: customer.name,
            contact_phone_no: customer.phone,
            contact_name: customer.name,
            note: OrderNotes,
            location_description: `${data.address.address_detail}`,
          },
        ],
        price: 10000,
      };
    }
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

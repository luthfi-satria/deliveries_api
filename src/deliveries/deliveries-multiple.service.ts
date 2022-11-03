import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrdersDocument } from 'src/database/entities/orders.entity';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class DeliveriesMultipleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly ordersRepository: OrdersRepository,
    private readonly responseService: ResponseService,
  ) {}

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

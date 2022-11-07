import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { catchError, firstValueFrom, map } from 'rxjs';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import {
  OrdersServiceStatus,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { unescape } from 'querystring';
import { ElogService } from 'src/elog/elog.service';

@Injectable()
export class CronElogService {
  constructor(
    private readonly httpService: HttpService,
    private readonly deliveryRepo: OrdersRepository,
    private readonly elogService: ElogService,
    private readonly deliveryHistoryRepo: OrderHistoriesRepository,
  ) {}

  private readonly logger = new Logger(CronElogService.name);

  /**
   *
   */
  @Cron('*/1 * * * *')
  async retrieveElogStatus() {
    this.logger.log('---- STARTING CRON JOBS -----');
    await this.updateElogStatus();
  }

  /**
   *
   * @returns
   */
  async updateElogStatus() {
    // request semua data multipickup orders pada order service
    const elogResponse = await this.getMultiPickupOrders();
    return elogResponse;
  }

  /**
   *
   * @returns
   */
  async getMultiPickupOrders() {
    const reqData = [];
    this.logger.log('CRON JOBS::GETTINGS MULTIPICKUP ORDERS');
    const multipickupData = await this.getDeliveryOrders();
    console.log(multipickupData);

    if (multipickupData) {
      multipickupData.forEach((rows) => {
        reqData[rows.delivery_id] = rows;
      });
    }

    const result = {};
    if (multipickupData.length > 0 && reqData) {
      // check status pada elog APIS
      console.log(reqData);
      this.logger.log('CRON JOBS::COMMUNICATING WITH ELOG APIs');
      const elogResponse = await this.callElogAPIS(Object.keys(reqData));
      console.log(elogResponse);

      const DeliveryData = [];
      if (typeof elogResponse != 'undefined' && elogResponse.data.length > 0) {
        const DeliveryHistory = [];
        const OrdersGroupsData = [];
        elogResponse.data.forEach((Rows) => {
          const status = this.statusConverter(Rows.status);
          DeliveryData.push({
            id: reqData[Rows.id].id,
            status: status.orderStatus,
            service_status: status.deliveryStatus,
          });

          DeliveryHistory.push({
            order_id: reqData[Rows.id].id,
            status: status.orderStatus,
            service_status: status.deliveryStatus,
          });

          OrdersGroupsData.push({
            id: reqData[Rows.id].order_id,
            delivery_info: Rows,
            delivery_status: status.orderStatus,
            delivery_driver_name: reqData[Rows.id].driver_name,
            delivery_driver_phone: reqData[Rows.id].driver_phone,
            delivery_tracking_url: reqData[Rows.id].tracking_url,
          });
        });

        this.logger.log('CRON JOBS::SAVE DELIVERY ORDER HISTORIES');
        console.log(DeliveryHistory);
        // create data deliveries order histories
        await this.deliveryHistoryRepo.save(DeliveryHistory);

        this.logger.log('CRON JOBS::SAVE DELIVERY ORDER');
        console.log(DeliveryData);

        // update table deliveries_order
        await this.deliveryRepo.save(DeliveryData);

        this.logger.log('CRON JOBS::COMMUNICATE WITH ORDERS SERVICE');
        console.log(OrdersGroupsData);

        // call orders service
        await this.updateOrderStatus(OrdersGroupsData);
      }
    }
    this.logger.log('---- STOPPING CRON JOBS ----');
    return result;
  }

  /**
   *
   * @returns
   */
  async getDeliveryOrders() {
    try {
      const DelivOrderData = await this.deliveryRepo
        .createQueryBuilder()
        .select([
          'id',
          'order_id',
          'delivery_id',
          'driver_name',
          'driver_phone',
          'tracking_url',
        ])
        .where('logistic_platform = :platform', { platform: 'ELOG' })
        .andWhere('service_status NOT IN (:...status)', {
          status: [
            OrdersServiceStatus.Cancelled,
            OrdersServiceStatus.Delivered,
            OrdersServiceStatus.Placed,
          ],
        })
        .getRawMany();
      return DelivOrderData;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param reqData
   * @returns
   */
  async callElogAPIS(reqData: any) {
    // httpRequest ke elog APIS
    try {
      // getting elog settings
      const elogSettings = await this.getElogSettings();
      const elogUrl = elogSettings['elog_api_url'][0];
      const elogUsername = elogSettings['elog_username'][0];
      const elogPassword = elogSettings['elog_password'][0];

      const headerRequest = {
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'basic ' +
            btoa(
              unescape(encodeURIComponent(elogUsername + ':' + elogPassword)),
            ),
        },
      };

      const url = `${elogUrl}/openapi/v0/order/send/status`;
      const targetStatus = await firstValueFrom(
        this.httpService.post(url, { order_ids: reqData }, headerRequest).pipe(
          map((resp) => resp.data),
          catchError(() => {
            throw new ForbiddenException(`Elog APIs: ${url} is not available`);
          }),
        ),
      );

      return targetStatus;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @returns
   */

  async getElogSettings() {
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

  async updateOrderStatus(reqData: any) {
    try {
      const headerRequest = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const url = `${process.env.BASEURL_ORDERS_SERVICE}/api/v1/orders/internal/update-multipickup-bulk`;
      const targetStatus = await firstValueFrom(
        this.httpService
          .put(url, { orders_orders_group: reqData }, headerRequest)
          .pipe(
            map((resp) => resp.data),
            catchError(() => {
              throw new ForbiddenException(
                `Order service: ${url} is not available`,
              );
            }),
          ),
      );

      return targetStatus;
    } catch (error) {
      throw error;
    }
  }

  statusConverter(status: string) {
    let delivStatus = OrdersServiceStatus.Confirmed;
    switch (status) {
      case 'CONFIRMED':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Confirmed;
        break;
      case 'GO_TO_LOCATION_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Allocated;
        break;
      case 'ARRIVE_AT_LOCATION_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Allocated;
        break;
      case 'LOADING_GOODS_PICKUP':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Picking_up;
        break;
      case 'GO_TO_LOCATION_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'ARRIVE_AT_LOCATION_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'LOADING_GOODS_DROPOFF':
        status = OrdersStatus.DRIVER_FOUND;
        delivStatus = OrdersServiceStatus.Dropping_of;
        break;
      case 'FINISHED':
        status = OrdersStatus.COMPLETED;
        delivStatus = OrdersServiceStatus.Delivered;
        break;
      case 'CANCELLED':
        status = OrdersStatus.CANCELLED;
        delivStatus = OrdersServiceStatus.Cancelled;
        break;
    }
    return {
      orderStatus: status,
      deliveryStatus: delivStatus,
    };
  }
}

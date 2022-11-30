// import { HttpService } from '@nestjs/axios';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
// import { ElogService } from 'src/elog/elog.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectQueue, OnGlobalQueueWaiting } from '@nestjs/bull';
import { Queue } from 'bull';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  OrdersDocument,
  OrdersServiceStatus,
  OrdersStatus,
} from 'src/database/entities/orders.entity';
import { CommonService } from 'src/common/common.service';
import { DeliveriesMultipleService } from 'src/deliveries/deliveries-multiple.service';
import { ThirdPartyRequestsRepository } from 'src/database/repository/third-party-request.repository';
import { NatsService } from 'src/common/nats/nats/nats.service';
// import { DeliveriesMultipleDummyService } from 'src/deliveries/deliveries-multiple-dummy.service';

@Injectable()
export class CronElogRecreateMultipickupService {
  constructor(
    private readonly deliveryRepo: OrdersRepository,
    private readonly deliveryHistoryRepo: OrderHistoriesRepository,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
    private readonly deliveriesMultipleService: DeliveriesMultipleService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
    // private readonly dummyDeliveriesMultiPickupData: DeliveriesMultipleDummyService,
    private readonly natsService: NatsService,
    @InjectQueue('deliveries') private readonly deliveriesQueue: Queue,
  ) {}

  private readonly logger = new Logger(CronElogRecreateMultipickupService.name);

  async recreateDeliveriesOrders() {
    const lastSequence = await this.checkLastJobsSequence();
    this.logger.log('CHECKING ELOG COUNTER ' + lastSequence);

    if (lastSequence == 5) {
      console.log(
        '##################################################################',
      );
      this.logger.log('RECREATE ELOG ORDERS =>');
      const pendingDeliveries = await this.getDeliveryOrders();
      console.log(pendingDeliveries);
      console.log(
        '##################################################################',
      );

      const thirdPartyObj = [];
      const deliveriesObj = [];
      const historyObj = [];
      const natsPayload = [];

      for (const rows of pendingDeliveries) {
        const group_id = rows.order_id;
        this.logger.log(`CHECKING QUEUE JOBS: elogsPendingQueue_${group_id}`);
        const elogPendingQueue = await this.deliveriesQueue.getJob(
          `elogsPendingQueue_${group_id}`,
        );

        if (elogPendingQueue) {
          const queueData = elogPendingQueue.data;
          this.logger.log('QUEUE JOB DATA =>');
          console.log(queueData);

          this.logger.log(
            `CHECKING elogsPendingQueue_${group_id} JOBS COUNTER: ${queueData.counter}`,
          );
          // JIKA COUNTER KURANG DARI 3
          if (queueData.counter < 3) {
            this.logger.log(`CALL ELOG APIS: elogsPendingQueue_${group_id}`);

            const elogResponse = await this.callElogApis(group_id, queueData);
            // const elogResponse =
            //   this.dummyDeliveriesMultiPickupData.dummyOrderDelivery();

            // JIKA BERHASIL CREATE ORDER
            if (elogResponse && elogResponse.status == 'success') {
              this.logger.log(`DRIVER FOUND: elogsPendingQueue_${group_id}`);
              const status = this.deliveriesMultipleService.statusConverter(
                elogResponse.data.status,
              );

              // DELIVERY THIRD PARTY REQUEST OBJECTS
              thirdPartyObj.push({
                request: {
                  group_id: rows.group_id,
                  logistic_platform: rows.logistic_platform,
                  header: queueData.elogHeaders,
                  url: queueData.elogUrl,
                  data: queueData.elogData,
                  method: 'POST',
                },
                response: elogResponse,
                code: elogResponse.data.id,
              });

              // delivery orders data Objects for updates
              const deliveriesData = {
                id: rows.id,
                order_id: rows.order_id,
                delivery_id: elogResponse.data.id,
                price: rows.price,
                response_payload: elogResponse,
                status: status.orderStatus,
                service_status: status.deliveryStatus,
                waybill_id: elogResponse.data.airway_bill,
                tracking_url: elogResponse.data.tracking_url,
                logistic_platform: rows.logistic_platform,
                driver_name: elogResponse.data.driver_name,
                driver_phone: elogResponse.data.driver_phone_no,
              };
              deliveriesObj.push(deliveriesData);

              // delivery orders history Objects
              const historyData = {
                order_id: rows.id,
                status: status.orderStatus,
                service_status: status.deliveryStatus,
              };
              historyObj.push(historyData);

              // RECREATE CACHING
              await this.recreateCaching(queueData, group_id);
              // await this.deliveriesMultipleService.removeElogQueue(group_id);
            }
            // JIKA GAGAL CREATE ORDER
            // RECREATE REDIS CACHE
            else {
              await this.recreateCaching(queueData, group_id);
            }
          }
          // BATALKAN ORDERS JIKA LEBIH DARI 3X
          else {
            this.logger.log(
              `DRIVER NOT FOUND 3 TIMES, CANCELLING ORDERS ID: ${group_id}`,
            );

            // delivery orders data Objects for updates
            const deliveriesData = {
              id: rows.id,
              order_id: rows.order_id,
              delivery_id: rows.delivery_id,
              price: rows.price,
              response_payload: {
                success: false,
                message: 'CANCELLED BY SYSTEM',
              },
              status: OrdersStatus.DRIVER_NOT_FOUND,
              service_status: OrdersServiceStatus.Cancelled,
              waybill_id: null,
              tracking_url: null,
              logistic_platform: rows.logistic_platform,
              driver_name: null,
              driver_phone: null,
            };
            deliveriesObj.push(deliveriesData);

            // delivery orders history Objects
            const historyData = {
              order_id: rows.id,
              status: OrdersStatus.CANCELLED,
              service_status: OrdersServiceStatus.Cancelled,
            };
            historyObj.push(historyData);

            // nats message broker payload
            natsPayload.push(rows.order_id);

            // HAPUS REDIS CACHE
            await this.deliveriesMultipleService.removeElogQueue(rows.order_id);
          }
        }
      }

      this.logger.log('PREPARE UPDATING DATA');
      console.log({
        thirdPartyObj: thirdPartyObj,
        deliveriesObj: deliveriesObj,
        historyObj: historyObj,
        natsPayload: natsPayload,
      });
      // SAVE BULK THIRD PARTY REQUEST
      if (thirdPartyObj.length > 0) {
        await this.thirdPartyRequestsRepository.save(thirdPartyObj);
      }

      // UPDATE BULK DELIVERY SERVICE DATA
      if (deliveriesObj.length > 0) {
        await this.deliveryRepo.save(deliveriesObj);
      }

      // SAVE BULK DELIVERY HISTORIES DATA
      if (historyObj.length > 0) {
        await this.deliveryHistoryRepo.save(historyObj);
      }

      // CREATE BULK MULTIPICKUPCANCELLED DATA
      if (natsPayload.length > 0) {
        this.natsService.clientEmit(
          `deliveries.order.multipickupbulkcancelled`,
          {
            // NATS PAYLOAD BERISI LIST ORDER ID (GROUP ID) - KHUSUS ELOG
            list_group_id: natsPayload,
          },
        );
      }

      // CLEAR REDIS CACHE
      await this.clearRedisCacheForCancelAndCompletedStatus();
    }
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
          'status',
          'service_status',
          'waybill_id',
          'tracking_url',
          'price',
          'logistic_platform',
          'response_payload',
        ])
        .where('logistic_platform = :platform', { platform: 'ELOG' })
        .andWhere(`created_at > (now() - (20 * interval '1 minute'))`)
        .andWhere('service_status IN (:...status)', {
          status: [OrdersServiceStatus.Placed],
        })
        .getRawMany();
      return DelivOrderData;
    } catch (error) {
      throw error;
    }
  }

  async callElogApis(group_id, queueData) {
    this.logger.log('REQUESTING ELOG APIS');
    console.log({
      url: queueData.elogUrl,
      data: queueData.elogData,
      headers: queueData.elogHeaders,
    });

    const orderDelivery: any = await this.commonService
      .postHttp(queueData.elogUrl, queueData.elogData, queueData.elogHeaders)
      .catch(async (err) => {
        const deliveryData: Partial<OrdersDocument> = {
          order_id: group_id,
          status: OrdersStatus.DRIVER_NOT_FOUND,
          response_payload: err,
          logistic_platform: 'ELOG',
        };
        this.logger.log('CANNOT FIND DRIVER');
        console.log(deliveryData);
        //** IF ERROR */
        // await this.deliveriesMultipleService.saveNegativeResultOrder(
        //   deliveryData,
        //   err,
        // );
      });
    return orderDelivery;
  }

  @OnGlobalQueueWaiting()
  async checkLastJobsSequence() {
    const CounterJob = await this.deliveriesQueue.getJob('elogsCounter');
    const lastJobs = CounterJob ? CounterJob.data.counter : null;

    await CounterJob?.remove();
    const lastSequence = lastJobs && lastJobs < 5 ? lastJobs + 1 : 1;

    await this.createRedisJobs(lastSequence);
    return lastSequence;
  }

  async createRedisJobs(counter: number) {
    try {
      await this.deliveriesQueue.add(
        {
          counter: counter,
        },
        {
          jobId: 'elogsCounter',
        },
      );
    } catch (error) {
      console.error(error);
      this.errorHandler(error);
    }
  }

  errorHandler(error) {
    const errors: RMessage = {
      value: '',
      property: '',
      constraint: [
        this.messageService.get('general.redis.createQueueFail'),
        error.message,
      ],
    };
    throw new BadRequestException(
      this.responseService.error(HttpStatus.BAD_REQUEST, errors, 'Bad Request'),
    );
  }

  async recreateCaching(queueData, group_id) {
    this.logger.log(`DRIVER NOT FOUND: RECREATE QUEUE CACHING`);
    const redisCache = {
      elogUrl: queueData.elogUrl,
      elogData: queueData.elogData,
      elogHeaders: queueData.elogHeaders,
      natsData: queueData.natsData,
      counter: queueData.counter + 1,
    };
    this.logger.log(`elogsPendingQueue_${group_id}`);
    console.log(redisCache);

    // RECREATE CACHING!!
    await this.addErrorQueue(redisCache, group_id);
  }

  async addErrorQueue(queueData, group_id) {
    try {
      await this.deliveriesMultipleService.removeElogQueue(group_id);

      await this.deliveriesQueue.add(queueData, {
        jobId: `elogsPendingQueue_${group_id}`,
      });
    } catch (error) {
      console.error(error);
      this.errorHandler(error);
    }
  }

  async clearRedisCacheForCancelAndCompletedStatus() {
    try {
      this.logger.log('########## CLEARING REDIS CACHE ##########');
      const DelivOrderData = await this.deliveryRepo
        .createQueryBuilder()
        .select([
          'id',
          'order_id',
          'delivery_id',
          'driver_name',
          'driver_phone',
          'tracking_url',
          'status',
          'service_status',
        ])
        .where('logistic_platform = :platform', { platform: 'ELOG' })
        .andWhere(`created_at > date_trunc('day', now())`)
        .andWhere('service_status IN (:...status)', {
          status: [
            OrdersServiceStatus.Cancelled,
            OrdersServiceStatus.Delivered,
          ],
        })
        .getRawMany();

      if (DelivOrderData) {
        for (const items in DelivOrderData) {
          await this.deliveriesMultipleService.removeElogQueue(
            DelivOrderData[items].order_id,
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }
}

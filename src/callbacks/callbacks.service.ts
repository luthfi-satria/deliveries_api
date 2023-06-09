import { ThirdPartyCallbacksRepository } from './../database/repository/third-party-callback.repository';
import { ThirdPartyRequestsRepository } from './../database/repository/third-party-request.repository';
import { Injectable } from '@nestjs/common';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { OrderHistoriesDocument } from 'src/database/entities/orders-history.entity';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Injectable()
export class CallbacksService {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly natsService: NatsService,
    private readonly thirdPartyRequestsRepository: ThirdPartyRequestsRepository,
    private readonly thirdPartyCallbacksRepository: ThirdPartyCallbacksRepository,
  ) {}

  async biteshipOrderStatus(data: any) {
    console.log(typeof data, '<<===== TYPEOF DATA');
    console.log(data, '<<===== DATA');

    const thirdPartyRequest = await this.thirdPartyRequestsRepository.findOne({
      where: { code: data.order_id },
      order: { created_at: 'ASC' },
    });
    console.log(thirdPartyRequest, '<<===== THIRD PARTY REQUEST');

    if (thirdPartyRequest) {
      const thirdPartyRequestId = thirdPartyRequest.id;
      await this.thirdPartyCallbacksRepository.save({
        third_party_request_id: thirdPartyRequestId,
        callback: data,
      });
    }
    const orderDelivery =
      await this.deliveriesService.findOrderDeliveryByCriteria({
        delivery_id: data.order_id,
      });

    if (orderDelivery) {
      let eventName = '';
      let status = '';
      orderDelivery.waybill_id = data.courier_waybill_id
        ? data.courier_waybill_id
        : '';
      orderDelivery.driver_name = data.courier_driver_name
        ? data.courier_driver_name
        : '';
      orderDelivery.driver_phone = data.courier_driver_phone
        ? data.courier_driver_phone
        : '';
      orderDelivery.tracking_url = data.courier_link ? data.courier_link : null;
      const flagSavePublish = true;
      switch (data.status) {
        case 'placed':
        case 'confirmed':
          eventName = data.status;
          status = 'FINDING_DRIVER';
          break;
        case 'allocated':
        case 'picked':
          eventName = data.status;
          status = 'DRIVER_FOUND';
          break;
        case 'picking_up':
          eventName = 'routed_to_origin';
          status = 'DRIVER_FOUND';
          break;
        case 'dropping_off':
          eventName = 'dropped';
          status = 'DRIVER_FOUND';
          break;
        case 'rejected':
        case 'delivered':
          eventName = data.status;
          status = 'COMPLETED';
          break;
        case 'courier_not_found':
          eventName = data.status;
          status = 'DRIVER_NOT_FOUND';
          break;
        case 'cancelled':
          eventName = data.status;
          status = 'CANCELLED';
          break;
      }
      if (flagSavePublish) {
        const orderHistory: Partial<OrderHistoriesDocument> = {
          order_id: orderDelivery.id,
          status: status,
          service_status: data.status,
        };
        await this.deliveriesService.saveOrderDeliveryHistory(orderHistory);

        orderDelivery.status = status;
        orderDelivery.service_status = data.status;
        const order = await this.deliveriesService.saveOrderDelivery(
          orderDelivery,
        );

        //broadcast
        this.natsService.clientEmit(`deliveries.order.${eventName}`, order);
      }
      return { status: true };
    } else {
      return { status: false };
    }
  }
}

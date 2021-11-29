import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NatsService } from 'src/common/nats/nats/nats.service';
import { CouriersService } from 'src/couriers/couriers.service';
import { OrderHistoriesRepository } from 'src/database/repository/orders-history.repository';
import { OrdersRepository } from 'src/database/repository/orders.repository';
import { ResponseService } from 'src/response/response.service';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  let service: DeliveriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        {
          provide: getRepositoryToken(OrdersRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(OrderHistoriesRepository),
          useValue: {},
        },
        {
          provide: CouriersService,
          useValue: {},
        },
        {
          provide: CommonService,
          useValue: {},
        },
        {
          provide: NatsService,
          useValue: {},
        },
        {
          provide: ResponseService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

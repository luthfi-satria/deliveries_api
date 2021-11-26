import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { NatsController } from './nats.controller';

describe('NatsController', () => {
  let controller: NatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NatsController],
      providers: [
        {
          provide: DeliveriesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<NatsController>(NatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

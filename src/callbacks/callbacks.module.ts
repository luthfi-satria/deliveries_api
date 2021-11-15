import { Module } from '@nestjs/common';
import { CallbacksService } from './callbacks.service';
import { CallbacksController } from './callbacks.controller';

@Module({
  controllers: [CallbacksController],
  providers: [CallbacksService],
})
export class CallbacksModule {}

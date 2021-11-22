import { Module } from '@nestjs/common';
import { CallbacksService } from './callbacks.service';
import { CallbacksController } from './callbacks.controller';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Module({
  controllers: [CallbacksController],
  providers: [CallbacksService, ResponseService, MessageService],
})
export class CallbacksModule {}

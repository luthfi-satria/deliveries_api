import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { InternalService } from './internal.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}
}

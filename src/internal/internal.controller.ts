import { Controller } from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { InternalService } from './internal.service';
import { MessageService } from 'src/message/message.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}
}

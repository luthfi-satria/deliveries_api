import { Controller } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CronElogService } from './cron-elog.service';

@Controller('api/v1/cron/elog')
export class CronElogController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly cronElogService: CronElogService,
  ) {}
}

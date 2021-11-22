import { Injectable } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class InternalService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
  ) {}
}

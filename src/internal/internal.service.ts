import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { deleteCredParam, delExcludeParam } from 'src/utils/general-utils';

@Injectable()
export class InternalService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
  ) {}
}

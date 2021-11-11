import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CourierDocument } from 'src/database/entities/couriers.entity';
import { dbOutputTime } from 'src/utils/general-utils';
import { Repository } from 'typeorm';
import { CreateCourierDto } from './dto/create-courier.dto';
import { FindCourierDto } from './dto/find-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { Response } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { FetchCourierService } from 'src/common/courier/courier.service';

@Injectable()
export class CouriersService {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @InjectRepository(CourierDocument)
    private readonly courierRepository: Repository<CourierDocument>,
    private readonly fetchCourierService: FetchCourierService,
  ) {}

  create(createCourierDto: CreateCourierDto) {
    return 'This action adds a new courier';
  }

  async findAll(data: FindCourierDto) {
    const search = data.search || null;
    const perPage = data.limit || 10;
    const currentPage = data.page || 1;
    const statuses = data.statuses?.length ? data.statuses : null;

    const [items, count] = await this.courierRepository
      .createQueryBuilder('couriers')
      .where(
        `${search ? 'couriers.name ilike :search AND ' : ''} ${
          statuses ? 'couriers.status in (:...statuses)' : ''
        }`,
        {
          search,
          statuses,
        },
      )
      .take(perPage)
      .skip((currentPage - 1) * perPage)
      .getManyAndCount()
      .catch((error) => {
        console.error(error);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('delivery.getAllCouriers.fail'),
                error.message,
              ],
            },
            'Bad Request',
          ),
        );
      });

    return {
      total_item: count,
      limit: perPage,
      current_page: currentPage,
      items: items.map((courier: any) => {
        return dbOutputTime(courier);
      }),
    };
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'courier_id',
            constraint: [
              this.messageService.get(
                'delivery.getAllCouriers.courierNotFound',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const item = await this.courierRepository.findOneOrFail(id).catch(() => {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: id,
            property: 'courier_id',
            constraint: [
              this.messageService.get(
                'delivery.getAllCouriers.courierNotFound',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    });
    return { courier: dbOutputTime(item) };
  }

  async fetch() {
    const fetchData = await this.fetchCourierService
      .fetchCouriersFromBiteship()
      .catch((error) => {
        throw error;
      });

    const couriersToSave: Partial<CourierDocument>[] = fetchData.map(
      (courier: any) => {
        const save: Partial<CourierDocument> = {
          name: courier.courier_name,
          code: courier.courier_code,
          service_name: courier.courier_service_name,
          service_code: courier.courier_service_code,
          tier: courier.tier,
          description: courier.description,
          service_type: courier.service_type,
          shipping_type: courier.shipping_type,
          duration_range: courier.shipment_duration_range,
          duration_unit: courier.shipment_duration_unit,
        };
        return save;
      },
    );

    await this.courierRepository
      .createQueryBuilder('courier')
      .insert()
      .into(CourierDocument)
      .values(couriersToSave)
      .orUpdate(
        [
          'name',
          'service_name',
          'tier',
          'description',
          'service_type',
          'shipping_type',
          'duration_range',
          'duration_unit',
        ],
        ['code', 'service_code'],
      )
      .execute();
    return { status: true };
  }

  update(id: number, updateCourierDto: UpdateCourierDto) {
    return `This action updates a #${id} courier`;
  }

  remove(id: number) {
    return `This action removes a #${id} courier`;
  }
}

import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CourierStatus } from 'src/database/entities/couriers.entity';
import { CreateCourierDto } from './create-courier.dto';

export class UpdateCourierDto extends PartialType(CreateCourierDto) {
  @IsString()
  @IsEnum(CourierStatus)
  @IsOptional()
  status: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sequence: number;

  courierId: string;
}

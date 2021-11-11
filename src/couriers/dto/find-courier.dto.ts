import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CourierStatus } from 'src/database/entities/couriers.entity';

export class FindCourierDto {
  @IsOptional()
  search: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsArray()
  @IsOptional()
  statuses: string[];
}

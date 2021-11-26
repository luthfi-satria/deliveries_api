import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
} from 'class-validator';

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

  @IsLatitude()
  @IsOptional()
  @Type(() => Number)
  location_latitude: number;

  @IsLongitude()
  @IsOptional()
  @Type(() => Number)
  location_longitude: number;

  @IsLatitude()
  @IsOptional()
  @Type(() => Number)
  destination_latitude: number;

  @IsLongitude()
  @IsOptional()
  @Type(() => Number)
  destination_longitude: number;

  @IsOptional()
  courier_id: string;

  @IsOptional()
  courier_codes: string[];
}

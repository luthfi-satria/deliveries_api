import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class FetchCourierWithPrice {
  @IsLatitude()
  @Type(() => Number)
  origin_latitude: number;

  @IsLongitude()
  @Type(() => Number)
  origin_longitude: number;

  @IsLatitude()
  @Type(() => Number)
  destination_latitude: number;

  @IsLongitude()
  @Type(() => Number)
  destination_longitude: number;

  @IsString()
  couriers: string;

  @IsOptional()
  items: any[];
}

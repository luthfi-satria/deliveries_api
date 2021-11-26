import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class GetDeliveryPrice {
  courier_id: string;

  courier_code: string[];

  @IsLatitude()
  @Type(() => Number)
  location_latitude: number;

  @IsLongitude()
  @Type(() => Number)
  location_longitude: number;

  @IsLatitude()
  @Type(() => Number)
  destination_latitude: number;

  @IsLongitude()
  @Type(() => Number)
  destination_longitude: number;
}

export class GetCouriersBulk {
  ids: string[];
}

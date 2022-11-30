import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';

export class ElogCouriersAvailabilityDocuments {
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}

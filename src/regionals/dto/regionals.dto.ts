import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class RegionalsDTO {
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
}

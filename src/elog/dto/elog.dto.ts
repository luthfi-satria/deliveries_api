import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class EditElogSettingsDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsOptional()
  value: string;
}

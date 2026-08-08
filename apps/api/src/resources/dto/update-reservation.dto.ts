import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RESOURCE_RESERVATION_STATUSES } from '../resource.types';

export class UpdateReservationDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @IsOptional()
  @IsIn(RESOURCE_RESERVATION_STATUSES)
  status?: (typeof RESOURCE_RESERVATION_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

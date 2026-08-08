import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  RESOURCE_RESERVATION_SOURCE_TYPES,
  RESOURCE_RESERVATION_STATUSES,
} from '../resource.types';

export class CreateReservationDto {
  @IsUUID()
  organizationId: string;

  @IsIn(RESOURCE_RESERVATION_SOURCE_TYPES)
  sourceType: (typeof RESOURCE_RESERVATION_SOURCE_TYPES)[number];

  @IsString()
  @MaxLength(120)
  sourceId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsOptional()
  @IsIn(RESOURCE_RESERVATION_STATUSES)
  status?: (typeof RESOURCE_RESERVATION_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

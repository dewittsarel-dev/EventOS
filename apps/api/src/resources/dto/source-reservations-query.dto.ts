import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';
import { RESOURCE_RESERVATION_SOURCE_TYPES } from '../resource.types';

export class SourceReservationsQueryDto {
  @IsUUID()
  organizationId: string;

  @IsIn(RESOURCE_RESERVATION_SOURCE_TYPES)
  sourceType: (typeof RESOURCE_RESERVATION_SOURCE_TYPES)[number];

  @IsString()
  @MaxLength(120)
  sourceId: string;
}

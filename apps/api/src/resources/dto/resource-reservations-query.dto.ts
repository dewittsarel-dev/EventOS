import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ResourceReservationsQueryDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

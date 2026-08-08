import { IsDateString, IsUUID } from 'class-validator';

export class AvailabilityCalendarQueryDto {
  @IsUUID()
  organizationId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

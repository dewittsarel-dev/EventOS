import { IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  organizationId: string;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;
}

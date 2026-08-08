import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EventResourceRequestDto {
  @IsUUID()
  resourceId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsDateString()
  reservedDate?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allowPartial?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReserveEventResourcesDto {
  @IsUUID()
  organizationId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EventResourceRequestDto)
  requests: EventResourceRequestDto[];
}

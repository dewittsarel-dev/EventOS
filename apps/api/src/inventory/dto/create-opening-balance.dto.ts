import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

function trimOptional(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class CreateOpeningBalanceDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ example: 'location-uuid' })
  @IsUUID()
  storageLocationId: string;

  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ example: 'OB-2026-07' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ example: 'Initial stock take' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ example: 'Initial stock take at go-live' })
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  reason: string;
}

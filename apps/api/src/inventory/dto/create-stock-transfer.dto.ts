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

export class CreateStockTransferDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ example: 'source-location-uuid' })
  @IsUUID()
  sourceLocationId: string;

  @ApiProperty({ example: 'destination-location-uuid' })
  @IsUUID()
  destinationLocationId: string;

  @ApiProperty({ example: 6, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 'Warehouse balancing transfer' })
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  reason: string;

  @ApiPropertyOptional({ example: 'TRF-2026-07-31' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ example: 'Move chairs to satellite location' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

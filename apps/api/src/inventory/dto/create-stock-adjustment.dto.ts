import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum StockAdjustmentType {
  Increase = 'Increase',
  Decrease = 'Decrease',
}

function trimOptional(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class CreateStockAdjustmentDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ example: 'location-uuid' })
  @IsUUID()
  storageLocationId: string;

  @ApiProperty({
    enum: StockAdjustmentType,
    example: StockAdjustmentType.Increase,
  })
  @IsEnum(StockAdjustmentType)
  adjustmentType: StockAdjustmentType;

  @ApiProperty({ example: 10, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 'Cycle count reconciliation' })
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  reason: string;

  @ApiPropertyOptional({ example: 'ADJ-1002' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ example: 'Verified by operations manager' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

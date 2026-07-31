import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { InventoryItemType } from './inventory-item-type.enum';
import { UnitOfMeasure } from './unit-of-measure.enum';

function trimInput(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function trimOptional(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class CreateInventoryItemDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'CHAIR-001' })
  @Transform(({ value }) => trimInput(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sku: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string;

  @ApiProperty({ example: 'Banquet Chair' })
  @Transform(({ value }) => trimInput(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional({ example: 'Gold frame banquet chair' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @IsOptional()
  @IsUUID()
  preferredSupplierId?: string;

  @ApiProperty({
    enum: InventoryItemType,
    example: InventoryItemType.Furniture,
  })
  @IsEnum(InventoryItemType)
  itemType: InventoryItemType;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.Each })
  @IsEnum(UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  replacementValue?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentalPrice?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  trackQuantity?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  trackSerialNumbers?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  minimumStock?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 'Handle with care' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierProductCategory } from './supplier-product-category.enum';
import { SupplierProductUnit } from './supplier-product-unit.enum';

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

export class CreateSupplierProductDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Moving Head Beam 230W' })
  @Transform(({ value }) => trimInput(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  productName: string;

  @ApiPropertyOptional({ example: 'LIGHT-MHB-230' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @ApiProperty({ enum: SupplierProductCategory })
  @IsEnum(SupplierProductCategory)
  category: SupplierProductCategory;

  @ApiPropertyOptional({ example: 'Chauvet' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional({
    example: 'Professional moving head lighting fixture.',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: SupplierProductUnit })
  @IsEnum(SupplierProductUnit)
  unit: SupplierProductUnit;

  @ApiProperty({ example: 8500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice: number;

  @ApiPropertyOptional({ example: 11999 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatPercent?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumOrderQuantity?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  preferredProduct?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'Available for seasonal demand spikes.' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

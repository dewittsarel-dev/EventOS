import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierProductCategory } from './supplier-product-category.enum';
import { SupplierProductUnit } from './supplier-product-unit.enum';

function trimOptional(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class UpdateSupplierProductDto {
  @ApiPropertyOptional({ example: 'Moving Head Beam 230W' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  productName?: string;

  @ApiPropertyOptional({ example: 'LIGHT-MHB-230', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @ApiPropertyOptional({ enum: SupplierProductCategory })
  @IsOptional()
  @IsEnum(SupplierProductCategory)
  category?: SupplierProductCategory;

  @ApiPropertyOptional({ example: 'Chauvet', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;

  @ApiPropertyOptional({
    example: 'Professional moving head lighting fixture.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: SupplierProductUnit })
  @IsOptional()
  @IsEnum(SupplierProductUnit)
  unit?: SupplierProductUnit;

  @ApiPropertyOptional({ example: 8500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 11999, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number | null;

  @ApiPropertyOptional({ example: 15, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatPercent?: number | null;

  @ApiPropertyOptional({ example: 7, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumOrderQuantity?: number | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  preferredProduct?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'Available for seasonal demand spikes.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

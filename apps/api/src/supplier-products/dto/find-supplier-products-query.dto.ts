import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierProductCategory } from './supplier-product-category.enum';
import { SupplierProductSortBy } from './supplier-product-sort.enum';

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
}

function toBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return false;
}

export class FindSupplierProductsQueryDto {
  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 'moving head' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ enum: SupplierProductCategory })
  @IsOptional()
  @IsEnum(SupplierProductCategory)
  category?: SupplierProductCategory;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: SupplierProductSortBy })
  @IsOptional()
  @IsEnum(SupplierProductSortBy)
  sortBy?: SupplierProductSortBy;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

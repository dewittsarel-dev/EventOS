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
import { InventoryItemType } from './inventory-item-type.enum';
import { InventoryMarketplaceVisibility } from './inventory-marketplace-visibility.enum';
import { InventoryResourceStatus } from './inventory-resource-status.enum';
import { InventorySortBy } from './inventory-sort.enum';
import { toBoolean, toNumber } from './query-transforms';

export class FindInventoryItemsQueryDto {
  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 'chair' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ example: 'rustic' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  style?: string;

  @ApiPropertyOptional({ example: 'metal' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  material?: string;

  @ApiPropertyOptional({ example: 'gold' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  colour?: string;

  @ApiPropertyOptional({ example: '50cm' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dimensions?: string;

  @ApiPropertyOptional({ example: 'wedding,premium' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tags?: string;

  @ApiPropertyOptional({ example: 'banquet,stackable' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  keywords?: string;

  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: InventoryItemType })
  @IsOptional()
  @IsEnum(InventoryItemType)
  itemType?: InventoryItemType;

  @ApiPropertyOptional({ enum: InventoryResourceStatus })
  @IsOptional()
  @IsEnum(InventoryResourceStatus)
  resourceStatus?: InventoryResourceStatus;

  @ApiPropertyOptional({ enum: InventoryMarketplaceVisibility })
  @IsOptional()
  @IsEnum(InventoryMarketplaceVisibility)
  marketplaceVisibility?: InventoryMarketplaceVisibility;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @IsOptional()
  @IsUUID()
  preferredSupplierId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  lowStockOnly?: boolean;

  @ApiPropertyOptional({ enum: InventorySortBy, example: InventorySortBy.Name })
  @IsOptional()
  @IsEnum(InventorySortBy)
  sortBy?: InventorySortBy;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

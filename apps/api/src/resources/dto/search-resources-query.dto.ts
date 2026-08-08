import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  RESOURCE_QUANTITY_MODES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  RESOURCE_VISIBILITIES,
} from '../resource.types';

export class SearchResourcesQueryDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];

  @IsOptional()
  @IsIn(RESOURCE_QUANTITY_MODES)
  quantityMode?: (typeof RESOURCE_QUANTITY_MODES)[number];

  @IsOptional()
  @IsIn(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @IsOptional()
  @IsIn(RESOURCE_VISIBILITIES)
  visibility?: (typeof RESOURCE_VISIBILITIES)[number];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

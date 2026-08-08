import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  RESOURCE_CONDITIONS,
  RESOURCE_QUANTITY_MODES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  RESOURCE_VISIBILITIES,
} from '../resource.types';

export class UpdateResourceDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  aiSummary?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  searchPhrases?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUrl(
    {
      require_protocol: true,
    },
    { each: true },
  )
  imageUrls?: string[];

  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];

  @IsOptional()
  @IsIn(RESOURCE_QUANTITY_MODES)
  quantityMode?: (typeof RESOURCE_QUANTITY_MODES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  barcode?: string | null;

  @IsOptional()
  @IsIn(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @IsOptional()
  @IsIn(RESOURCE_VISIBILITIES)
  visibility?: (typeof RESOURCE_VISIBILITIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  totalQuantity?: number | null;

  @IsOptional()
  @IsIn(RESOURCE_CONDITIONS)
  condition?: (typeof RESOURCE_CONDITIONS)[number];

  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseValue?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  replacementValue?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentalPrice?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  damagedQuantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maintenanceQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

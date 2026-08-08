import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InventoryIndoorOutdoor } from './inventory-indoor-outdoor.enum';
import { InventoryMarketplaceVisibility } from './inventory-marketplace-visibility.enum';
import { InventoryItemType } from './inventory-item-type.enum';
import { InventoryResourceStatus } from './inventory-resource-status.enum';
import { UnitOfMeasure } from './unit-of-measure.enum';

function trimOptional(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({
    example: 'Banquet Chair - Gold Frame',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  publicName?: string | null;

  @ApiPropertyOptional({ example: 'Chair GF Batch A', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  internalName?: string | null;

  @ApiPropertyOptional({ example: 'CHAIR-001' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string | null;

  @ApiPropertyOptional({ example: 'QR-CHAIR-001', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  qrCode?: string | null;

  @ApiPropertyOptional({ example: 'Banquet Chair' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional({ example: 'Gold frame banquet chair', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Premium gold banquet chair',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string | null;

  @ApiPropertyOptional({
    example: 'Long-form narrative description for AI and marketplace.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(6000)
  longDescription?: string | null;

  @ApiPropertyOptional({
    example: 'Internal handling notes for warehouse team.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string | null;

  @ApiPropertyOptional({
    example: 'Royal Gold Banquet Chair',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  marketplaceTitle?: string | null;

  @ApiPropertyOptional({
    example: 'Elegant stackable seating for weddings and formal banquets.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  marketplaceDescription?: string | null;

  @ApiPropertyOptional({
    example: 'A versatile chair suitable for weddings and conferences.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  aiSummary?: string | null;

  @ApiPropertyOptional({ example: ['banquet', 'gold', 'stackable'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  aiKeywords?: string[];

  @ApiPropertyOptional({ example: ['wedding', 'premium'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  aiTags?: string[];

  @ApiPropertyOptional({ example: 0.87, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  aiConfidence?: number | null;

  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Seating', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string | null;

  @ApiPropertyOptional({ example: 'Acme Events', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;

  @ApiPropertyOptional({ example: 'supplier-uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  preferredSupplierId?: string | null;

  @ApiPropertyOptional({ enum: InventoryResourceStatus })
  @IsOptional()
  @IsEnum(InventoryResourceStatus)
  resourceStatus?: InventoryResourceStatus;

  @ApiPropertyOptional({ enum: InventoryItemType })
  @IsOptional()
  @IsEnum(InventoryItemType)
  itemType?: InventoryItemType;

  @ApiPropertyOptional({ enum: UnitOfMeasure })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unitOfMeasure?: UnitOfMeasure;

  @ApiPropertyOptional({ example: 'Rustic', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  style?: string | null;

  @ApiPropertyOptional({ example: 'Royal Classic', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string | null;

  @ApiPropertyOptional({ example: 'Gold', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  colour?: string | null;

  @ApiPropertyOptional({ example: 'Metal', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  material?: string | null;

  @ApiPropertyOptional({ example: '50cm x 45cm x 90cm', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dimensions?: string | null;

  @ApiPropertyOptional({ example: '6kg', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  weight?: string | null;

  @ApiPropertyOptional({ example: '1 person', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  capacity?: string | null;

  @ApiPropertyOptional({ enum: InventoryIndoorOutdoor })
  @IsOptional()
  @IsEnum(InventoryIndoorOutdoor)
  indoorOutdoor?: InventoryIndoorOutdoor;

  @ApiPropertyOptional({ example: ['Wedding', 'Corporate'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  suitableEventTypes?: string[];

  @ApiPropertyOptional({ example: ['hero-item', 'best-seller'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  manualTags?: string[];

  @ApiPropertyOptional({ example: ['stackable', 'banquet', 'formal'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: ['luxury', 'event-favorite'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  aiGeneratedTags?: string[];

  @ApiPropertyOptional({ enum: InventoryMarketplaceVisibility })
  @IsOptional()
  @IsEnum(InventoryMarketplaceVisibility)
  marketplaceVisibility?: InventoryMarketplaceVisibility;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/resource-1.jpg'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl({ require_protocol: true }, { each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/resource-1.jpg',
    nullable: true,
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  primaryPhotoUrl?: string | null;

  @ApiPropertyOptional({
    example: [
      {
        url: 'https://cdn.example.com/resource-1.jpg',
        isPrimary: true,
        aiAnalysisSummary: null,
        backgroundEnhancementStatus: 'pending',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsObject({ each: true })
  photoAssets?: Record<string, unknown>[];

  @ApiPropertyOptional({ example: 450, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number | null;

  @ApiPropertyOptional({ example: 900, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  replacementValue?: number | null;

  @ApiPropertyOptional({ example: 120, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentalPrice?: number | null;

  @ApiPropertyOptional({ example: 0, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  trackQuantity?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  trackSerialNumbers?: boolean;

  @ApiPropertyOptional({ example: 20, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  minimumStock?: number | null;

  @ApiPropertyOptional({ example: 30, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  reorderLevel?: number | null;

  @ApiPropertyOptional({ example: 'Handle with care', nullable: true })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

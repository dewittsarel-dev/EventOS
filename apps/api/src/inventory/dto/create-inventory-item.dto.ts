import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
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

  @ApiPropertyOptional({ example: 'Banquet Chair - Gold Frame' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  publicName?: string;

  @ApiPropertyOptional({ example: 'Chair GF Batch A' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  internalName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string;

  @ApiPropertyOptional({ example: 'QR-CHAIR-001' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  qrCode?: string;

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

  @ApiPropertyOptional({ example: 'Premium gold banquet chair' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'Long-form narrative description for AI and marketplace.',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(6000)
  longDescription?: string;

  @ApiPropertyOptional({
    example: 'Internal handling notes for warehouse team.',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;

  @ApiPropertyOptional({
    example: 'Royal Gold Banquet Chair',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  marketplaceTitle?: string;

  @ApiPropertyOptional({
    example: 'Elegant stackable seating for weddings and formal banquets.',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  marketplaceDescription?: string;

  @ApiPropertyOptional({
    example: 'A versatile chair suitable for weddings and conferences.',
  })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  aiSummary?: string;

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

  @ApiPropertyOptional({ example: 0.87 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  aiConfidence?: number;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'Seating' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Acme Events' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @IsOptional()
  @IsUUID()
  preferredSupplierId?: string;

  @ApiPropertyOptional({ enum: InventoryResourceStatus })
  @IsOptional()
  @IsEnum(InventoryResourceStatus)
  resourceStatus?: InventoryResourceStatus;

  @ApiProperty({
    enum: InventoryItemType,
    example: InventoryItemType.Furniture,
  })
  @IsEnum(InventoryItemType)
  itemType: InventoryItemType;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.Each })
  @IsEnum(UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;

  @ApiPropertyOptional({ example: 'Rustic' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  style?: string;

  @ApiPropertyOptional({ example: 'Royal Classic' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string;

  @ApiPropertyOptional({ example: 'Gold' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  colour?: string;

  @ApiPropertyOptional({ example: 'Metal' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  material?: string;

  @ApiPropertyOptional({ example: '50cm x 45cm x 90cm' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dimensions?: string;

  @ApiPropertyOptional({ example: '6kg' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  weight?: string;

  @ApiPropertyOptional({ example: '1 person' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  capacity?: string;

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

  @ApiPropertyOptional({ example: 'https://cdn.example.com/resource-1.jpg' })
  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  primaryPhotoUrl?: string;

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

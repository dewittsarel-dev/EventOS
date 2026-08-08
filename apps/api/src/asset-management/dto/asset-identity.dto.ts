import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssetCreationSource,
  AssetLifecycleStatus,
  AssetOwnershipType,
  AssetTrackingMode,
} from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssetDefinitionDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  @MaxLength(80)
  assetCode: string;

  @IsString()
  @MaxLength(180)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsString()
  @MaxLength(120)
  classification: string;

  @IsString()
  @MaxLength(120)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subcategory?: string;

  @IsEnum(AssetTrackingMode)
  trackingMode: AssetTrackingMode;

  @IsEnum(AssetOwnershipType)
  ownershipType: AssetOwnershipType;

  @IsString()
  @MaxLength(80)
  unitOfMeasure: string;

  @IsEnum(AssetCreationSource)
  creationSource: AssetCreationSource;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ownershipPartyType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownershipPartyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  family?: string;

  @IsOptional()
  @IsObject()
  variantAttributes?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  internalSku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supplierSku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  replacementValue?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  capabilityTags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  originatingType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  originatingId?: string;
}

export class CreateAssetInstanceDto {
  @IsUUID()
  assetDefinitionId: string;

  @IsString()
  @MaxLength(120)
  operationalCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  manufacturerSerial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  qrIdentity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  barcodeIdentity?: string;

  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  conditionGrade?: string;

  @IsOptional()
  @IsDateString()
  controlStartDate?: string;

  @IsOptional()
  @IsDateString()
  expectedControlEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  sourceAgreementReference?: string;
}

export class ChangeAssetLifecycleDto {
  @ApiProperty({ enum: AssetLifecycleStatus })
  @IsEnum(AssetLifecycleStatus)
  status: AssetLifecycleStatus;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  reason: string;
}

export class AssetSearchQueryDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  search?: string;
}

export class CreateAssetBatchDto {
  @IsUUID() assetDefinitionId: string;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsOptional() @IsString() @MaxLength(180) originReference?: string;
  @IsOptional() @IsObject() attributes?: Record<string, unknown>;
}

export class AssetKitMemberDto {
  @IsString() @MaxLength(40) memberType: string;
  @IsString() @MaxLength(120) memberId: string;
  @IsNumber() @Min(0.0001) quantity: number;
}

export class CreateAssetKitDto {
  @IsUUID() assetDefinitionId: string;
  @IsString() @MaxLength(180) name: string;
  @IsArray()
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  members: AssetKitMemberDto[];
}

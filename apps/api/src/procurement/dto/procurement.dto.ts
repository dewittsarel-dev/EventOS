import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProcurementPolicyDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  minimiseCost?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  minimiseSuppliers?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportEmergingBusinesses?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  preferLocalSuppliers?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  environmentalPreference?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  preferExistingRelationships?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  balancedMarketplace?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minimumReliabilityPercent?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 12, default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  maximumSuppliersPerPackage?: number;
}

export class CreateProcurementPackageDto {
  @ApiProperty()
  @IsUUID()
  requirementSetId: string;

  @ApiProperty({ example: 'Furniture Package' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Furniture' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  requirementItemIds: string[];

  @ApiProperty({ type: ProcurementPolicyDto })
  @ValidateNested()
  @Type(() => ProcurementPolicyDto)
  policy: ProcurementPolicyDto;
}

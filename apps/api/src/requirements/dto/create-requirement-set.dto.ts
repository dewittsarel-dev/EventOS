import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RequirementDependencyLevel,
  RequirementFulfilmentStrategy,
  RequirementQuantitySource,
  RequirementType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRequirementItemDto {
  @ApiProperty({ example: 'Furniture' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ enum: RequirementType })
  @IsEnum(RequirementType)
  requirementType: RequirementType;

  @ApiProperty({ example: 'Gold Tiffany Chairs' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  specification?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: 600, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityRequired: number;

  @ApiProperty({ example: 'Each' })
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiProperty({ enum: RequirementQuantitySource })
  @IsEnum(RequirementQuantitySource)
  quantitySource: RequirementQuantitySource;

  @ApiPropertyOptional({ enum: RequirementFulfilmentStrategy })
  @IsOptional()
  @IsEnum(RequirementFulfilmentStrategy)
  fulfilmentStrategy?: RequirementFulfilmentStrategy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  collectionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  setupDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  removalDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  requiredTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  setupArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gps?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedBudgetCents?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  aiRecommendation?: string;
}

export class CreateRequirementDependencyDto {
  @ApiProperty({ minimum: 1, description: '1-based source item position' })
  @IsInt()
  @Min(1)
  sourceItemNumber: number;

  @ApiProperty({ minimum: 1, description: '1-based affected item position' })
  @IsInt()
  @Min(1)
  targetItemNumber: number;

  @ApiProperty({ enum: RequirementDependencyLevel })
  @IsEnum(RequirementDependencyLevel)
  level: RequirementDependencyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class CreateRequirementSetDto {
  @ApiProperty()
  @IsUUID()
  eventDesignVersionId: string;

  @ApiProperty({ type: [CreateRequirementItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementItemDto)
  items: CreateRequirementItemDto[];

  @ApiPropertyOptional({ type: [CreateRequirementDependencyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementDependencyDto)
  dependencies?: CreateRequirementDependencyDto[];
}

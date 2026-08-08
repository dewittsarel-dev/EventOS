import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoodBoardObjectSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MoodBoardObjectDto {
  @ApiPropertyOptional({ example: 'OBJ-001' })
  @IsOptional()
  @IsString()
  @Matches(/^OBJ-\d{3,}$/)
  objectKey?: string;

  @ApiProperty()
  @IsUUID()
  requirementItemId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: MoodBoardObjectSource })
  @IsEnum(MoodBoardObjectSource)
  source: MoodBoardObjectSource;

  @ApiProperty({ description: 'Stable id in the selected source system' })
  @IsString()
  @MaxLength(300)
  sourceReferenceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  marketplaceListingId?: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  imageUrl: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  presentation?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class MoodBoardSceneDto {
  @ApiProperty({ example: 'main-hall' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  sceneKey: string;

  @ApiProperty({ example: 'Main Hall' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [MoodBoardObjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoodBoardObjectDto)
  objects: MoodBoardObjectDto[];
}

export class CreateMoodBoardDto {
  @ApiProperty()
  @IsUUID()
  requirementSetId: string;

  @ApiProperty({ example: 'Summer Wedding Visual Concept' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Previous version for a revision' })
  @IsOptional()
  @IsUUID()
  basedOnMoodBoardId?: string;

  @ApiProperty({ type: [MoodBoardSceneDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MoodBoardSceneDto)
  scenes: MoodBoardSceneDto[];
}

export class MoodBoardReviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(3000)
  comment: string;
}

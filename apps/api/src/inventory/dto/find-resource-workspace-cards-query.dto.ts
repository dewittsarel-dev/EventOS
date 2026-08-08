import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean, toNumber } from './query-transforms';

export class FindResourceWorkspaceCardsQueryDto {
  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 'banquet chair' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ example: 'Furniture' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ example: 'wedding,expo' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tags?: string;

  @ApiPropertyOptional({ example: 'gold stackable' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  keywords?: string;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  reserved?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  damaged?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  missing?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  maintenanceDue?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  marketplacePublished?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

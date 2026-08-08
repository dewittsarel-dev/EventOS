import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSpecifications(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

export class MarketplaceCapabilityRequirementDto {
  @ApiProperty({
    example: 'Gold Tiffany Chairs',
    description: 'Item or service required by the buyer.',
  })
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(160)
  itemOrService: string;

  @ApiProperty({
    example: 150,
    description: 'Total quantity required for the date range.',
  })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0.0001)
  requiredQuantity: number;

  @ApiProperty({
    example: '2026-09-15T00:00:00.000Z',
    description: 'Start date/time when fulfilment is needed.',
  })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({
    example: '2026-09-17T23:59:59.000Z',
    description: 'End date/time for the requirement window.',
  })
  @IsDateString()
  endDateTime: string;

  @ApiProperty({
    example: 'Pretoria',
    description: 'Delivery destination used for distance estimation.',
  })
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(160)
  deliveryLocation: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Gold finish', 'Stackable', 'Indoor use'],
    description: 'Relevant buyer specifications used for objective matching.',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeSpecifications(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  specifications?: string[];
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { QuotationSortBy, QuotationSortOrder } from './quotation-sort.enum';
import { QuotationStatus } from './quotation-status.enum';

export class FindQuotationsQueryDto {
  @ApiPropertyOptional({ example: 'org-1' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'wedding package',
    description: 'Search in quote number, title and notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiPropertyOptional({ example: 'contact-1' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: 'event-1' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ enum: QuotationSortBy })
  @IsOptional()
  @IsEnum(QuotationSortBy)
  sortBy?: QuotationSortBy;

  @ApiPropertyOptional({ enum: QuotationSortOrder })
  @IsOptional()
  @IsEnum(QuotationSortOrder)
  sort?: QuotationSortOrder;

  @ApiPropertyOptional({
    example: false,
    description: 'Include archived quotations when true',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  includeArchived?: boolean;
}

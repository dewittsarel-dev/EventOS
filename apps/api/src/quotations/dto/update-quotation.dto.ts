import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuotationLineItemDto } from './quotation-line-item.dto';

export class UpdateQuotationDto {
  @ApiPropertyOptional({ example: 'contact-1' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: 'event-1', nullable: true })
  @IsOptional()
  @IsUUID()
  eventId?: string | null;

  @ApiPropertyOptional({ example: 'Updated quotation title' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string | null;

  @ApiPropertyOptional({ example: '2026-07-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-08-13T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;

  @ApiPropertyOptional({
    example: '2026-08-13T00:00:00.000Z',
    nullable: true,
    description: 'Alias for expiryDate',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxRatePercent?: number;

  @ApiPropertyOptional({
    type: QuotationLineItemDto,
    isArray: true,
    minItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  items?: QuotationLineItemDto[];
}

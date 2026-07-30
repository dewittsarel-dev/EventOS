import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuotationLineItemDto } from './quotation-line-item.dto';
import { QuotationStatus } from './quotation-status.enum';

export class CreateQuotationDto {
  @ApiProperty({ example: 'org-1', description: 'Organization id' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'contact-1', description: 'Contact id' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ example: 'event-1', description: 'Event id' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 'Wedding Package Quotation' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    example: 'Valid for 14 days from issue date.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-07-30T00:00:00.000Z',
    description: 'Issue date; defaults to now when omitted',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-13T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Discount amount in cents',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Tax rate percentage as integer 0-100',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxRatePercent?: number;

  @ApiPropertyOptional({
    example: QuotationStatus.Draft,
    enum: QuotationStatus,
  })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiProperty({
    type: QuotationLineItemDto,
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  items: QuotationLineItemDto[];
}

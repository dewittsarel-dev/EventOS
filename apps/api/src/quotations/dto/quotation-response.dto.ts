import { ApiProperty } from '@nestjs/swagger';
import { QuotationStatus } from './quotation-status.enum';

export class QuotationLineItemResponseDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: 'quote-1' })
  quotationId: string;

  @ApiProperty({ example: 'Venue setup and decor' })
  description: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 150000 })
  unitPriceCents: number;

  @ApiProperty({ example: 300000 })
  lineTotalCents: number;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class QuotationResponseDto {
  @ApiProperty({ example: 'quote-1' })
  id: string;

  @ApiProperty({ example: 'QUO-20260730-AB12CD' })
  quoteNumber: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'contact-1' })
  contactId: string;

  @ApiProperty({ example: 'event-1' })
  eventId: string;

  @ApiProperty({ example: 'Wedding Package Quotation' })
  title: string;

  @ApiProperty({
    example: 'Valid for 14 days from issue date.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ enum: QuotationStatus, example: QuotationStatus.Draft })
  status: QuotationStatus;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  issueDate: Date;

  @ApiProperty({ example: '2026-08-13T00:00:00.000Z', nullable: true })
  expiryDate: Date | null;

  @ApiProperty({ example: 450000 })
  subtotalCents: number;

  @ApiProperty({ example: 10000 })
  discountCents: number;

  @ApiProperty({ example: 15 })
  taxRatePercent: number;

  @ApiProperty({ example: 66000 })
  taxCents: number;

  @ApiProperty({ example: 506000 })
  totalCents: number;

  @ApiProperty({ example: null, nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: QuotationLineItemResponseDto, isArray: true })
  items: QuotationLineItemResponseDto[];
}

export class QuotationListResponseDto {
  @ApiProperty({ type: QuotationResponseDto, isArray: true })
  data: QuotationResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 42,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

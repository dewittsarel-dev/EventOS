import { ApiProperty } from '@nestjs/swagger';
import { SupplierCategory } from './supplier-category.enum';

export class SupplierResponseDto {
  @ApiProperty({ example: 'supplier-1' })
  id: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'EventOS HQ' })
  organizationName: string;

  @ApiProperty({ example: 'Sunrise Catering Co.' })
  companyName: string;

  @ApiProperty({ enum: SupplierCategory, example: SupplierCategory.Catering })
  category: SupplierCategory;

  @ApiProperty({ example: 'Maya Jacobs', nullable: true })
  primaryContactName: string | null;

  @ApiProperty({ example: '+27 21 555 1234', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '+27 82 000 0000', nullable: true })
  mobile: string | null;

  @ApiProperty({ example: 'hello@sunrise-catering.co.za', nullable: true })
  email: string | null;

  @ApiProperty({ example: 'https://sunrise-catering.co.za', nullable: true })
  website: string | null;

  @ApiProperty({ example: '12 Harbour Road, Foreshore', nullable: true })
  physicalAddress: string | null;

  @ApiProperty({ example: 'Cape Town', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'Western Cape', nullable: true })
  province: string | null;

  @ApiProperty({ example: '8001', nullable: true })
  postalCode: string | null;

  @ApiProperty({ example: '4010123456', nullable: true })
  vatNumber: string | null;

  @ApiProperty({ example: '2019/123456/07', nullable: true })
  registrationNumber: string | null;

  @ApiProperty({ example: false })
  preferredSupplier: boolean;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '30 days EOM', nullable: true })
  preferredPaymentTerms: string | null;

  @ApiProperty({ example: 4, nullable: true })
  internalRating: number | null;

  @ApiProperty({
    example: 'Reliable for short-notice requests.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}

export class SupplierListResponseDto {
  @ApiProperty({ type: SupplierResponseDto, isArray: true })
  data: SupplierResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 25,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

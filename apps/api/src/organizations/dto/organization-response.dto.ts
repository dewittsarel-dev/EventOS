import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ example: 'org-1' })
  id: string;

  @ApiProperty({ example: 'EventOS' })
  name: string;

  @ApiProperty({ example: 'eventos' })
  slug: string;

  @ApiProperty({ example: 'EventOS', required: false, nullable: true })
  tradingName?: string | null;

  @ApiProperty({ example: 'VAT-12345', required: false, nullable: true })
  vatNumber?: string | null;

  @ApiProperty({ example: 'REG-98765', required: false, nullable: true })
  registrationNumber?: string | null;

  @ApiProperty({
    example: 'hello@eventos.example',
    required: false,
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({ example: '+27 11 555 0100', required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({
    example: 'https://eventos.example',
    required: false,
    nullable: true,
  })
  website?: string | null;

  @ApiProperty({
    example: '1 Harbour Road, Cape Town, South Africa',
    required: false,
    nullable: true,
  })
  physicalAddress?: string | null;

  @ApiProperty({
    example: 'PO Box 100, Cape Town, 8000',
    required: false,
    nullable: true,
  })
  postalAddress?: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/eventos-logo.png',
    required: false,
    nullable: true,
  })
  logoUrl?: string | null;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationListResponseDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  data: OrganizationResponseDto[];

  @ApiProperty({ example: { page: 1, limit: 10, total: 1 } })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

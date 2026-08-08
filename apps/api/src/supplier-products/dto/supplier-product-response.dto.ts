import { ApiProperty } from '@nestjs/swagger';
import { SupplierProductCategory } from './supplier-product-category.enum';
import { SupplierProductUnit } from './supplier-product-unit.enum';

export class SupplierProductResponseDto {
  @ApiProperty({ example: 'product-1' })
  id: string;

  @ApiProperty({ example: 'supplier-1' })
  supplierId: string;

  @ApiProperty({ example: 'Sunrise Lighting Co.' })
  supplierName: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'EventOS Demo Organization' })
  organizationName: string;

  @ApiProperty({ example: 'Moving Head Beam 230W' })
  productName: string;

  @ApiProperty({ example: 'LIGHT-MHB-230', nullable: true })
  sku: string | null;

  @ApiProperty({ enum: SupplierProductCategory })
  category: SupplierProductCategory;

  @ApiProperty({ example: 'Chauvet', nullable: true })
  brand: string | null;

  @ApiProperty({
    example: 'Professional moving head lighting fixture.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ enum: SupplierProductUnit })
  unit: SupplierProductUnit;

  @ApiProperty({ example: 8500 })
  costPrice: number;

  @ApiProperty({ example: 11999, nullable: true })
  sellingPrice: number | null;

  @ApiProperty({ example: 15, nullable: true })
  vatPercent: number | null;

  @ApiProperty({ example: 7, nullable: true })
  leadTimeDays: number | null;

  @ApiProperty({ example: 2, nullable: true })
  minimumOrderQuantity: number | null;

  @ApiProperty({ example: false })
  preferredProduct: boolean;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({
    example: 'Available for seasonal demand spikes.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  updatedAt: Date;
}

export class SupplierProductListResponseDto {
  @ApiProperty({ type: SupplierProductResponseDto, isArray: true })
  data: SupplierProductResponseDto[];

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

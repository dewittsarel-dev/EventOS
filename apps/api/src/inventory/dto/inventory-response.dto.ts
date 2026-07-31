import { ApiProperty } from '@nestjs/swagger';
import { InventoryItemType } from './inventory-item-type.enum';
import { StockMovementType } from './stock-movement-type.enum';
import { UnitOfMeasure } from './unit-of-measure.enum';

export class InventoryCategoryResponseDto {
  @ApiProperty({ example: 'category-1' })
  id: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'Furniture' })
  name: string;

  @ApiProperty({ example: 'Chairs and tables', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  updatedAt: Date;
}

export class StorageLocationResponseDto {
  @ApiProperty({ example: 'location-1' })
  id: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'Main Warehouse' })
  name: string;

  @ApiProperty({ example: 'MAIN-WH' })
  code: string;

  @ApiProperty({ example: '12 Harbour Road', nullable: true })
  physicalAddress: string | null;

  @ApiProperty({ example: 'Cape Town', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'Western Cape', nullable: true })
  province: string | null;

  @ApiProperty({ example: 'Primary storage', nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  updatedAt: Date;
}

export class InventoryStockSummaryDto {
  @ApiProperty({ example: 100 })
  quantityOnHand: number;

  @ApiProperty({ example: 15 })
  quantityReserved: number;

  @ApiProperty({ example: 85 })
  quantityAvailable: number;
}

export class InventoryItemResponseDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'CHAIR-001' })
  sku: string;

  @ApiProperty({ example: '1234567890123', nullable: true })
  barcode: string | null;

  @ApiProperty({ example: 'Banquet Chair' })
  name: string;

  @ApiProperty({ example: 'Gold frame banquet chair', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'category-1' })
  categoryId: string;

  @ApiProperty({ example: 'Furniture' })
  categoryName: string;

  @ApiProperty({ example: 'supplier-1', nullable: true })
  preferredSupplierId: string | null;

  @ApiProperty({ example: 'Sunrise Catering', nullable: true })
  preferredSupplierName: string | null;

  @ApiProperty({
    enum: InventoryItemType,
    example: InventoryItemType.Furniture,
  })
  itemType: InventoryItemType;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.Each })
  unitOfMeasure: UnitOfMeasure;

  @ApiProperty({ example: 450, nullable: true })
  costPrice: number | null;

  @ApiProperty({ example: 900, nullable: true })
  replacementValue: number | null;

  @ApiProperty({ example: 120, nullable: true })
  rentalPrice: number | null;

  @ApiProperty({ example: 0, nullable: true })
  sellingPrice: number | null;

  @ApiProperty({ example: true })
  taxable: boolean;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: true })
  trackQuantity: boolean;

  @ApiProperty({ example: false })
  trackSerialNumbers: boolean;

  @ApiProperty({ example: 20, nullable: true })
  minimumStock: number | null;

  @ApiProperty({ example: 30, nullable: true })
  reorderLevel: number | null;

  @ApiProperty({ example: 'Handle with care', nullable: true })
  notes: string | null;

  @ApiProperty({ type: InventoryStockSummaryDto })
  stock: InventoryStockSummaryDto;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  updatedAt: Date;
}

export class StockLevelResponseDto {
  @ApiProperty({ example: 'item-1' })
  inventoryItemId: string;

  @ApiProperty({ example: 'Banquet Chair' })
  inventoryItemName: string;

  @ApiProperty({ example: 'location-1' })
  storageLocationId: string;

  @ApiProperty({ example: 'Main Warehouse' })
  storageLocationName: string;

  @ApiProperty({ example: 100 })
  quantityOnHand: number;

  @ApiProperty({ example: 15 })
  quantityReserved: number;

  @ApiProperty({ example: 85 })
  quantityAvailable: number;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  updatedAt: Date;
}

export class StockMovementResponseDto {
  @ApiProperty({ example: 'movement-1' })
  id: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  organizationId: string;

  @ApiProperty({ example: 'item-1' })
  inventoryItemId: string;

  @ApiProperty({ example: 'Banquet Chair' })
  inventoryItemName: string;

  @ApiProperty({ example: 'location-1' })
  storageLocationId: string;

  @ApiProperty({ example: 'Main Warehouse' })
  storageLocationName: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.StockIn })
  movementType: StockMovementType;

  @ApiProperty({ example: 12 })
  quantity: number;

  @ApiProperty({ example: 'PO-1001', nullable: true })
  reference: string | null;

  @ApiProperty({ example: 'Initial count correction', nullable: true })
  reason: string | null;

  @ApiProperty({ example: 'Counted by warehouse manager', nullable: true })
  notes: string | null;

  @ApiProperty({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  createdByUserId: string;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  createdAt: Date;
}

export class InventoryListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 52 })
  total: number;
}

export class InventoryItemListResponseDto {
  @ApiProperty({ type: [InventoryItemResponseDto] })
  data: InventoryItemResponseDto[];

  @ApiProperty({ type: InventoryListMetaDto })
  meta: InventoryListMetaDto;
}

export class InventoryCategoryListResponseDto {
  @ApiProperty({ type: [InventoryCategoryResponseDto] })
  data: InventoryCategoryResponseDto[];

  @ApiProperty({ type: InventoryListMetaDto })
  meta: InventoryListMetaDto;
}

export class StorageLocationListResponseDto {
  @ApiProperty({ type: [StorageLocationResponseDto] })
  data: StorageLocationResponseDto[];

  @ApiProperty({ type: InventoryListMetaDto })
  meta: InventoryListMetaDto;
}

export class StockLevelListResponseDto {
  @ApiProperty({ type: [StockLevelResponseDto] })
  data: StockLevelResponseDto[];

  @ApiProperty({ type: InventoryListMetaDto })
  meta: InventoryListMetaDto;
}

export class StockMovementListResponseDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  data: StockMovementResponseDto[];

  @ApiProperty({ type: InventoryListMetaDto })
  meta: InventoryListMetaDto;
}

export class InventoryOverviewResponseDto {
  @ApiProperty({ example: 125 })
  totalActiveItems: number;

  @ApiProperty({ example: 3500 })
  totalStockQuantity: number;

  @ApiProperty({ example: 8 })
  lowStockItems: number;

  @ApiProperty({ example: 2 })
  outOfStockItems: number;

  @ApiProperty({ example: 3 })
  activeLocations: number;

  @ApiProperty({ type: [StockMovementResponseDto] })
  recentStockMovements: StockMovementResponseDto[];
}

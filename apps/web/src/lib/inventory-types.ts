export type InventoryItemType =
  | 'Equipment'
  | 'Furniture'
  | 'Decor'
  | 'Consumable'
  | 'Product'
  | 'Service'
  | 'Other';

export type UnitOfMeasure =
  | 'Each'
  | 'Pair'
  | 'Set'
  | 'Box'
  | 'Pack'
  | 'Metre'
  | 'SquareMetre'
  | 'Kilogram'
  | 'Litre'
  | 'Hour'
  | 'Day'
  | 'Other';

export type StockMovementType =
  | 'OpeningBalance'
  | 'StockIn'
  | 'StockOut'
  | 'AdjustmentIncrease'
  | 'AdjustmentDecrease'
  | 'TransferIn'
  | 'TransferOut'
  | 'Damaged'
  | 'Lost'
  | 'Returned';

export type InventorySortBy = 'name' | 'sku' | 'newest' | 'oldest' | 'stockLevel';

export type InventoryCategoryRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StorageLocationRecord = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  physicalAddress: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItemRecord = {
  id: string;
  organizationId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  preferredSupplierId: string | null;
  preferredSupplierName: string | null;
  itemType: InventoryItemType;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number | null;
  replacementValue: number | null;
  rentalPrice: number | null;
  sellingPrice: number | null;
  taxable: boolean;
  active: boolean;
  trackQuantity: boolean;
  trackSerialNumbers: boolean;
  minimumStock: number | null;
  reorderLevel: number | null;
  notes: string | null;
  stock: {
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type StockLevelRecord = {
  inventoryItemId: string;
  inventoryItemName: string;
  storageLocationId: string;
  storageLocationName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  updatedAt: string;
};

export type StockMovementRecord = {
  id: string;
  organizationId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  storageLocationId: string;
  storageLocationName: string;
  movementType: StockMovementType;
  quantity: number;
  reference: string | null;
  reason: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type PagedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type InventoryOverview = {
  totalActiveItems: number;
  totalStockQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeLocations: number;
  recentStockMovements: StockMovementRecord[];
};

export type CreateInventoryCategoryPayload = {
  organizationId: string;
  name: string;
  description?: string;
  active?: boolean;
};

export type UpdateInventoryCategoryPayload = Partial<
  Omit<CreateInventoryCategoryPayload, 'organizationId'>
>;

export type CreateStorageLocationPayload = {
  organizationId: string;
  name: string;
  code: string;
  physicalAddress?: string;
  city?: string;
  province?: string;
  notes?: string;
  active?: boolean;
};

export type UpdateStorageLocationPayload = Partial<
  Omit<CreateStorageLocationPayload, 'organizationId'>
>;

export type CreateInventoryItemPayload = {
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  preferredSupplierId?: string;
  itemType: InventoryItemType;
  unitOfMeasure: UnitOfMeasure;
  costPrice?: number;
  replacementValue?: number;
  rentalPrice?: number;
  sellingPrice?: number;
  taxable?: boolean;
  active?: boolean;
  trackQuantity?: boolean;
  trackSerialNumbers?: boolean;
  minimumStock?: number;
  reorderLevel?: number;
  notes?: string;
};

export type UpdateInventoryItemPayload = Partial<
  Omit<CreateInventoryItemPayload, 'organizationId'>
>;

export type CreateOpeningBalancePayload = {
  organizationId: string;
  inventoryItemId: string;
  storageLocationId: string;
  quantity: number;
  reference?: string;
  reason: string;
  notes?: string;
};

export type CreateStockAdjustmentPayload = {
  organizationId: string;
  inventoryItemId: string;
  storageLocationId: string;
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
};

export type CreateStockTransferPayload = {
  organizationId: string;
  inventoryItemId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
};

export const INVENTORY_ITEM_TYPES: InventoryItemType[] = [
  'Equipment',
  'Furniture',
  'Decor',
  'Consumable',
  'Product',
  'Service',
  'Other',
];

export const UNIT_OF_MEASURE_OPTIONS: UnitOfMeasure[] = [
  'Each',
  'Pair',
  'Set',
  'Box',
  'Pack',
  'Metre',
  'SquareMetre',
  'Kilogram',
  'Litre',
  'Hour',
  'Day',
  'Other',
];

export const INVENTORY_SORT_OPTIONS: Array<{ label: string; value: InventorySortBy }> = [
  { label: 'Name', value: 'name' },
  { label: 'SKU', value: 'sku' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Stock Level', value: 'stockLevel' },
];

export const STOCK_MOVEMENT_TYPE_OPTIONS: Array<{ label: string; value: StockMovementType }> = [
  { label: 'Opening Balance', value: 'OpeningBalance' },
  { label: 'Stock In', value: 'StockIn' },
  { label: 'Stock Out', value: 'StockOut' },
  { label: 'Adjustment Increase', value: 'AdjustmentIncrease' },
  { label: 'Adjustment Decrease', value: 'AdjustmentDecrease' },
  { label: 'Transfer In', value: 'TransferIn' },
  { label: 'Transfer Out', value: 'TransferOut' },
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Lost', value: 'Lost' },
  { label: 'Returned', value: 'Returned' },
];

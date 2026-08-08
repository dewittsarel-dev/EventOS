export type SupplierProductCategory =
  | 'Equipment'
  | 'Service'
  | 'Consumable'
  | 'Material'
  | 'Lighting'
  | 'AudioVisual'
  | 'Decor'
  | 'Catering'
  | 'Venue'
  | 'Transport'
  | 'Printing'
  | 'Other';

export type SupplierProductUnit =
  | 'Each'
  | 'Box'
  | 'Pack'
  | 'Kg'
  | 'Litre'
  | 'Meter'
  | 'Hour'
  | 'Day'
  | 'Service'
  | 'Other';

export type SupplierProductSortBy =
  | 'productName'
  | 'newest'
  | 'oldest'
  | 'costPrice'
  | 'leadTime';

export type SupplierProductRecord = {
  id: string;
  supplierId: string;
  supplierName: string;
  organizationId: string;
  organizationName: string;
  productName: string;
  sku: string | null;
  category: SupplierProductCategory;
  brand: string | null;
  description: string | null;
  unit: SupplierProductUnit;
  costPrice: number;
  sellingPrice: number | null;
  vatPercent: number | null;
  leadTimeDays: number | null;
  minimumOrderQuantity: number | null;
  preferredProduct: boolean;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierProductListResponse = {
  data: SupplierProductRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type SupplierProductPayload = {
  organizationId: string;
  productName: string;
  sku?: string;
  category: SupplierProductCategory;
  brand?: string;
  description?: string;
  unit: SupplierProductUnit;
  costPrice: number;
  sellingPrice?: number;
  vatPercent?: number;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  preferredProduct?: boolean;
  active?: boolean;
  notes?: string;
};

export type SupplierProductUpdatePayload = Partial<SupplierProductPayload>;

export const SUPPLIER_PRODUCT_CATEGORIES: SupplierProductCategory[] = [
  'Equipment',
  'Service',
  'Consumable',
  'Material',
  'Lighting',
  'AudioVisual',
  'Decor',
  'Catering',
  'Venue',
  'Transport',
  'Printing',
  'Other',
];

export const SUPPLIER_PRODUCT_UNITS: SupplierProductUnit[] = [
  'Each',
  'Box',
  'Pack',
  'Kg',
  'Litre',
  'Meter',
  'Hour',
  'Day',
  'Service',
  'Other',
];

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

export type SupplierProductAvailability = 'Available' | 'Limited' | 'Unavailable' | 'MadeToOrder';
export type SupplierProductPublicationStatus = 'Draft' | 'Review' | 'Published' | 'Withdrawn';

export type SupplierProductRecord = {
  id: string;
  supplierId: string;
  supplierName: string;
  organizationId: string;
  organizationName: string;
  productName: string;
  sku: string | null;
  category: SupplierProductCategory;
  subcategory: string | null;
  attributes: Record<string, string> | null;
  condition: string | null;
  brand: string | null;
  description: string | null;
  unit: SupplierProductUnit;
  costPrice: number;
  sellingPrice: number | null;
  vatPercent: number | null;
  leadTimeDays: number | null;
  minimumOrderQuantity: number | null;
  totalQuantity: number | null;
  availability: SupplierProductAvailability;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryRadiusKm: number | null;
  deliveryFee: number | null;
  tags: string[];
  searchTerms: string[];
  marketplaceDescription: string | null;
  imageUrls: string[];
  publicationStatus: SupplierProductPublicationStatus;
  marketplaceResourceId: string | null;
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
  subcategory?: string;
  attributes?: Record<string, string>;
  condition?: string;
  brand?: string;
  description?: string;
  unit: SupplierProductUnit;
  costPrice: number;
  sellingPrice?: number;
  vatPercent?: number;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  totalQuantity?: number;
  availability?: SupplierProductAvailability;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  tags?: string[];
  searchTerms?: string[];
  marketplaceDescription?: string;
  imageUrls?: string[];
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

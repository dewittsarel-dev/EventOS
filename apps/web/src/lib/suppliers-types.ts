export type SupplierCategory =
  | 'Venue'
  | 'Catering'
  | 'Decor'
  | 'Photography'
  | 'Videography'
  | 'Entertainment'
  | 'DJ'
  | 'Florist'
  | 'AudioVisual'
  | 'EquipmentRental'
  | 'Security'
  | 'Transport'
  | 'Staffing'
  | 'Accommodation'
  | 'Printing'
  | 'Other';

export type SupplierSortBy = 'companyName' | 'newest' | 'oldest' | 'rating';

export type SupplierRecord = {
  id: string;
  organizationId: string;
  organizationName: string;
  companyName: string;
  category: SupplierCategory;
  primaryContactName: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  physicalAddress: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  preferredSupplier: boolean;
  active: boolean;
  preferredPaymentTerms: string | null;
  internalRating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierListResponse = {
  data: SupplierRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type SupplierPayload = {
  organizationId: string;
  companyName: string;
  category: SupplierCategory;
  primaryContactName?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  physicalAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  vatNumber?: string;
  registrationNumber?: string;
  preferredSupplier?: boolean;
  active?: boolean;
  preferredPaymentTerms?: string;
  internalRating?: number;
  notes?: string;
};

export type SupplierUpdatePayload = Partial<SupplierPayload>;

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'Venue',
  'Catering',
  'Decor',
  'Photography',
  'Videography',
  'Entertainment',
  'DJ',
  'Florist',
  'AudioVisual',
  'EquipmentRental',
  'Security',
  'Transport',
  'Staffing',
  'Accommodation',
  'Printing',
  'Other',
];

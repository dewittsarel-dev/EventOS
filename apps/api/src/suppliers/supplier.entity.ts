import { SupplierCategory } from './dto/supplier-category.enum';

export interface Supplier {
  id: string;
  organizationId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

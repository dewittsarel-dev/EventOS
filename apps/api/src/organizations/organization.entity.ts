export interface Organization {
  id: string;
  name: string;
  slug: string;
  tradingName?: string | null;
  vatNumber?: string | null;
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  physicalAddress?: string | null;
  postalAddress?: string | null;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationSettingsRecord = {
  id: string;
  name: string;
  slug: string;
  tradingName: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateOrganizationSettingsPayload = {
  companyName: string;
  tradingName?: string;
  vatNumber?: string;
  registrationNumber?: string;
  email: string;
  phone?: string;
  website?: string;
  physicalAddress?: string;
  postalAddress?: string;
};

export type UpdateOrganizationLogoPayload = {
  logoUrl: string;
};

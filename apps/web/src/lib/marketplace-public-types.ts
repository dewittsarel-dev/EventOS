export type MarketplaceListing = {
  id: string;
  title: string | null;
  description: string | null;
  supplierName: string;
  supplierSlug: string;
  categoryName: string;
  supplierLogoUrl: string | null;
  supplierWebsite: string | null;
  tags: string[];
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  rentalPrice: number | null;
  unitOfMeasure: string;
  resourceType: string;
  availabilityStatus: 'Available' | 'Fully booked' | 'Unavailable';
};

export type MarketplaceListingPage = { items: MarketplaceListing[]; total: number; page: number; limit: number };

export type MarketplaceEnquiry = {
  id: string;
  status: 'New' | 'Acknowledged' | 'Converted' | 'Closed';
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  quantity: number | null;
  message: string;
  createdAt: string;
  listing: { id: string; name: string };
  opportunity: MarketplaceOpportunity | null;
  messages?: Array<{ id: string; authorRole: 'Customer' | 'Supplier' | 'System'; body: string; createdAt: string }>;
};

export type MarketplaceOpportunity = {
  id: string;
  status: 'New' | 'Qualifying' | 'Qualified' | 'Won' | 'Lost';
  title: string;
  eventType: string | null;
  eventDate: string | null;
  venue: string | null;
  estimatedValueCents: number | null;
  qualificationNotes: string | null;
  confirmationEvidenceType: string | null;
  confirmationReference: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceCustomer = { id: string; email: string; name: string; phone: string | null };
export type MarketplaceCustomerSession = { accessToken: string; tokenType: 'Bearer'; customer: MarketplaceCustomer };
export type MarketplaceCustomerEnquiry = {
  id: string;
  status: MarketplaceEnquiry['status'];
  eventDate: string | null;
  eventLocation: string | null;
  quantity: number | null;
  message: string;
  createdAt: string;
  resource: { id: string; name: string } | null;
  salesOpportunity: { status: MarketplaceOpportunity['status']; eventId: string | null } | null;
  messages: Array<{ id: string; authorRole: 'Customer' | 'Supplier' | 'System'; body: string; createdAt: string }>;
};
export type MarketplaceShortlistItem = { resourceId: string; createdAt: string; listing: MarketplaceListing };

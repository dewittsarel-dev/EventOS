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

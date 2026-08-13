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
  availabilityStatus:
    | 'Available'
    | 'Limited availability'
    | 'Made to order'
    | 'Fully booked'
    | 'Unavailable';
  availableQuantity: number | null;
  leadTimeDays: number | null;
  minimumOrderQuantity: number | null;
  deliveryAvailable: boolean | null;
  pickupAvailable: boolean | null;
  deliveryRadiusKm: number | null;
  deliveryFee: number | null;
  discovery?: {
    score: number;
    tier: 'Exact match' | 'Strong match' | 'Related option';
    reasons: string[];
    matchedTerms: string[];
  };
};

export type MarketplaceListingPage = { items: MarketplaceListing[]; total: number; page: number; limit: number };

export type MarketplaceEnquiry = {
  id: string;
  enquiryType: 'Product' | 'Solution';
  requestTitle: string | null;
  serviceCategories: string[];
  eventType: string | null;
  guestCount: number | null;
  budgetCents: number | null;
  desiredOutcomes: string[];
  scheduleNotes: string | null;
  accessNotes: string | null;
  attachmentUrls: string[];
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
  preliminaryQuotes: MarketplacePreliminaryQuote[];
  messages?: Array<{ id: string; authorRole: 'Customer' | 'Supplier' | 'System'; body: string; createdAt: string }>;
};

export type MarketplacePreliminaryQuoteLine = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  lineTotalCents: number;
  notes: string | null;
  sortOrder: number;
};

export type MarketplacePreliminaryQuote = {
  id: string;
  version: number;
  status: 'Draft' | 'Sent' | 'Superseded' | 'Withdrawn';
  currency: string;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  paymentTerms: string | null;
  validUntil: string | null;
  notes: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: MarketplacePreliminaryQuoteLine[];
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
  preliminaryQuotes: MarketplacePreliminaryQuote[];
};
export type MarketplaceShortlistItem = { resourceId: string; createdAt: string; listing: MarketplaceListing };

export type MarketplaceDiscoveryPath = 'AiAssistant' | 'GuidedBuilder' | 'ManualSearch';

export type MarketplaceEventConceptSelection = {
  id: string;
  conceptId: string;
  resourceId: string;
  discoveryPath: MarketplaceDiscoveryPath;
  quantity: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  listing: MarketplaceListing;
};

export type MarketplaceEventConcept = {
  id: string;
  customerId: string;
  title: string;
  status: 'Developing' | 'Archived';
  lastDiscoveryPath: MarketplaceDiscoveryPath;
  assistantBrief: string | null;
  eventType: string | null;
  eventDate: string | null;
  guestCount: number | null;
  venueStatus: string | null;
  venueName: string | null;
  city: string | null;
  area: string | null;
  travelRadiusKm: number | null;
  setting: string | null;
  theme: string | null;
  style: string | null;
  colours: string[];
  budgetCents: number | null;
  allowSubstitutions: boolean;
  requirements: string[];
  searchTerms: string[];
  createdAt: string;
  updatedAt: string;
  selections: MarketplaceEventConceptSelection[];
};

export type MarketplaceEventConceptInput = Partial<Pick<MarketplaceEventConcept,
  'title' | 'status' | 'lastDiscoveryPath' | 'assistantBrief' | 'eventType' | 'eventDate' |
  'guestCount' | 'venueStatus' | 'venueName' | 'city' | 'area' | 'travelRadiusKm' | 'setting' |
  'theme' | 'style' | 'colours' | 'budgetCents' | 'allowSubstitutions' | 'requirements' | 'searchTerms'
>>;

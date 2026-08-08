export type MarketplaceListing = {
  id: string;
  title: string | null;
  description: string | null;
  supplierName: string;
  categoryName: string;
  brand: string | null;
  style: string | null;
  theme: string | null;
  colour: string | null;
  material: string | null;
  dimensions: string | null;
  capacity: string | null;
  suitableEventTypes: string[];
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  rentalPrice: number | null;
  sellingPrice: number | null;
  unitOfMeasure: string;
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
  inventoryItem: { id: string; marketplaceTitle: string | null; publicName: string | null };
};

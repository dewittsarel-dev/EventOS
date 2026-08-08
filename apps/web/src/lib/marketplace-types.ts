export type MarketplaceFulfilmentStatus =
  | 'OWN_STOCK'
  | 'SOURCING_POSSIBLE'
  | 'PARTIAL_ONLY'
  | 'UNAVAILABLE';

export type MarketplaceSearchMode = 'MANUAL' | 'AI_ASSISTED';

export type MarketplaceCapabilityRequirement = {
  itemOrService: string;
  requiredQuantity: number;
  startDateTime: string;
  endDateTime: string;
  deliveryLocation: string;
  specifications: string[];
};

export type MarketplaceCapabilityMatch = {
  supplierId: string;
  supplierName: string;
  fulfilmentStatus: MarketplaceFulfilmentStatus;
  ownAvailableQuantity: number;
  ownCoveragePercentage: number;
  sourcedCoveragePercentage: number;
  totalPotentiallyFulfillableQuantity: number;
  usesAdditionalMarketplaceSourcing: boolean;
  marketplaceSecondarySupplierCount: number;
  fulfilmentConfidenceScore: number;
  fulfilmentConfidence: string;
  distanceKmEstimate: number | null;
  estimatedDeliveryCapability: string;
  reliabilityRating: number | null;
  reliabilityBand: string;
  indicativeUnitPrice: number | null;
  pricingCurrency: string | null;
};

export type MarketplaceCapabilitySearchResponse = {
  searchMode: MarketplaceSearchMode;
  operatorApprovalRequired: boolean;
  manualSearchAvailable: boolean;
  automationBoundaries: string[];
  suppliers: MarketplaceCapabilityMatch[];
  appliedOwnCoverageThresholdPercentage: number;
  minimumTargetResults: number;
  maximumDisplayedResults: number;
};

export type MarketplaceSupplierShortfallSummary = {
  supplierId: string;
  supplierName: string;
  fulfilmentStatus: MarketplaceFulfilmentStatus;
  requiredQuantity: number;
  ownAvailableQuantity: number;
  shortfallQuantity: number;
  marketplaceSourcingOptionsExist: boolean;
  marketplaceSecondarySupplierCount: number;
  totalPotentiallyFulfillableQuantity: number;
  allowedActions: string[];
};

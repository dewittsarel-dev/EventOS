import { ApiProperty } from '@nestjs/swagger';
import { MarketplaceFulfilmentStatus } from './marketplace-fulfilment-status.enum';
import { MarketplaceSearchMode } from './marketplace-search-mode.enum';

export class MarketplaceCapabilityMatchDto {
  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  supplierName: string;

  @ApiProperty({ enum: MarketplaceFulfilmentStatus })
  fulfilmentStatus: MarketplaceFulfilmentStatus;

  @ApiProperty({ example: 90 })
  ownAvailableQuantity: number;

  @ApiProperty({ example: 60 })
  ownCoveragePercentage: number;

  @ApiProperty({ example: 40 })
  sourcedCoveragePercentage: number;

  @ApiProperty({ example: 160 })
  totalPotentiallyFulfillableQuantity: number;

  @ApiProperty({ example: true })
  usesAdditionalMarketplaceSourcing: boolean;

  @ApiProperty({ example: 2 })
  marketplaceSecondarySupplierCount: number;

  @ApiProperty({ example: 87 })
  fulfilmentConfidenceScore: number;

  @ApiProperty({ example: 'HIGH' })
  fulfilmentConfidence: string;

  @ApiProperty({ nullable: true, example: 120 })
  distanceKmEstimate: number | null;

  @ApiProperty({
    example: 'REGIONAL_DELIVERY_POSSIBLE',
  })
  estimatedDeliveryCapability: string;

  @ApiProperty({ nullable: true, example: 4 })
  reliabilityRating: number | null;

  @ApiProperty({ example: 'ESTABLISHED' })
  reliabilityBand: string;

  @ApiProperty({ nullable: true, example: 22.5 })
  indicativeUnitPrice: number | null;

  @ApiProperty({ nullable: true, example: 'ZAR' })
  pricingCurrency: string | null;
}

export class MarketplaceCapabilitySearchResponseDto {
  @ApiProperty({ enum: MarketplaceSearchMode })
  searchMode: MarketplaceSearchMode;

  @ApiProperty({
    description:
      'AI can recommend only. Operator approval is required for commitments.',
    example: true,
  })
  operatorApprovalRequired: boolean;

  @ApiProperty({ example: true })
  manualSearchAvailable: boolean;

  @ApiProperty({ type: [String] })
  automationBoundaries: string[];

  @ApiProperty({ type: [MarketplaceCapabilityMatchDto] })
  suppliers: MarketplaceCapabilityMatchDto[];

  @ApiProperty({ example: 50 })
  appliedOwnCoverageThresholdPercentage: number;

  @ApiProperty({ example: 5 })
  minimumTargetResults: number;

  @ApiProperty({ example: 12 })
  maximumDisplayedResults: number;
}

export class MarketplaceSupplierShortfallSummaryDto {
  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  supplierName: string;

  @ApiProperty({ enum: MarketplaceFulfilmentStatus })
  fulfilmentStatus: MarketplaceFulfilmentStatus;

  @ApiProperty({ example: 150 })
  requiredQuantity: number;

  @ApiProperty({ example: 90 })
  ownAvailableQuantity: number;

  @ApiProperty({ example: 60 })
  shortfallQuantity: number;

  @ApiProperty({ example: true })
  marketplaceSourcingOptionsExist: boolean;

  @ApiProperty({ example: 2 })
  marketplaceSecondarySupplierCount: number;

  @ApiProperty({ example: 200 })
  totalPotentiallyFulfillableQuantity: number;

  @ApiProperty({ type: [String] })
  allowedActions: string[];
}

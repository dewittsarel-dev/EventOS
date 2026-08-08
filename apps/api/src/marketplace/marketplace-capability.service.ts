import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ResourceQuantityMode,
  ResourceReservationStatus,
  ResourceStatus,
  ResourceVisibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarketplaceCapabilitySearchDto,
  MarketplaceSupplierShortfallRequestDto,
} from './dto/marketplace-capability-search.dto';
import { MarketplaceFulfilmentStatus } from './dto/marketplace-fulfilment-status.enum';
import { MarketplaceSearchMode } from './dto/marketplace-search-mode.enum';

type CapabilitySupplier = {
  supplierId: string;
  supplierName: string;
  ownAvailableQuantity: number;
  ownCoveragePercentage: number;
  sourcedCoveragePercentage: number;
  totalPotentiallyFulfillableQuantity: number;
  usesAdditionalMarketplaceSourcing: boolean;
  marketplaceSecondarySupplierCount: number;
  fulfilmentConfidenceScore: number;
  fulfilmentConfidence: string;
  exactSpecificationMatch: boolean;
  estimatedTotalCost: number | null;
  fulfilmentRiskScore: number;
  distanceKmEstimate: number | null;
  estimatedDeliveryCapability: string;
  reliabilityRating: number | null;
  reliabilityBand: string;
  indicativeUnitPrice: number | null;
  pricingCurrency: string | null;
  fulfilmentStatus: MarketplaceFulfilmentStatus;
};

type CandidateResource = {
  id: string;
  supplierId: string | null;
  name: string;
  category: string;
  tags: string[];
  keywords: string[];
  searchPhrases: string[];
  quantityMode: ResourceQuantityMode;
  totalQuantity: number | null;
  status: ResourceStatus;
  damagedQuantity: number;
  maintenanceQuantity: number;
  rentalPrice: number | null;
};

const CAPACITY_CONSUMING_STATUSES: ResourceReservationStatus[] = [
  ResourceReservationStatus.PENDING,
  ResourceReservationStatus.RESERVED,
  ResourceReservationStatus.CONFIRMED,
  ResourceReservationStatus.DISPATCHED,
];

const SUPPLIER_ALLOWED_ACTIONS = [
  'Review sourcing options',
  'Request quotations from secondary suppliers',
  'Use own external sourcing',
  'Reduce quantity offered',
  'Decline RFQ',
];

const SHORTLIST_MIN_RESULTS = 5;
const SHORTLIST_MAX_RESULTS = 12;
const ADAPTIVE_OWN_COVERAGE_THRESHOLDS = [100, 75, 50, 35, 25, 15, 10] as const;

@Injectable()
export class MarketplaceCapabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCapability(userId: string, dto: MarketplaceCapabilitySearchDto) {
    const mode = dto.searchMode ?? MarketplaceSearchMode.AI_ASSISTED;
    const requirement = dto.requirement;

    const start = this.parseIsoDate(requirement.startDateTime, 'startDateTime');
    const end = this.parseIsoDate(requirement.endDateTime, 'endDateTime');
    this.assertValidWindow(start, end);

    await this.ensureUserHasAnyClientOsMembership(userId);

    const { suppliers, appliedOwnCoverageThresholdPercentage } =
      await this.computeSupplierCapability(requirement, mode, {
        start,
        end,
      });

    return {
      searchMode: mode,
      operatorApprovalRequired: true,
      manualSearchAvailable: true,
      automationBoundaries: [
        'AI may search, calculate, recommend and prepare drafts only.',
        'AI may not send RFQs, reserve inventory, accept quotations, issue orders, or create commitments.',
        'No secondary supplier identity is exposed to buyers at this stage.',
      ],
      suppliers,
      appliedOwnCoverageThresholdPercentage,
      minimumTargetResults: SHORTLIST_MIN_RESULTS,
      maximumDisplayedResults: SHORTLIST_MAX_RESULTS,
    };
  }

  async getSupplierShortfallSummary(
    userId: string,
    dto: MarketplaceSupplierShortfallRequestDto,
  ) {
    const mode = dto.searchMode ?? MarketplaceSearchMode.AI_ASSISTED;
    const requirement = dto.requirement;

    const start = this.parseIsoDate(requirement.startDateTime, 'startDateTime');
    const end = this.parseIsoDate(requirement.endDateTime, 'endDateTime');
    this.assertValidWindow(start, end);

    await this.ensureUserHasAnyClientOsMembership(userId);

    const { suppliers } = await this.computeSupplierCapability(
      requirement,
      mode,
      {
        start,
        end,
      },
    );

    const primary = suppliers.find(
      (supplier) => supplier.supplierId === dto.primarySupplierId,
    );

    if (!primary) {
      throw new NotFoundException(
        'Primary supplier is not eligible for this requirement.',
      );
    }

    const shortfall = Math.max(
      requirement.requiredQuantity - primary.ownAvailableQuantity,
      0,
    );

    return {
      supplierId: primary.supplierId,
      supplierName: primary.supplierName,
      fulfilmentStatus: primary.fulfilmentStatus,
      requiredQuantity: requirement.requiredQuantity,
      ownAvailableQuantity: primary.ownAvailableQuantity,
      shortfallQuantity: shortfall,
      marketplaceSourcingOptionsExist:
        primary.marketplaceSecondarySupplierCount > 0 &&
        primary.totalPotentiallyFulfillableQuantity >=
          requirement.requiredQuantity,
      marketplaceSecondarySupplierCount:
        primary.marketplaceSecondarySupplierCount,
      totalPotentiallyFulfillableQuantity:
        primary.totalPotentiallyFulfillableQuantity,
      allowedActions: SUPPLIER_ALLOWED_ACTIONS,
    };
  }

  private async computeSupplierCapability(
    requirement: MarketplaceCapabilitySearchDto['requirement'],
    mode: MarketplaceSearchMode,
    window: { start: Date; end: Date },
  ): Promise<{
    suppliers: CapabilitySupplier[];
    appliedOwnCoverageThresholdPercentage: number;
  }> {
    const eligibleSuppliers = await this.prisma.supplier.findMany({
      where: {
        active: true,
        organization: {
          memberships: {
            some: {
              isDisabled: false,
            },
          },
        },
      },
      select: {
        id: true,
        companyName: true,
        city: true,
        province: true,
        internalRating: true,
        createdAt: true,
      },
    });

    if (eligibleSuppliers.length === 0) {
      return {
        suppliers: [],
        appliedOwnCoverageThresholdPercentage:
          ADAPTIVE_OWN_COVERAGE_THRESHOLDS[
            ADAPTIVE_OWN_COVERAGE_THRESHOLDS.length - 1
          ],
      };
    }

    const supplierIds = eligibleSuppliers.map((supplier) => supplier.id);
    const searchTokens = this.buildSearchTokens(requirement, mode);

    const resources = await this.prisma.resource.findMany({
      where: {
        supplierId: { in: supplierIds },
        visibility: ResourceVisibility.MARKETPLACE,
        archivedAt: null,
        status: {
          not: ResourceStatus.RETIRED,
        },
        OR: [
          {
            name: {
              contains: requirement.itemOrService,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: requirement.itemOrService,
              mode: 'insensitive',
            },
          },
          {
            category: {
              contains: requirement.itemOrService,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              hasSome: searchTokens,
            },
          },
          {
            keywords: {
              hasSome: searchTokens,
            },
          },
          {
            searchPhrases: {
              hasSome: searchTokens,
            },
          },
        ],
      },
      select: {
        id: true,
        supplierId: true,
        name: true,
        category: true,
        tags: true,
        keywords: true,
        searchPhrases: true,
        quantityMode: true,
        totalQuantity: true,
        status: true,
        damagedQuantity: true,
        maintenanceQuantity: true,
        rentalPrice: true,
      },
    });

    const resourceIds = resources.map((resource) => resource.id);

    const reservations = resourceIds.length
      ? await this.prisma.resourceReservation.findMany({
          where: {
            resourceId: {
              in: resourceIds,
            },
            status: {
              in: CAPACITY_CONSUMING_STATUSES,
            },
            startDateTime: {
              lt: window.end,
            },
            endDateTime: {
              gt: window.start,
            },
          },
          select: {
            resourceId: true,
            quantity: true,
          },
        })
      : [];

    const reservedByResourceId = new Map<string, number>();
    for (const reservation of reservations) {
      reservedByResourceId.set(
        reservation.resourceId,
        (reservedByResourceId.get(reservation.resourceId) ?? 0) +
          reservation.quantity,
      );
    }

    const ownAvailabilityBySupplier = new Map<string, number>();
    const minPriceBySupplier = new Map<string, number>();
    const exactSpecificationMatchBySupplier = new Map<string, boolean>();

    for (const resource of resources) {
      if (!resource.supplierId) {
        continue;
      }

      const available = this.computeResourceAvailability(
        resource,
        reservedByResourceId.get(resource.id) ?? 0,
        requirement.requiredQuantity,
      );

      ownAvailabilityBySupplier.set(
        resource.supplierId,
        (ownAvailabilityBySupplier.get(resource.supplierId) ?? 0) + available,
      );

      if (resource.rentalPrice !== null && resource.rentalPrice > 0) {
        const current = minPriceBySupplier.get(resource.supplierId);
        if (current === undefined || resource.rentalPrice < current) {
          minPriceBySupplier.set(resource.supplierId, resource.rentalPrice);
        }
      }

      const existingMatch =
        exactSpecificationMatchBySupplier.get(resource.supplierId) ?? false;
      exactSpecificationMatchBySupplier.set(
        resource.supplierId,
        existingMatch ||
          this.hasExactSpecificationMatch(
            requirement,
            resource.name,
            resource.category,
            resource.tags,
            resource.keywords,
            resource.searchPhrases,
          ),
      );
    }

    const totalMarketplaceAvailability = Array.from(
      ownAvailabilityBySupplier.values(),
    ).reduce((sum, value) => sum + value, 0);

    const ranked = eligibleSuppliers.map((supplier) => {
      const ownAvailableQuantity = this.roundQuantity(
        ownAvailabilityBySupplier.get(supplier.id) ?? 0,
      );
      const otherAvailability = Math.max(
        totalMarketplaceAvailability - ownAvailableQuantity,
        0,
      );
      const totalPotentiallyFulfillableQuantity = this.roundQuantity(
        ownAvailableQuantity + otherAvailability,
      );

      const ownCoveragePercentage = this.computePercentage(
        ownAvailableQuantity,
        requirement.requiredQuantity,
      );

      const sourcedCoveragePercentage = this.computePercentage(
        Math.max(
          Math.min(
            totalPotentiallyFulfillableQuantity,
            requirement.requiredQuantity,
          ) - ownAvailableQuantity,
          0,
        ),
        requirement.requiredQuantity,
      );

      const fulfilmentStatus = this.classifySupplier(
        ownAvailableQuantity,
        totalPotentiallyFulfillableQuantity,
        requirement.requiredQuantity,
      );

      const needsAdditionalSourcing =
        fulfilmentStatus === MarketplaceFulfilmentStatus.SOURCING_POSSIBLE;

      const secondarySupplierCount =
        needsAdditionalSourcing ||
        fulfilmentStatus === MarketplaceFulfilmentStatus.PARTIAL_ONLY
          ? this.countSecondarySuppliers(
              ownAvailabilityBySupplier,
              supplier.id,
              requirement.requiredQuantity,
              ownAvailableQuantity,
            )
          : 0;

      const distanceKmEstimate = this.estimateDistanceKm(
        requirement.deliveryLocation,
        supplier.city,
        supplier.province,
      );

      const estimatedTotalCost = this.estimateTotalCost(
        minPriceBySupplier.get(supplier.id) ?? null,
        requirement.requiredQuantity,
      );

      const exactSpecificationMatch =
        exactSpecificationMatchBySupplier.get(supplier.id) ?? false;

      const fulfilmentRiskScore = this.computeFulfilmentRiskScore({
        fulfilmentStatus,
        ownCoveragePercentage,
        secondarySupplierCount,
        exactSpecificationMatch,
        distanceKmEstimate,
      });

      const fulfilmentConfidenceScore = this.computeFulfilmentConfidenceScore({
        fulfilmentStatus,
        ownCoveragePercentage,
        sourcedCoveragePercentage,
        secondarySupplierCount,
        exactSpecificationMatch,
        reliabilityRating: supplier.internalRating,
        distanceKmEstimate,
        estimatedTotalCost,
      });

      return {
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        fulfilmentStatus,
        ownAvailableQuantity,
        ownCoveragePercentage,
        sourcedCoveragePercentage,
        totalPotentiallyFulfillableQuantity,
        usesAdditionalMarketplaceSourcing: needsAdditionalSourcing,
        marketplaceSecondarySupplierCount: secondarySupplierCount,
        fulfilmentConfidenceScore,
        fulfilmentConfidence:
          fulfilmentConfidenceScore >= 80
            ? 'HIGH'
            : fulfilmentConfidenceScore >= 60
              ? 'MEDIUM'
              : 'LOW',
        exactSpecificationMatch,
        estimatedTotalCost,
        fulfilmentRiskScore,
        distanceKmEstimate,
        estimatedDeliveryCapability: this.estimateDeliveryCapability(
          ownAvailableQuantity,
          requirement.requiredQuantity,
          distanceKmEstimate,
        ),
        reliabilityRating: supplier.internalRating,
        reliabilityBand: this.toReliabilityBand(
          supplier.internalRating,
          supplier.createdAt,
        ),
        indicativeUnitPrice: minPriceBySupplier.get(supplier.id) ?? null,
        pricingCurrency:
          minPriceBySupplier.get(supplier.id) === undefined ? null : 'ZAR',
      };
    });

    const sorted = ranked.sort((left, right) =>
      this.compareSuppliers(left, right),
    );
    const { suppliers: shortlisted, appliedOwnCoverageThresholdPercentage } =
      this.applyAdaptiveThresholdShortlist(
        sorted,
        requirement.requiredQuantity,
      );

    return {
      suppliers: shortlisted,
      appliedOwnCoverageThresholdPercentage,
    };
  }

  private classifySupplier(
    ownAvailableQuantity: number,
    totalPotentiallyFulfillableQuantity: number,
    requiredQuantity: number,
  ) {
    if (ownAvailableQuantity >= requiredQuantity) {
      return MarketplaceFulfilmentStatus.OWN_STOCK;
    }

    if (totalPotentiallyFulfillableQuantity >= requiredQuantity) {
      return MarketplaceFulfilmentStatus.SOURCING_POSSIBLE;
    }

    if (totalPotentiallyFulfillableQuantity > 0) {
      return MarketplaceFulfilmentStatus.PARTIAL_ONLY;
    }

    return MarketplaceFulfilmentStatus.UNAVAILABLE;
  }

  private statusRank(status: MarketplaceFulfilmentStatus) {
    if (status === MarketplaceFulfilmentStatus.OWN_STOCK) {
      return 0;
    }

    if (status === MarketplaceFulfilmentStatus.SOURCING_POSSIBLE) {
      return 1;
    }

    if (status === MarketplaceFulfilmentStatus.PARTIAL_ONLY) {
      return 2;
    }

    return 3;
  }

  private computeResourceAvailability(
    resource: CandidateResource,
    reservedQuantity: number,
    requiredQuantity: number,
  ) {
    if (
      resource.status === ResourceStatus.DAMAGED ||
      resource.status === ResourceStatus.MAINTENANCE
    ) {
      return 0;
    }

    if (resource.quantityMode === ResourceQuantityMode.UNLIMITED) {
      return requiredQuantity;
    }

    const totalQuantity = Math.max(resource.totalQuantity ?? 0, 0);
    const degraded =
      Math.max(resource.damagedQuantity, 0) +
      Math.max(resource.maintenanceQuantity, 0);
    const baseline = Math.max(totalQuantity - degraded, 0);
    return Math.max(baseline - reservedQuantity, 0);
  }

  private countSecondarySuppliers(
    ownAvailabilityBySupplier: Map<string, number>,
    supplierId: string,
    requiredQuantity: number,
    ownAvailableQuantity: number,
  ) {
    let remaining = Math.max(requiredQuantity - ownAvailableQuantity, 0);

    if (remaining <= 0) {
      return 0;
    }

    let count = 0;

    const entries = Array.from(ownAvailabilityBySupplier.entries())
      .filter(([id, available]) => id !== supplierId && available > 0)
      .sort((a, b) => b[1] - a[1]);

    for (const [, available] of entries) {
      remaining -= available;
      count += 1;
      if (remaining <= 0) {
        return count;
      }
    }

    return count;
  }

  private applyAdaptiveThresholdShortlist(
    ranked: CapabilitySupplier[],
    requiredQuantity: number,
  ) {
    const candidates = ranked.filter(
      (supplier) =>
        supplier.fulfilmentStatus !== MarketplaceFulfilmentStatus.UNAVAILABLE,
    );

    let appliedThreshold =
      ADAPTIVE_OWN_COVERAGE_THRESHOLDS[
        ADAPTIVE_OWN_COVERAGE_THRESHOLDS.length - 1
      ];
    let selected = candidates;

    for (const threshold of ADAPTIVE_OWN_COVERAGE_THRESHOLDS) {
      const filtered = candidates.filter((supplier) =>
        this.isEligibleAtThreshold(supplier, threshold, requiredQuantity),
      );

      if (filtered.length === 0) {
        continue;
      }

      selected = filtered;
      appliedThreshold = threshold;

      if (filtered.length >= SHORTLIST_MIN_RESULTS) {
        break;
      }
    }

    return {
      suppliers: selected.slice(0, SHORTLIST_MAX_RESULTS),
      appliedOwnCoverageThresholdPercentage: appliedThreshold,
    };
  }

  private isEligibleAtThreshold(
    supplier: CapabilitySupplier,
    threshold: number,
    requiredQuantity: number,
  ) {
    if (supplier.ownCoveragePercentage < threshold) {
      return false;
    }

    if (threshold >= 75 && supplier.ownCoveragePercentage < 100) {
      return (
        supplier.fulfilmentStatus ===
          MarketplaceFulfilmentStatus.SOURCING_POSSIBLE &&
        supplier.totalPotentiallyFulfillableQuantity >= requiredQuantity &&
        supplier.marketplaceSecondarySupplierCount > 0
      );
    }

    return true;
  }

  private hasExactSpecificationMatch(
    requirement: MarketplaceCapabilitySearchDto['requirement'],
    resourceName: string,
    resourceCategory: string,
    tags: string[],
    keywords: string[],
    searchPhrases: string[],
  ) {
    const normalizedText = [
      resourceName,
      resourceCategory,
      ...tags,
      ...keywords,
      ...searchPhrases,
    ]
      .join(' ')
      .toLowerCase();

    const specificationTokens = [
      ...this.tokenize(requirement.itemOrService),
      ...(requirement.specifications ?? []).flatMap((spec) =>
        this.tokenize(spec),
      ),
    ];

    return specificationTokens.every((token) => normalizedText.includes(token));
  }

  private compareSuppliers(
    left: CapabilitySupplier,
    right: CapabilitySupplier,
  ) {
    const statusRankDiff =
      this.statusRank(left.fulfilmentStatus) -
      this.statusRank(right.fulfilmentStatus);
    if (statusRankDiff !== 0) {
      return statusRankDiff;
    }

    if (left.ownCoveragePercentage !== right.ownCoveragePercentage) {
      return right.ownCoveragePercentage - left.ownCoveragePercentage;
    }

    if (
      left.marketplaceSecondarySupplierCount !==
      right.marketplaceSecondarySupplierCount
    ) {
      return (
        left.marketplaceSecondarySupplierCount -
        right.marketplaceSecondarySupplierCount
      );
    }

    if (left.exactSpecificationMatch !== right.exactSpecificationMatch) {
      return left.exactSpecificationMatch ? -1 : 1;
    }

    if (left.fulfilmentConfidenceScore !== right.fulfilmentConfidenceScore) {
      return right.fulfilmentConfidenceScore - left.fulfilmentConfidenceScore;
    }

    const leftReliability = left.reliabilityRating ?? 0;
    const rightReliability = right.reliabilityRating ?? 0;
    if (leftReliability !== rightReliability) {
      return rightReliability - leftReliability;
    }

    const leftCost = left.estimatedTotalCost ?? Number.MAX_SAFE_INTEGER;
    const rightCost = right.estimatedTotalCost ?? Number.MAX_SAFE_INTEGER;
    if (leftCost !== rightCost) {
      return leftCost - rightCost;
    }

    if (left.fulfilmentRiskScore !== right.fulfilmentRiskScore) {
      return left.fulfilmentRiskScore - right.fulfilmentRiskScore;
    }

    return left.supplierName.localeCompare(right.supplierName);
  }

  private computePercentage(value: number, total: number) {
    if (total <= 0) {
      return 0;
    }

    return this.roundQuantity((value / total) * 100);
  }

  private estimateTotalCost(
    indicativeUnitPrice: number | null,
    requiredQuantity: number,
  ) {
    if (indicativeUnitPrice === null) {
      return null;
    }

    return this.roundQuantity(indicativeUnitPrice * requiredQuantity);
  }

  private computeFulfilmentRiskScore(input: {
    fulfilmentStatus: MarketplaceFulfilmentStatus;
    ownCoveragePercentage: number;
    secondarySupplierCount: number;
    exactSpecificationMatch: boolean;
    distanceKmEstimate: number | null;
  }) {
    let risk = 0;

    if (input.fulfilmentStatus === MarketplaceFulfilmentStatus.PARTIAL_ONLY) {
      risk += 40;
    }

    if (
      input.fulfilmentStatus === MarketplaceFulfilmentStatus.SOURCING_POSSIBLE
    ) {
      risk += 18;
    }

    risk += Math.max(0, 100 - input.ownCoveragePercentage) * 0.2;
    risk += input.secondarySupplierCount * 8;

    if (!input.exactSpecificationMatch) {
      risk += 12;
    }

    if (input.distanceKmEstimate === null) {
      risk += 8;
    } else if (input.distanceKmEstimate > 150) {
      risk += 10;
    } else if (input.distanceKmEstimate > 30) {
      risk += 4;
    }

    return this.roundQuantity(Math.min(Math.max(risk, 0), 100));
  }

  private computeFulfilmentConfidenceScore(input: {
    fulfilmentStatus: MarketplaceFulfilmentStatus;
    ownCoveragePercentage: number;
    sourcedCoveragePercentage: number;
    secondarySupplierCount: number;
    exactSpecificationMatch: boolean;
    reliabilityRating: number | null;
    distanceKmEstimate: number | null;
    estimatedTotalCost: number | null;
  }) {
    let score = 0;

    if (input.fulfilmentStatus === MarketplaceFulfilmentStatus.OWN_STOCK) {
      score += 35;
    } else if (
      input.fulfilmentStatus === MarketplaceFulfilmentStatus.SOURCING_POSSIBLE
    ) {
      score += 20;
    } else if (
      input.fulfilmentStatus === MarketplaceFulfilmentStatus.PARTIAL_ONLY
    ) {
      score += 8;
    }

    score += Math.min(input.ownCoveragePercentage, 120) * 0.35;
    score -= input.sourcedCoveragePercentage * 0.1;
    score -= input.secondarySupplierCount * 6;

    if (input.exactSpecificationMatch) {
      score += 10;
    }

    if (input.distanceKmEstimate !== null) {
      if (input.distanceKmEstimate <= 30) {
        score += 8;
      } else if (input.distanceKmEstimate <= 150) {
        score += 4;
      }
    }

    if (input.reliabilityRating !== null) {
      score += input.reliabilityRating * 3;
    }

    if (input.estimatedTotalCost === null) {
      score -= 4;
    }

    return this.roundQuantity(Math.min(Math.max(score, 0), 100));
  }

  private buildSearchTokens(
    requirement: MarketplaceCapabilitySearchDto['requirement'],
    mode: MarketplaceSearchMode,
  ) {
    const baseTokens = [
      ...this.tokenize(requirement.itemOrService),
      ...(requirement.specifications ?? []).flatMap((entry) =>
        this.tokenize(entry),
      ),
    ];

    if (mode === MarketplaceSearchMode.MANUAL) {
      return baseTokens;
    }

    const aiExpanded = new Set(baseTokens);
    for (const token of baseTokens) {
      if (token.endsWith('s')) {
        aiExpanded.add(token.slice(0, -1));
      }

      if (token.includes('-')) {
        for (const part of token.split('-')) {
          if (part.length > 1) {
            aiExpanded.add(part);
          }
        }
      }
    }

    return Array.from(aiExpanded);
  }

  private tokenize(value: string) {
    return value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 1);
  }

  private estimateDistanceKm(
    deliveryLocation: string,
    supplierCity: string | null,
    supplierProvince: string | null,
  ) {
    const normalizedDelivery = deliveryLocation.toLowerCase();
    const normalizedCity = supplierCity?.toLowerCase() ?? '';
    const normalizedProvince = supplierProvince?.toLowerCase() ?? '';

    if (normalizedCity && normalizedDelivery.includes(normalizedCity)) {
      return 25;
    }

    if (normalizedProvince && normalizedDelivery.includes(normalizedProvince)) {
      return 120;
    }

    return null;
  }

  private estimateDeliveryCapability(
    ownAvailableQuantity: number,
    requiredQuantity: number,
    distanceKmEstimate: number | null,
  ) {
    if (
      ownAvailableQuantity >= requiredQuantity &&
      distanceKmEstimate !== null
    ) {
      if (distanceKmEstimate <= 30) {
        return 'LOCAL_DELIVERY_STRONG';
      }

      if (distanceKmEstimate <= 150) {
        return 'REGIONAL_DELIVERY_POSSIBLE';
      }

      return 'LONG_DISTANCE_DELIVERY_UNCERTAIN';
    }

    if (ownAvailableQuantity > 0) {
      return 'PARTIAL_DELIVERY_ONLY';
    }

    return 'DELIVERY_CAPABILITY_UNCONFIRMED';
  }

  private toReliabilityBand(rating: number | null, createdAt: Date) {
    const years = Math.max(
      0,
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365),
    );

    if (rating !== null && rating >= 4) {
      return years >= 1 ? 'ESTABLISHED' : 'PROMISING';
    }

    if (rating !== null && rating >= 3) {
      return 'STABLE';
    }

    return years >= 2 ? 'TENURED_UNRATED' : 'LIMITED_HISTORY';
  }

  private roundQuantity(value: number) {
    return Math.round(value * 100) / 100;
  }

  private parseIsoDate(value: string, fieldName: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }

    return date;
  }

  private assertValidWindow(start: Date, end: Date) {
    if (end <= start) {
      throw new BadRequestException('endDateTime must be after startDateTime');
    }
  }

  private async ensureUserHasAnyClientOsMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        isDisabled: false,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only ClientOS businesses may access marketplace supplier capability matching.',
      );
    }
  }
}

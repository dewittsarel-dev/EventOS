import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MoodBoardStatus,
  Prisma,
  ProcurementPackageStatus,
  ProcurementSolutionStrategy,
  RequirementSetStatus,
} from '@prisma/client';
import { MarketplaceCapabilityService } from '../marketplace/marketplace-capability.service';
import { MarketplaceSearchMode } from '../marketplace/dto/marketplace-search-mode.enum';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProcurementPackageDto,
  ProcurementPolicyDto,
} from './dto/procurement.dto';

type CapabilityMatch = Awaited<
  ReturnType<MarketplaceCapabilityService['searchCapability']>
>['suppliers'][number];

type RequirementForAnalysis = {
  id: string;
  name: string;
  quantityRequired: number;
  specification: Prisma.JsonValue | null;
  deliveryDate: Date | null;
  collectionDate: Date | null;
  venue: string | null;
};

type SolutionCandidate = {
  strategy: ProcurementSolutionStrategy;
  allocations: Array<{
    requirement: RequirementForAnalysis;
    supplier: CapabilityMatch;
  }>;
  signature: string;
  estimatedTotalCost: number | null;
  confidenceScore: number;
  riskScore: number;
  supplierCount: number;
  currency: string | null;
};

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplace: MarketplaceCapabilityService,
  ) {}

  async createPackage(
    userId: string,
    eventId: string,
    dto: CreateProcurementPackageDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const requirementSet = await this.prisma.requirementSet.findUnique({
      where: { id: dto.requirementSetId },
      include: { items: { select: { id: true } } },
    });
    if (!requirementSet || requirementSet.eventId !== eventId) {
      throw new BadRequestException('Requirement Set does not belong to event');
    }
    if (requirementSet.status !== RequirementSetStatus.Approved) {
      throw new ConflictException(
        'Procurement requires an approved Requirement Set',
      );
    }
    const approvedBoard = await this.prisma.moodBoard.findFirst({
      where: {
        eventId,
        requirementSetId: requirementSet.id,
        status: MoodBoardStatus.Approved,
      },
      select: { id: true },
    });
    if (!approvedBoard) {
      throw new ConflictException(
        'Procurement requires an approved Mood Board',
      );
    }
    const validItemIds = new Set(requirementSet.items.map((item) => item.id));
    const uniqueItemIds = [...new Set(dto.requirementItemIds)];
    if (uniqueItemIds.some((id) => !validItemIds.has(id))) {
      throw new BadRequestException(
        'Package items must belong to Requirement Set',
      );
    }
    const policy = this.normalizePolicy(dto.policy);
    return this.prisma.procurementPackage.create({
      data: {
        organizationId: event.organizationId,
        eventId,
        requirementSetId: requirementSet.id,
        name: dto.name,
        category: dto.category,
        policy,
        createdByUserId: userId,
        items: {
          create: uniqueItemIds.map((requirementItemId) => ({
            requirementItemId,
          })),
        },
      },
      include: this.fullPackageInclude,
    });
  }

  async listPackages(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.procurementPackage.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: this.fullPackageInclude,
    });
  }

  async analyse(userId: string, eventId: string, packageId: string) {
    await this.requireEventAccess(userId, eventId);
    const procurementPackage = await this.prisma.procurementPackage.findUnique({
      where: { id: packageId },
      include: {
        event: true,
        items: { include: { requirementItem: true } },
      },
    });
    if (!procurementPackage || procurementPackage.eventId !== eventId) {
      throw new NotFoundException('Procurement Package not found');
    }
    if (
      procurementPackage.status === ProcurementPackageStatus.QuotationRequested
    ) {
      throw new ConflictException(
        'Quotation handoff has already been requested',
      );
    }
    const policy = procurementPackage.policy as ProcurementPolicyDto;
    const requirements = procurementPackage.items.map(
      (row) => row.requirementItem,
    );
    const matches = new Map<string, CapabilityMatch[]>();
    for (const requirement of requirements) {
      const start =
        requirement.deliveryDate ?? procurementPackage.event.startDateTime;
      const end =
        requirement.collectionDate ?? procurementPackage.event.endDateTime;
      const response = await this.marketplace.searchCapability(userId, {
        searchMode: MarketplaceSearchMode.AI_ASSISTED,
        requirement: {
          itemOrService: requirement.name,
          requiredQuantity: requirement.quantityRequired,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          deliveryLocation:
            requirement.venue ??
            procurementPackage.event.location ??
            procurementPackage.event.venue ??
            'Location not specified',
          specifications: this.specificationStrings(requirement.specification),
        },
      });
      matches.set(
        requirement.id,
        response.suppliers.filter(
          (supplier) =>
            supplier.totalPotentiallyFulfillableQuantity >=
              requirement.quantityRequired &&
            (policy.minimumReliabilityPercent ?? 0) <=
              (supplier.reliabilityRating ?? 0) * 20,
        ),
      );
    }
    const candidates = this.buildCandidates(requirements, matches, policy);
    const ranked = this.rankCandidates(candidates, policy).slice(0, 12);
    const reasonFewerThanFive =
      ranked.length < 5
        ? `Only ${ranked.length} credible supplier combinations satisfy the required dates, quantities, specifications and buyer policy.`
        : null;

    return this.prisma.$transaction(async (tx) => {
      const analysis = await tx.procurementAnalysis.create({
        data: {
          procurementPackageId: packageId,
          policySnapshot: procurementPackage.policy as Prisma.InputJsonValue,
          credibleSolutionCount: ranked.length,
          reasonFewerThanFive,
        },
      });
      for (let index = 0; index < ranked.length; index += 1) {
        const candidate = ranked[index];
        const solution = await tx.procurementSolution.create({
          data: {
            procurementPackageId: packageId,
            procurementAnalysisId: analysis.id,
            rank: index + 1,
            strategy: candidate.strategy,
            label: `Solution ${index + 1}`,
            estimatedTotalCost: candidate.estimatedTotalCost,
            currency: candidate.currency,
            confidenceScore: candidate.confidenceScore,
            riskScore: candidate.riskScore,
            supplierCount: candidate.supplierCount,
            explanation: this.explain(candidate, policy),
            tradeOffs: this.tradeOffs(candidate),
          },
        });
        for (const allocation of candidate.allocations) {
          await tx.procurementSolutionAllocation.create({
            data: {
              procurementSolutionId: solution.id,
              requirementItemId: allocation.requirement.id,
              supplierId: allocation.supplier.supplierId,
              supplierName: allocation.supplier.supplierName,
              quantity: allocation.requirement.quantityRequired,
              estimatedCost: allocation.supplier.estimatedTotalCost,
              confidenceScore: allocation.supplier.fulfilmentConfidenceScore,
              riskScore: allocation.supplier.fulfilmentRiskScore,
              deliveryCapability:
                allocation.supplier.estimatedDeliveryCapability,
            },
          });
        }
      }
      await tx.procurementPackage.update({
        where: { id: packageId },
        data: { status: ProcurementPackageStatus.Analysed },
      });
      return tx.procurementAnalysis.findUniqueOrThrow({
        where: { id: analysis.id },
        include: {
          solutions: {
            orderBy: { rank: 'asc' },
            include: { allocations: true },
          },
        },
      });
    });
  }

  async selectSolution(
    userId: string,
    eventId: string,
    packageId: string,
    solutionId: string,
  ) {
    await this.requireEventAccess(userId, eventId);
    const solution = await this.prisma.procurementSolution.findUnique({
      where: { id: solutionId },
      include: { procurementPackage: true },
    });
    if (
      !solution ||
      solution.procurementPackageId !== packageId ||
      solution.procurementPackage.eventId !== eventId
    ) {
      throw new NotFoundException('Procurement Solution not found');
    }
    if (
      solution.procurementPackage.status ===
      ProcurementPackageStatus.QuotationRequested
    ) {
      throw new ConflictException(
        'Quotation handoff has already been requested',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.procurementSolution.updateMany({
        where: { procurementPackageId: packageId, selectedAt: { not: null } },
        data: { selectedAt: null, selectedByUserId: null },
      });
      await tx.procurementSolution.update({
        where: { id: solutionId },
        data: { selectedAt: new Date(), selectedByUserId: userId },
      });
      return tx.procurementPackage.update({
        where: { id: packageId },
        data: { status: ProcurementPackageStatus.SolutionSelected },
        include: this.fullPackageInclude,
      });
    });
  }

  async requestQuotations(userId: string, eventId: string, packageId: string) {
    await this.requireEventAccess(userId, eventId);
    const procurementPackage = await this.prisma.procurementPackage.findUnique({
      where: { id: packageId },
      include: {
        solutions: {
          where: { selectedAt: { not: null } },
          include: { allocations: true },
        },
      },
    });
    if (!procurementPackage || procurementPackage.eventId !== eventId) {
      throw new NotFoundException('Procurement Package not found');
    }
    if (
      procurementPackage.status !== ProcurementPackageStatus.SolutionSelected ||
      procurementPackage.solutions.length !== 1
    ) {
      throw new ConflictException('Select one Procurement Solution first');
    }
    const updated = await this.prisma.procurementPackage.update({
      where: { id: packageId },
      data: {
        status: ProcurementPackageStatus.QuotationRequested,
        quotationRequestedAt: new Date(),
      },
    });
    return {
      package: updated,
      selectedSolution: procurementPackage.solutions[0],
      handoff: 'M008_COMMERCIAL_WORKSPACE',
      rfqsPrepared: false,
      rfqsSent: false,
      operatorApprovalStillRequired: true,
    };
  }

  private buildCandidates(
    requirements: RequirementForAnalysis[],
    matches: Map<string, CapabilityMatch[]>,
    policy: ProcurementPolicyDto,
  ) {
    if (
      requirements.some(
        (requirement) => (matches.get(requirement.id)?.length ?? 0) === 0,
      )
    )
      return [];
    const candidates: SolutionCandidate[] = [];
    const strategies = Object.values(ProcurementSolutionStrategy);
    for (const strategy of strategies) {
      const candidate = this.makeCandidate(requirements, matches, strategy);
      if (candidate) candidates.push(candidate);
    }
    const supplierIds = new Set(
      [...matches.values()].flatMap((rows) =>
        rows.map((row) => row.supplierId),
      ),
    );
    for (const supplierId of supplierIds) {
      const candidate = this.makeCandidate(
        requirements,
        matches,
        ProcurementSolutionStrategy.Balanced,
        supplierId,
      );
      if (candidate) candidates.push(candidate);
    }
    const deduplicated = new Map(
      candidates.map((candidate) => [candidate.signature, candidate]),
    );
    return [...deduplicated.values()].filter(
      (candidate) =>
        candidate.supplierCount <= (policy.maximumSuppliersPerPackage ?? 12),
    );
  }

  private makeCandidate(
    requirements: RequirementForAnalysis[],
    matches: Map<string, CapabilityMatch[]>,
    strategy: ProcurementSolutionStrategy,
    preferredSupplierId?: string,
  ): SolutionCandidate | null {
    const allocations = requirements.map((requirement) => {
      const options = [...(matches.get(requirement.id) ?? [])];
      options.sort((a, b) =>
        this.compareMatches(a, b, strategy, preferredSupplierId),
      );
      return { requirement, supplier: options[0] };
    });
    if (allocations.some((row) => !row.supplier)) return null;
    const signature = allocations
      .map((row) => `${row.requirement.id}:${row.supplier.supplierId}`)
      .sort()
      .join('|');
    const costs = allocations.map((row) => row.supplier.estimatedTotalCost);
    const estimatedTotalCost = costs.every((cost) => cost !== null)
      ? costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0)
      : null;
    return {
      strategy,
      allocations,
      signature,
      estimatedTotalCost,
      confidenceScore: this.average(
        allocations.map((row) => row.supplier.fulfilmentConfidenceScore),
      ),
      riskScore: this.average(
        allocations.map((row) => row.supplier.fulfilmentRiskScore),
      ),
      supplierCount: new Set(allocations.map((row) => row.supplier.supplierId))
        .size,
      currency:
        allocations.find((row) => row.supplier.pricingCurrency)?.supplier
          .pricingCurrency ?? null,
    };
  }

  private compareMatches(
    a: CapabilityMatch,
    b: CapabilityMatch,
    strategy: ProcurementSolutionStrategy,
    preferredSupplierId?: string,
  ) {
    if (preferredSupplierId) {
      if (a.supplierId === preferredSupplierId) return -1;
      if (b.supplierId === preferredSupplierId) return 1;
    }
    if (strategy === ProcurementSolutionStrategy.LowestCost) {
      return (
        (a.estimatedTotalCost ?? Number.MAX_SAFE_INTEGER) -
        (b.estimatedTotalCost ?? Number.MAX_SAFE_INTEGER)
      );
    }
    if (strategy === ProcurementSolutionStrategy.LowestRisk)
      return a.fulfilmentRiskScore - b.fulfilmentRiskScore;
    if (strategy === ProcurementSolutionStrategy.HighestConfidence)
      return b.fulfilmentConfidenceScore - a.fulfilmentConfidenceScore;
    if (strategy === ProcurementSolutionStrategy.PreferLocal)
      return (
        (a.distanceKmEstimate ?? Number.MAX_SAFE_INTEGER) -
        (b.distanceKmEstimate ?? Number.MAX_SAFE_INTEGER)
      );
    if (strategy === ProcurementSolutionStrategy.FewestSuppliers)
      return b.ownCoveragePercentage - a.ownCoveragePercentage;
    return (
      b.fulfilmentConfidenceScore - a.fulfilmentConfidenceScore ||
      a.fulfilmentRiskScore - b.fulfilmentRiskScore
    );
  }

  private rankCandidates(
    candidates: SolutionCandidate[],
    policy: ProcurementPolicyDto,
  ) {
    return candidates.sort(
      (a, b) => this.policyScore(a, policy) - this.policyScore(b, policy),
    );
  }

  private policyScore(
    candidate: SolutionCandidate,
    policy: ProcurementPolicyDto,
  ) {
    let score = candidate.riskScore - candidate.confidenceScore;
    if (policy.minimiseCost)
      score += (candidate.estimatedTotalCost ?? 1_000_000_000) / 100_000;
    if (policy.minimiseSuppliers) score += candidate.supplierCount * 15;
    if (policy.preferLocalSuppliers || policy.environmentalPreference) {
      score +=
        this.average(
          candidate.allocations.map(
            (row) => row.supplier.distanceKmEstimate ?? 500,
          ),
        ) / 20;
    }
    return score;
  }

  private explain(candidate: SolutionCandidate, policy: ProcurementPolicyDto) {
    const reasons = [
      `${candidate.supplierCount} supplier${candidate.supplierCount === 1 ? '' : 's'}`,
      `${Math.round(candidate.confidenceScore)}% fulfilment confidence`,
      `${Math.round(candidate.riskScore)}% assessed risk`,
    ];
    if (candidate.estimatedTotalCost !== null)
      reasons.push(
        `estimated total ${candidate.currency ?? ''} ${candidate.estimatedTotalCost.toFixed(2)}`.trim(),
      );
    if (policy.minimiseSuppliers && candidate.supplierCount === 1)
      reasons.push('matches the buyer policy preference for fewer suppliers');
    if (policy.supportEmergingBusinesses)
      reasons.push(
        'emerging-business weighting was not applied because verified business-size classification is unavailable',
      );
    if (policy.preferExistingRelationships)
      reasons.push(
        'relationship weighting was not applied because verified supplier performance history is unavailable in this search result',
      );
    if (policy.balancedMarketplace)
      reasons.push(
        'Marketplace-balancing weight was not applied because historical award-distribution data is unavailable',
      );
    return `Shown because it offers ${reasons.join(', ')}.`;
  }

  private tradeOffs(candidate: SolutionCandidate): Prisma.InputJsonValue {
    return {
      coordinationEffort:
        candidate.supplierCount === 1
          ? 'Low'
          : candidate.supplierCount === 2
            ? 'Medium'
            : 'High',
      costKnown: candidate.estimatedTotalCost !== null,
      logisticsComplexity: candidate.supplierCount,
      noHiddenObjective: true,
    };
  }

  private normalizePolicy(
    policy: ProcurementPolicyDto,
  ): Prisma.InputJsonObject {
    return {
      minimiseCost: policy.minimiseCost ?? true,
      minimiseSuppliers: policy.minimiseSuppliers ?? true,
      supportEmergingBusinesses: policy.supportEmergingBusinesses ?? false,
      preferLocalSuppliers: policy.preferLocalSuppliers ?? false,
      environmentalPreference: policy.environmentalPreference ?? false,
      preferExistingRelationships: policy.preferExistingRelationships ?? false,
      balancedMarketplace: policy.balancedMarketplace ?? false,
      minimumReliabilityPercent: policy.minimumReliabilityPercent ?? 0,
      maximumSuppliersPerPackage: policy.maximumSuppliersPerPackage ?? 2,
    };
  }

  private specificationStrings(value: Prisma.JsonValue | null) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).slice(0, 20);
    if (typeof value === 'object')
      return Object.entries(value)
        .map(
          ([key, entry]) =>
            `${key}: ${typeof entry === 'object' ? JSON.stringify(entry) : String(entry)}`,
        )
        .slice(0, 20);
    return [String(value)];
  }

  private average(values: number[]) {
    return values.length === 0
      ? 0
      : Math.round(
          (values.reduce((sum, value) => sum + value, 0) / values.length) * 100,
        ) / 100;
  }

  private async requireEventAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: event.organizationId },
      },
      select: { id: true },
    });
    if (!membership)
      throw new ForbiddenException('You do not have access to this event');
    return event;
  }

  private readonly fullPackageInclude = {
    items: { include: { requirementItem: true } },
    solutions: {
      orderBy: { rank: 'asc' as const },
      include: { allocations: true },
    },
  } as const;
}

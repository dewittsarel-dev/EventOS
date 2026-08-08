import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RequirementItem,
  RequirementImpactChangeType,
  RequirementImpactDecision,
  RequirementImpactReportStatus,
  RequirementSetStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequirementItemDto } from './dto/create-requirement-set.dto';
import {
  ApplyRequirementImpactReportDto,
  CandidateRequirementItemDto,
  CreateRequirementImpactReportDto,
} from './dto/requirement-impact-report.dto';

@Injectable()
export class RequirementImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(
    userId: string,
    eventId: string,
    setId: string,
    dto: CreateRequirementImpactReportDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const baseline = await this.prisma.requirementSet.findUnique({
      where: { id: setId },
      include: { items: { orderBy: { requirementCode: 'asc' } } },
    });
    if (!baseline || baseline.eventId !== eventId) {
      throw new NotFoundException('Requirement Set not found');
    }
    if (baseline.status !== RequirementSetStatus.Approved) {
      throw new ConflictException(
        'Impact Reports require an approved baseline Requirement Set',
      );
    }

    const currentByCode = new Map(
      baseline.items.map((item) => [item.requirementCode, item]),
    );
    const suppliedCodes = dto.proposedItems
      .map((item) => item.requirementCode)
      .filter((code): code is string => Boolean(code));
    if (new Set(suppliedCodes).size !== suppliedCodes.length) {
      throw new BadRequestException(
        'Proposed requirement codes must be unique',
      );
    }
    for (const code of suppliedCodes) {
      if (!currentByCode.has(code)) {
        throw new BadRequestException(`Unknown requirement code ${code}`);
      }
    }

    let nextCode = Math.max(
      0,
      ...baseline.items.map((item) =>
        Number.parseInt(item.requirementCode.replace('R-', ''), 10),
      ),
    );
    const candidates = dto.proposedItems.map((item) => ({
      ...item,
      requirementCode:
        item.requirementCode ?? `R-${String(++nextCode).padStart(3, '0')}`,
    }));
    const candidateByCode = new Map(
      candidates.map((item) => [item.requirementCode, item]),
    );
    const changes: Array<{
      requirementCode: string;
      changeType: RequirementImpactChangeType;
      previousItem?: Prisma.InputJsonValue;
      proposedItem?: Prisma.InputJsonValue;
    }> = [];

    for (const current of baseline.items) {
      const proposed = candidateByCode.get(current.requirementCode);
      if (!proposed) {
        changes.push({
          requirementCode: current.requirementCode,
          changeType: current.plannerOverride
            ? RequirementImpactChangeType.OverrideProtected
            : RequirementImpactChangeType.Removed,
          previousItem: this.currentItemPayload(current),
        });
        continue;
      }
      const currentPayload = this.currentItemPayload(current);
      const proposedPayload = this.candidatePayload(proposed);
      if (JSON.stringify(currentPayload) !== JSON.stringify(proposedPayload)) {
        changes.push({
          requirementCode: current.requirementCode,
          changeType: current.plannerOverride
            ? RequirementImpactChangeType.OverrideProtected
            : current.quantityRequired !== proposed.quantityRequired
              ? RequirementImpactChangeType.QuantityChanged
              : RequirementImpactChangeType.Changed,
          previousItem: currentPayload,
          proposedItem: proposedPayload,
        });
      }
    }
    for (const proposed of candidates) {
      if (!currentByCode.has(proposed.requirementCode)) {
        changes.push({
          requirementCode: proposed.requirementCode,
          changeType: RequirementImpactChangeType.Added,
          proposedItem: this.candidatePayload(proposed),
        });
      }
    }

    const [quotationCount, allocationCount] = await Promise.all([
      this.prisma.quotation.count({ where: { eventId } }),
      this.prisma.eventResourceAllocation.count({ where: { eventId } }),
    ]);
    const requiresProcurementReview =
      quotationCount > 0 || allocationCount > 0 || changes.length > 0;
    const businessImpact = {
      moodBoard: changes.length > 0 ? 'NeedsReview' : 'NoChange',
      supplierQuotations: quotationCount,
      purchaseOrders: 'NotLinkedToRequirements',
      budget: changes.length > 0 ? 'ReviewRequired' : 'NoChange',
      resourceAllocations: allocationCount,
      deliverySchedule: changes.length > 0 ? 'ReviewRequired' : 'NoChange',
      staffingSchedule: changes.length > 0 ? 'ReviewRequired' : 'NoChange',
    };

    return this.prisma.requirementImpactReport.create({
      data: {
        organizationId: event.organizationId,
        eventId,
        baselineRequirementSetId: baseline.id,
        affectedItems: changes.length,
        newItems: changes.filter(
          (change) => change.changeType === RequirementImpactChangeType.Added,
        ).length,
        removedItems: changes.filter(
          (change) => change.changeType === RequirementImpactChangeType.Removed,
        ).length,
        plannerOverrides: changes.filter(
          (change) =>
            change.changeType === RequirementImpactChangeType.OverrideProtected,
        ).length,
        requiresProcurementReview,
        businessImpact,
        createdByUserId: userId,
        changes: { create: changes },
      },
      include: { changes: { orderBy: { requirementCode: 'asc' } } },
    });
  }

  async listReports(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.requirementImpactReport.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: { changes: { orderBy: { requirementCode: 'asc' } } },
    });
  }

  async applyReport(
    userId: string,
    eventId: string,
    reportId: string,
    dto: ApplyRequirementImpactReportDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const report = await this.prisma.requirementImpactReport.findUnique({
      where: { id: reportId },
      include: {
        changes: true,
        baselineRequirementSet: {
          include: { items: true, dependencies: true },
        },
      },
    });
    if (!report || report.eventId !== eventId) {
      throw new NotFoundException('Requirement Impact Report not found');
    }
    if (report.status !== RequirementImpactReportStatus.PendingReview) {
      throw new ConflictException('Impact Report has already been resolved');
    }
    const decisions = new Map(
      dto.decisions.map((row) => [row.changeId, row.decision]),
    );
    if (
      decisions.size !== report.changes.length ||
      report.changes.some((change) => !decisions.has(change.id))
    ) {
      throw new BadRequestException(
        'A planner decision is required for every proposed change',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const latest = await tx.requirementSet.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const version = (latest?.version ?? 0) + 1;
        const nextSet = await tx.requirementSet.create({
          data: {
            organizationId: event.organizationId,
            eventId,
            eventDesignVersionId:
              report.baselineRequirementSet.eventDesignVersionId,
            version,
            createdByUserId: userId,
          },
        });
        const changeByCode = new Map(
          report.changes.map((change) => [change.requirementCode, change]),
        );
        const newIds = new Map<string, string>();

        for (const item of report.baselineRequirementSet.items) {
          const change = changeByCode.get(item.requirementCode);
          const apply = change
            ? decisions.get(change.id) === RequirementImpactDecision.Apply
            : false;
          if (
            apply &&
            (change?.changeType === RequirementImpactChangeType.Removed ||
              (change?.changeType ===
                RequirementImpactChangeType.OverrideProtected &&
                !change.proposedItem))
          ) {
            continue;
          }
          const proposed =
            apply && change?.proposedItem
              ? (change.proposedItem as unknown as CreateRequirementItemDto)
              : null;
          const created = await tx.requirementItem.create({
            data: this.cloneItemData(nextSet.id, version, item, proposed),
          });
          newIds.set(item.id, created.id);
          if (change && apply) {
            await tx.requirementItemChange.create({
              data: {
                requirementSetId: nextSet.id,
                requirementItemId: created.id,
                changedByUserId: userId,
                changeType: `ImpactReport:${change.changeType}`,
                previousValue: change.previousItem ?? undefined,
                nextValue: change.proposedItem ?? undefined,
                reason: `Applied from Impact Report ${report.id}`,
              },
            });
          }
        }

        for (const change of report.changes) {
          if (
            change.changeType === RequirementImpactChangeType.Added &&
            decisions.get(change.id) === RequirementImpactDecision.Apply &&
            change.proposedItem
          ) {
            const proposed =
              change.proposedItem as unknown as CreateRequirementItemDto;
            const created = await tx.requirementItem.create({
              data: this.newItemData(
                nextSet.id,
                change.requirementCode,
                version,
                proposed,
              ),
            });
            await tx.requirementItemChange.create({
              data: {
                requirementSetId: nextSet.id,
                requirementItemId: created.id,
                changedByUserId: userId,
                changeType: 'ImpactReport:Added',
                nextValue: change.proposedItem,
                reason: `Applied from Impact Report ${report.id}`,
              },
            });
          }
        }

        for (const dependency of report.baselineRequirementSet.dependencies) {
          const sourceId = newIds.get(dependency.sourceRequirementItemId);
          const targetId = newIds.get(dependency.targetRequirementItemId);
          if (sourceId && targetId) {
            await tx.requirementDependency.create({
              data: {
                requirementSetId: nextSet.id,
                sourceRequirementItemId: sourceId,
                targetRequirementItemId: targetId,
                level: dependency.level,
                description: dependency.description,
              },
            });
          }
        }

        for (const change of report.changes) {
          await tx.requirementImpactChange.update({
            where: { id: change.id },
            data: { decision: decisions.get(change.id)! },
          });
        }
        await tx.requirementImpactReport.update({
          where: { id: report.id },
          data: {
            status: RequirementImpactReportStatus.Applied,
            resolvedByUserId: userId,
            resolvedAt: new Date(),
          },
        });
        return tx.requirementSet.findUniqueOrThrow({
          where: { id: nextSet.id },
          include: {
            items: { orderBy: { requirementCode: 'asc' } },
            dependencies: true,
            changes: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private currentItemPayload(item: RequirementItem): Prisma.InputJsonObject {
    return JSON.parse(
      JSON.stringify({
        requirementCode: item.requirementCode,
        category: item.category,
        requirementType: item.requirementType,
        name: item.name,
        description: item.description ?? undefined,
        specification: item.specification ?? undefined,
        images: item.images ?? undefined,
        quantityRequired: item.quantityRequired,
        unit: item.unit,
        quantitySource: item.quantitySource,
        fulfilmentStrategy: item.fulfilmentStrategy,
        deliveryDate: item.deliveryDate?.toISOString(),
        collectionDate: item.collectionDate?.toISOString(),
        setupDate: item.setupDate?.toISOString(),
        removalDate: item.removalDate?.toISOString(),
        requiredTime: item.requiredTime ?? undefined,
        venue: item.venue ?? undefined,
        deliveryArea: item.deliveryArea ?? undefined,
        setupArea: item.setupArea ?? undefined,
        gps: item.gps ?? undefined,
        estimatedBudgetCents: item.estimatedBudgetCents ?? undefined,
        aiConfidence: item.aiConfidence ?? undefined,
        aiRecommendation: item.aiRecommendation ?? undefined,
      }),
    ) as Prisma.InputJsonObject;
  }

  private candidatePayload(
    item: CandidateRequirementItemDto & { requirementCode: string },
  ): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(item)) as Prisma.InputJsonObject;
  }

  private newItemData(
    setId: string,
    code: string,
    version: number,
    item: CreateRequirementItemDto,
  ): Prisma.RequirementItemUncheckedCreateInput {
    return {
      requirementSetId: setId,
      requirementCode: code,
      requirementVersion: version,
      category: item.category,
      requirementType: item.requirementType,
      name: item.name,
      description: item.description,
      specification: item.specification as Prisma.InputJsonValue | undefined,
      images: item.images,
      quantityRequired: item.quantityRequired,
      unit: item.unit,
      quantitySource: item.quantitySource,
      fulfilmentStrategy: item.fulfilmentStrategy,
      deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : undefined,
      collectionDate: item.collectionDate
        ? new Date(item.collectionDate)
        : undefined,
      setupDate: item.setupDate ? new Date(item.setupDate) : undefined,
      removalDate: item.removalDate ? new Date(item.removalDate) : undefined,
      requiredTime: item.requiredTime,
      venue: item.venue,
      deliveryArea: item.deliveryArea,
      setupArea: item.setupArea,
      gps: item.gps,
      estimatedBudgetCents: item.estimatedBudgetCents,
      aiConfidence: item.aiConfidence,
      aiRecommendation: item.aiRecommendation,
    };
  }

  private cloneItemData(
    setId: string,
    version: number,
    item: RequirementItem,
    proposed: CreateRequirementItemDto | null,
  ): Prisma.RequirementItemUncheckedCreateInput {
    if (proposed) {
      const data = this.newItemData(
        setId,
        item.requirementCode,
        version,
        proposed,
      );
      if (item.plannerOverride) {
        data.plannerOverride = false;
        data.overrideReason = null;
      }
      data.supplierAllocation = item.supplierAllocation ?? undefined;
      data.estimatedBudgetCents = item.estimatedBudgetCents;
      data.quotedPriceCents = item.quotedPriceCents;
      data.approvedPriceCents = item.approvedPriceCents;
      data.actualCostCents = item.actualCostCents;
      data.alternativeSuggestions = item.alternativeSuggestions ?? undefined;
      data.similarMarketplaceItems = item.similarMarketplaceItems ?? undefined;
      data.riskWarnings = item.riskWarnings ?? undefined;
      return data;
    }
    return {
      requirementSetId: setId,
      requirementCode: item.requirementCode,
      requirementVersion: item.requirementVersion + 1,
      category: item.category,
      requirementType: item.requirementType,
      name: item.name,
      description: item.description,
      specification: item.specification ?? undefined,
      images: item.images ?? undefined,
      quantityRequired: item.quantityRequired,
      unit: item.unit,
      quantitySource: item.quantitySource,
      plannerOverride: item.plannerOverride,
      overrideReason: item.overrideReason,
      deliveryDate: item.deliveryDate,
      collectionDate: item.collectionDate,
      setupDate: item.setupDate,
      removalDate: item.removalDate,
      requiredTime: item.requiredTime,
      venue: item.venue,
      deliveryArea: item.deliveryArea,
      setupArea: item.setupArea,
      gps: item.gps,
      fulfilmentStrategy: item.fulfilmentStrategy,
      supplierAllocation: item.supplierAllocation ?? undefined,
      estimatedBudgetCents: item.estimatedBudgetCents,
      quotedPriceCents: item.quotedPriceCents,
      approvedPriceCents: item.approvedPriceCents,
      actualCostCents: item.actualCostCents,
      aiConfidence: item.aiConfidence,
      aiRecommendation: item.aiRecommendation,
      alternativeSuggestions: item.alternativeSuggestions ?? undefined,
      similarMarketplaceItems: item.similarMarketplaceItems ?? undefined,
      riskWarnings: item.riskWarnings ?? undefined,
    };
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
}

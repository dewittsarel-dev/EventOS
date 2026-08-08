import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventDesignStatus,
  Prisma,
  RequirementQuantitySource,
  RequirementSetStatus,
  RequirementStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRequirementDependencyDto,
  CreateRequirementItemDto,
  CreateRequirementSetDto,
} from './dto/create-requirement-set.dto';
import { OverrideRequirementDto } from './dto/override-requirement.dto';

@Injectable()
export class RequirementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSet(
    userId: string,
    eventId: string,
    dto: CreateRequirementSetDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const design = await this.prisma.eventDesignVersion.findUnique({
      where: { id: dto.eventDesignVersionId },
      select: { id: true, eventId: true, status: true },
    });
    if (!design || design.eventId !== eventId) {
      throw new BadRequestException(
        'Event Design version does not belong to this event',
      );
    }
    if (design.status !== EventDesignStatus.Approved) {
      throw new ConflictException(
        'Requirement Sets can only be created from an approved Event Design',
      );
    }

    const dependencies = dto.dependencies ?? [];
    this.validateDependencyGraph(dto.items.length, dependencies);

    return this.prisma.$transaction(
      async (tx) => {
        const latest = await tx.requirementSet.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const version = (latest?.version ?? 0) + 1;
        const set = await tx.requirementSet.create({
          data: {
            organizationId: event.organizationId,
            eventId,
            eventDesignVersionId: design.id,
            version,
            createdByUserId: userId,
          },
        });

        const items: Array<{ id: string }> = [];
        for (let index = 0; index < dto.items.length; index += 1) {
          const input = dto.items[index];
          items.push(
            await tx.requirementItem.create({
              data: this.newItemData(
                set.id,
                `R-${String(index + 1).padStart(3, '0')}`,
                version,
                input,
              ),
            }),
          );
        }

        for (const dependency of dependencies) {
          await tx.requirementDependency.create({
            data: {
              requirementSetId: set.id,
              sourceRequirementItemId:
                items[dependency.sourceItemNumber - 1].id,
              targetRequirementItemId:
                items[dependency.targetItemNumber - 1].id,
              level: dependency.level,
              description: dependency.description,
            },
          });
        }

        return tx.requirementSet.findUniqueOrThrow({
          where: { id: set.id },
          include: this.fullSetInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listSets(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.requirementSet.findMany({
      where: { eventId },
      orderBy: { version: 'desc' },
      include: this.fullSetInclude,
    });
  }

  async approveSet(userId: string, eventId: string, setId: string) {
    await this.requireEventAccess(userId, eventId);
    const set = await this.requireSet(eventId, setId);
    if (set.status === RequirementSetStatus.Approved) {
      throw new ConflictException('Requirement Set is already approved');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.requirementItem.updateMany({
        where: {
          requirementSetId: setId,
          status: { in: [RequirementStatus.Draft, RequirementStatus.Reviewed] },
        },
        data: { status: RequirementStatus.Approved },
      });
      return tx.requirementSet.update({
        where: { id: setId },
        data: {
          status: RequirementSetStatus.Approved,
          approvedByUserId: userId,
          approvedAt: new Date(),
        },
        include: this.fullSetInclude,
      });
    });
  }

  async overrideQuantity(
    userId: string,
    eventId: string,
    setId: string,
    dto: OverrideRequirementDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const source = await this.prisma.requirementSet.findUnique({
      where: { id: setId },
      include: this.fullSetInclude,
    });
    if (!source || source.eventId !== eventId) {
      throw new NotFoundException('Requirement Set not found');
    }
    const overriddenItem = source.items.find(
      (item) => item.requirementCode === dto.requirementCode,
    );
    if (!overriddenItem) {
      throw new NotFoundException('Requirement Item not found');
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
            eventDesignVersionId: source.eventDesignVersionId,
            version,
            createdByUserId: userId,
          },
        });

        const itemIds = new Map<string, string>();
        let nextOverriddenItemId = '';
        for (const item of source.items) {
          const isOverride = item.id === overriddenItem.id;
          const created = await tx.requirementItem.create({
            data: {
              requirementSetId: nextSet.id,
              requirementCode: item.requirementCode,
              requirementVersion: item.requirementVersion + 1,
              category: item.category,
              requirementType: item.requirementType,
              name: item.name,
              description: item.description,
              specification: this.jsonOrUndefined(item.specification),
              images: this.jsonOrUndefined(item.images),
              quantityRequired: isOverride
                ? dto.quantityRequired
                : item.quantityRequired,
              unit: item.unit,
              quantitySource: isOverride
                ? RequirementQuantitySource.PlannerOverride
                : item.quantitySource,
              plannerOverride: isOverride || item.plannerOverride,
              overrideReason: isOverride ? dto.reason : item.overrideReason,
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
              supplierAllocation: this.jsonOrUndefined(item.supplierAllocation),
              estimatedBudgetCents: item.estimatedBudgetCents,
              quotedPriceCents: item.quotedPriceCents,
              approvedPriceCents: item.approvedPriceCents,
              actualCostCents: item.actualCostCents,
              aiConfidence: item.aiConfidence,
              aiRecommendation: item.aiRecommendation,
              alternativeSuggestions: this.jsonOrUndefined(
                item.alternativeSuggestions,
              ),
              similarMarketplaceItems: this.jsonOrUndefined(
                item.similarMarketplaceItems,
              ),
              riskWarnings: this.jsonOrUndefined(item.riskWarnings),
            },
          });
          itemIds.set(item.id, created.id);
          if (isOverride) nextOverriddenItemId = created.id;
        }

        for (const dependency of source.dependencies) {
          await tx.requirementDependency.create({
            data: {
              requirementSetId: nextSet.id,
              sourceRequirementItemId: itemIds.get(
                dependency.sourceRequirementItemId,
              )!,
              targetRequirementItemId: itemIds.get(
                dependency.targetRequirementItemId,
              )!,
              level: dependency.level,
              description: dependency.description,
            },
          });
        }

        await tx.requirementItemChange.create({
          data: {
            requirementSetId: nextSet.id,
            requirementItemId: nextOverriddenItemId,
            changedByUserId: userId,
            changeType: 'QuantityOverride',
            previousValue: {
              quantityRequired: overriddenItem.quantityRequired,
            },
            nextValue: { quantityRequired: dto.quantityRequired },
            reason: dto.reason,
          },
        });

        return tx.requirementSet.findUniqueOrThrow({
          where: { id: nextSet.id },
          include: this.fullSetInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private newItemData(
    requirementSetId: string,
    requirementCode: string,
    version: number,
    item: CreateRequirementItemDto,
  ): Prisma.RequirementItemUncheckedCreateInput {
    return {
      requirementSetId,
      requirementCode,
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

  private validateDependencyGraph(
    itemCount: number,
    dependencies: CreateRequirementDependencyDto[],
  ) {
    const graph = Array.from({ length: itemCount }, () => [] as number[]);
    for (const edge of dependencies) {
      const source = edge.sourceItemNumber - 1;
      const target = edge.targetItemNumber - 1;
      if (
        source < 0 ||
        target < 0 ||
        source >= itemCount ||
        target >= itemCount
      ) {
        throw new BadRequestException('Dependency item number is out of range');
      }
      if (source === target) {
        throw new BadRequestException('A requirement cannot depend on itself');
      }
      graph[source].push(target);
    }

    const state = new Array<number>(itemCount).fill(0);
    const visit = (node: number): boolean => {
      if (state[node] === 1) return true;
      if (state[node] === 2) return false;
      state[node] = 1;
      if (graph[node].some(visit)) return true;
      state[node] = 2;
      return false;
    };
    if (graph.some((_, node) => visit(node))) {
      throw new BadRequestException('Requirement dependencies must be one-way');
    }
  }

  private async requireSet(eventId: string, setId: string) {
    const set = await this.prisma.requirementSet.findUnique({
      where: { id: setId },
      select: { id: true, eventId: true, status: true },
    });
    if (!set || set.eventId !== eventId) {
      throw new NotFoundException('Requirement Set not found');
    }
    return set;
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
    if (!membership) {
      throw new ForbiddenException('You do not have access to this event');
    }
    return event;
  }

  private jsonOrUndefined(value: Prisma.JsonValue | null) {
    return value === null ? undefined : (value as Prisma.InputJsonValue);
  }

  private readonly fullSetInclude = {
    items: { orderBy: { requirementCode: 'asc' as const } },
    dependencies: true,
    changes: { orderBy: { createdAt: 'asc' as const } },
  } as const;
}

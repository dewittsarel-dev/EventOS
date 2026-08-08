/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  EventDesignStatus,
  RequirementDependencyLevel,
  RequirementFulfilmentStrategy,
  RequirementQuantitySource,
  RequirementSetStatus,
  RequirementStatus,
  RequirementType,
} from '@prisma/client';
import { RequirementsService } from './requirements.service';

describe('RequirementsService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const designId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const setId = '55555555-5555-5555-5555-555555555555';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    eventDesignVersion: { findUnique: jest.fn() },
    requirementSet: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    requirementItem: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    requirementDependency: { create: jest.fn() },
    requirementItemChange: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  let service: RequirementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequirementsService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.eventDesignVersion.findUnique.mockResolvedValue({
      id: designId,
      eventId,
      status: EventDesignStatus.Approved,
    });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  const baseItems = [
    {
      category: 'Furniture',
      requirementType: RequirementType.Product,
      name: 'Round Tables',
      quantityRequired: 60,
      unit: 'Each',
      quantitySource: RequirementQuantitySource.AiCalculated,
    },
    {
      category: 'Linen',
      requirementType: RequirementType.Product,
      name: 'Round Linen',
      quantityRequired: 60,
      unit: 'Each',
      quantitySource: RequirementQuantitySource.AiCalculated,
    },
  ];

  it('creates a versioned set with stable requirement codes and dependencies', async () => {
    prisma.requirementSet.findFirst.mockResolvedValue({ version: 1 });
    prisma.requirementSet.create.mockResolvedValue({ id: setId, version: 2 });
    prisma.requirementItem.create
      .mockResolvedValueOnce({ id: 'item-1' })
      .mockResolvedValueOnce({ id: 'item-2' });
    prisma.requirementSet.findUniqueOrThrow.mockResolvedValue({
      id: setId,
      version: 2,
      items: [],
      dependencies: [],
    });

    const result = await service.createSet(userId, eventId, {
      eventDesignVersionId: designId,
      items: baseItems,
      dependencies: [
        {
          sourceItemNumber: 1,
          targetItemNumber: 2,
          level: RequirementDependencyLevel.Design,
        },
      ],
    });

    expect(result).toEqual(expect.objectContaining({ version: 2 }));
    expect(prisma.requirementItem.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ requirementCode: 'R-001' }),
      }),
    );
    expect(prisma.requirementItem.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ requirementCode: 'R-002' }),
      }),
    );
    expect(prisma.requirementDependency.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceRequirementItemId: 'item-1',
        targetRequirementItemId: 'item-2',
      }),
    });
  });

  it('rejects circular dependency graphs before persistence', async () => {
    await expect(
      service.createSet(userId, eventId, {
        eventDesignVersionId: designId,
        items: baseItems,
        dependencies: [
          {
            sourceItemNumber: 1,
            targetItemNumber: 2,
            level: RequirementDependencyLevel.Direct,
          },
          {
            sourceItemNumber: 2,
            targetItemNumber: 1,
            level: RequirementDependencyLevel.Calculated,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.requirementSet.create).not.toHaveBeenCalled();
  });

  it('requires an approved Event Design', async () => {
    prisma.eventDesignVersion.findUnique.mockResolvedValue({
      id: designId,
      eventId,
      status: EventDesignStatus.Draft,
    });

    await expect(
      service.createSet(userId, eventId, {
        eventDesignVersionId: designId,
        items: baseItems,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves the set and its reviewable items together', async () => {
    prisma.requirementSet.findUnique.mockResolvedValue({
      id: setId,
      eventId,
      status: RequirementSetStatus.Draft,
    });
    prisma.requirementSet.update.mockResolvedValue({
      id: setId,
      status: RequirementSetStatus.Approved,
    });

    await service.approveSet(userId, eventId, setId);

    expect(prisma.requirementItem.updateMany).toHaveBeenCalledWith({
      where: {
        requirementSetId: setId,
        status: { in: [RequirementStatus.Draft, RequirementStatus.Reviewed] },
      },
      data: { status: RequirementStatus.Approved },
    });
    expect(prisma.requirementSet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RequirementSetStatus.Approved,
          approvedByUserId: userId,
        }),
      }),
    );
  });

  it('creates a new draft version for a planner override', async () => {
    const sourceItem = {
      id: 'item-1',
      requirementCode: 'R-001',
      requirementVersion: 1,
      category: 'Furniture',
      requirementType: RequirementType.Product,
      name: 'Round Tables',
      description: null,
      specification: null,
      images: null,
      quantityRequired: 60,
      unit: 'Each',
      quantitySource: RequirementQuantitySource.AiCalculated,
      plannerOverride: false,
      overrideReason: null,
      deliveryDate: null,
      collectionDate: null,
      setupDate: null,
      removalDate: null,
      requiredTime: null,
      venue: null,
      deliveryArea: null,
      setupArea: null,
      gps: null,
      fulfilmentStrategy: RequirementFulfilmentStrategy.Undecided,
      supplierAllocation: null,
      estimatedBudgetCents: null,
      quotedPriceCents: null,
      approvedPriceCents: null,
      actualCostCents: null,
      aiConfidence: null,
      aiRecommendation: null,
      alternativeSuggestions: null,
      similarMarketplaceItems: null,
      riskWarnings: null,
    };
    prisma.requirementSet.findUnique.mockResolvedValue({
      id: setId,
      eventId,
      eventDesignVersionId: designId,
      items: [sourceItem],
      dependencies: [],
    });
    prisma.requirementSet.findFirst.mockResolvedValue({ version: 1 });
    prisma.requirementSet.create.mockResolvedValue({ id: 'set-v2' });
    prisma.requirementItem.create.mockResolvedValue({ id: 'item-v2' });
    prisma.requirementSet.findUniqueOrThrow.mockResolvedValue({
      id: 'set-v2',
      version: 2,
    });

    await service.overrideQuantity(userId, eventId, setId, {
      requirementCode: 'R-001',
      quantityRequired: 58,
      reason: 'VIP table layout',
    });

    expect(prisma.requirementItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requirementCode: 'R-001',
          requirementVersion: 2,
          quantityRequired: 58,
          quantitySource: RequirementQuantitySource.PlannerOverride,
          plannerOverride: true,
          overrideReason: 'VIP table layout',
        }),
      }),
    );
    expect(prisma.requirementItemChange.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        changeType: 'QuantityOverride',
        previousValue: { quantityRequired: 60 },
        nextValue: { quantityRequired: 58 },
      }),
    });
  });
});

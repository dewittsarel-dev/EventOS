/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException } from '@nestjs/common';
import {
  RequirementFulfilmentStrategy,
  RequirementImpactChangeType,
  RequirementImpactDecision,
  RequirementImpactReportStatus,
  RequirementQuantitySource,
  RequirementSetStatus,
  RequirementStatus,
  RequirementType,
} from '@prisma/client';
import { RequirementImpactService } from './requirement-impact.service';

describe('RequirementImpactService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const setId = '55555555-5555-5555-5555-555555555555';
  const reportId = '99999999-9999-9999-9999-999999999999';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    quotation: { count: jest.fn() },
    eventResourceAllocation: { count: jest.fn() },
    requirementSet: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    requirementItem: { create: jest.fn() },
    requirementDependency: { create: jest.fn() },
    requirementItemChange: { create: jest.fn() },
    requirementImpactReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    requirementImpactChange: { update: jest.fn() },
    $transaction: jest.fn(),
  };

  const currentItem = {
    id: 'item-1',
    requirementSetId: setId,
    requirementCode: 'R-001',
    requirementVersion: 1,
    category: 'Furniture',
    requirementType: RequirementType.Product,
    name: 'Round Tables',
    description: null,
    specification: null,
    images: null,
    quantityRequired: 58,
    unit: 'Each',
    quantitySource: RequirementQuantitySource.PlannerOverride,
    plannerOverride: true,
    overrideReason: 'VIP layout',
    deliveryDate: null,
    collectionDate: null,
    setupDate: null,
    removalDate: null,
    requiredTime: null,
    venue: null,
    deliveryArea: null,
    setupArea: null,
    gps: null,
    status: RequirementStatus.Approved,
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
    createdAt: new Date('2026-08-08T00:00:00.000Z'),
  };

  let service: RequirementImpactService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequirementImpactService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.quotation.count.mockResolvedValue(2);
    prisma.eventResourceAllocation.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('detects changed protected overrides without changing the baseline', async () => {
    prisma.requirementSet.findUnique.mockResolvedValue({
      id: setId,
      eventId,
      status: RequirementSetStatus.Approved,
      items: [currentItem],
    });
    prisma.requirementImpactReport.create.mockResolvedValue({ id: reportId });

    await service.createReport(userId, eventId, setId, {
      proposedItems: [
        {
          requirementCode: 'R-001',
          category: 'Furniture',
          requirementType: RequirementType.Product,
          name: 'Round Tables',
          quantityRequired: 52,
          unit: 'Each',
          quantitySource: RequirementQuantitySource.AiCalculated,
        },
      ],
    });

    expect(prisma.requirementImpactReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          affectedItems: 1,
          plannerOverrides: 1,
          requiresProcurementReview: true,
          changes: {
            create: [
              expect.objectContaining({
                requirementCode: 'R-001',
                changeType: RequirementImpactChangeType.OverrideProtected,
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.requirementItem.create).not.toHaveBeenCalled();
  });

  it('requires a planner decision for every proposed change', async () => {
    prisma.requirementImpactReport.findUnique.mockResolvedValue({
      id: reportId,
      eventId,
      status: RequirementImpactReportStatus.PendingReview,
      changes: [{ id: 'change-1' }, { id: 'change-2' }],
      baselineRequirementSet: { items: [], dependencies: [] },
    });

    await expect(
      service.applyReport(userId, eventId, reportId, {
        decisions: [
          { changeId: 'change-1', decision: RequirementImpactDecision.Apply },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.requirementSet.create).not.toHaveBeenCalled();
  });

  it('keeps an override when the planner chooses KeepCurrent', async () => {
    const change = {
      id: 'change-1',
      requirementCode: 'R-001',
      changeType: RequirementImpactChangeType.OverrideProtected,
      previousItem: { quantityRequired: 58 },
      proposedItem: { quantityRequired: 52 },
    };
    prisma.requirementImpactReport.findUnique.mockResolvedValue({
      id: reportId,
      eventId,
      status: RequirementImpactReportStatus.PendingReview,
      changes: [change],
      baselineRequirementSet: {
        eventDesignVersionId: 'design-1',
        items: [currentItem],
        dependencies: [],
      },
    });
    prisma.requirementSet.findFirst.mockResolvedValue({ version: 1 });
    prisma.requirementSet.create.mockResolvedValue({ id: 'set-v2' });
    prisma.requirementItem.create.mockResolvedValue({ id: 'item-v2' });
    prisma.requirementSet.findUniqueOrThrow.mockResolvedValue({
      id: 'set-v2',
      version: 2,
    });

    await service.applyReport(userId, eventId, reportId, {
      decisions: [
        {
          changeId: 'change-1',
          decision: RequirementImpactDecision.KeepCurrent,
        },
      ],
    });

    expect(prisma.requirementItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requirementCode: 'R-001',
          quantityRequired: 58,
          plannerOverride: true,
          overrideReason: 'VIP layout',
        }),
      }),
    );
    expect(prisma.requirementImpactChange.update).toHaveBeenCalledWith({
      where: { id: 'change-1' },
      data: { decision: RequirementImpactDecision.KeepCurrent },
    });
  });
});

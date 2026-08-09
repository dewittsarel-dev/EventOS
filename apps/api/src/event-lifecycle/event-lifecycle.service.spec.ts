/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException } from '@nestjs/common';
import { EventLifecycleService } from './event-lifecycle.service';

describe('EventLifecycleService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = '22222222-2222-2222-2222-222222222222';
  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    clientBriefVersion: { findFirst: jest.fn() },
    eventDesignVersion: { findFirst: jest.fn() },
    requirementSet: { findFirst: jest.fn() },
    moodBoard: { findFirst: jest.fn() },
    procurementPackage: { findMany: jest.fn() },
    commercialWorkspace: { findMany: jest.fn() },
    assetReservation: { count: jest.fn() },
    eventExecution: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    eventFinanceWorkspace: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    financeWbsNode: { findFirst: jest.fn() },
    commercialAward: { findMany: jest.fn() },
    eventFinanceCommitment: { findFirst: jest.fn(), create: jest.fn() },
    assetIncident: { findMany: jest.fn() },
    eventFinancialChange: { findFirst: jest.fn(), create: jest.fn() },
    executionCloseoutItem: { findMany: jest.fn(), create: jest.fn() },
  };
  const execution = {
    createExecution: jest.fn(),
    buildExecutionPlan: jest.fn(),
  };
  const finance = { createWorkspace: jest.fn() };
  let service: EventLifecycleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventLifecycleService(
      prisma as never,
      execution as never,
      finance as never,
    );
    prisma.event.findUnique.mockResolvedValue({ organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.clientBriefVersion.findFirst.mockResolvedValue({
      id: 'brief-1',
      version: 1,
    });
    prisma.eventDesignVersion.findFirst.mockResolvedValue({
      id: 'design-1',
      version: 1,
      status: 'Approved',
    });
    prisma.requirementSet.findFirst.mockResolvedValue({
      id: 'requirements-1',
      version: 1,
      status: 'Approved',
    });
    prisma.moodBoard.findFirst.mockResolvedValue({
      id: 'board-1',
      version: 1,
      status: 'Approved',
    });
    prisma.procurementPackage.findMany.mockResolvedValue([
      {
        id: 'package-1',
        status: 'SolutionSelected',
        solutions: [{ id: 'solution-1' }],
      },
    ]);
    prisma.commercialWorkspace.findMany.mockResolvedValue([
      { id: 'commercial-1', status: 'Awarded', awards: [{ id: 'award-1' }] },
    ]);
    prisma.assetReservation.count.mockResolvedValue(1);
  });

  it('reports the complete source-of-truth chain and no blockers when approvals are continuous', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue({
      id: 'execution-1',
      status: 'Planning',
      executionPlanVersion: 1,
    });
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue({
      id: 'finance-1',
      status: 'Active',
    });
    const result = await service.continuity(userId, organizationId, eventId);
    expect(result.blockers).toEqual([]);
    expect(result.health).toBe('OnTrack');
    expect(result.currentStage).toBe('FinancialControl');
    expect(result.nextAction.actionType).toBe('SynchronizeLifecycle');
    expect(result.sourceOwnership.statutoryAccounting).toBe(
      'ExternalAccountingSystem',
    );
  });

  it('marks the lifecycle complete and blocks further synchronization after Financial Close', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue({
      id: 'execution-1',
      status: 'Completed',
      executionPlanVersion: 1,
    });
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue({
      id: 'finance-1',
      status: 'Closed',
    });

    const result = await service.continuity(userId, organizationId, eventId);

    expect(result).toEqual(
      expect.objectContaining({
        currentStage: 'Closed',
        lifecycleComplete: true,
        executionReady: false,
      }),
    );
    expect(result.nextAction.actionType).toBe('LifecycleComplete');
    await expect(
      service.synchronize(userId, organizationId, eventId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks synchronization when approved upstream context is absent', async () => {
    prisma.requirementSet.findFirst.mockResolvedValue(null);
    prisma.eventExecution.findUnique.mockResolvedValue(null);
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue(null);
    await expect(
      service.synchronize(userId, organizationId, eventId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(execution.createExecution).not.toHaveBeenCalled();
  });

  it('explains the current stage and next action when planning is incomplete', async () => {
    prisma.requirementSet.findFirst.mockResolvedValue(null);
    prisma.eventExecution.findUnique.mockResolvedValue(null);
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue(null);

    const result = await service.continuity(userId, organizationId, eventId);

    expect(result.health).toBe('NeedsAttention');
    expect(result.currentStage).toBe('Design');
    expect(result.nextAction).toEqual(
      expect.objectContaining({
        actionType: 'OpenPlanningWorkspace',
        reason: 'Approved Requirement Set missing',
      }),
    );
  });

  it.each([
    ['Approved Mood Board missing', 'OpenMoodBoard', 'Open Mood Board'],
    [
      'Procurement Package without selected solution',
      'OpenProcurement',
      'Open Procurement',
    ],
    ['Commercial Workspace not awarded', 'OpenCommercial', 'Open Commercial'],
  ])('provides a direct action for %s', async (reason, actionType, label) => {
    if (reason === 'Approved Mood Board missing') {
      prisma.moodBoard.findFirst.mockResolvedValue(null);
    } else if (reason === 'Procurement Package without selected solution') {
      prisma.procurementPackage.findMany.mockResolvedValue([
        { id: 'package-1', status: 'Draft', solutions: [] },
      ]);
    } else {
      prisma.commercialWorkspace.findMany.mockResolvedValue([
        { id: 'commercial-1', status: 'Draft', awards: [] },
      ]);
    }
    prisma.eventExecution.findUnique.mockResolvedValue(null);
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue(null);

    const result = await service.continuity(userId, organizationId, eventId);

    expect(result.nextAction).toEqual({ reason, actionType, label });
  });

  it('synchronizes draft financial evidence idempotently without automatic approval', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue({ id: 'execution-1' });
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue({
      id: 'finance-1',
    });
    prisma.financeWbsNode.findFirst.mockResolvedValue({ id: 'wbs-1' });
    prisma.commercialAward.findMany.mockResolvedValue([
      {
        id: 'award-1',
        requirementItemId: 'requirement-1',
        supplierId: 'supplier-1',
        lineTotal: 500,
        commercialQuoteLine: {
          offeredDescription: 'Chairs',
          commercialQuote: { currency: 'ZAR' },
        },
      },
    ]);
    prisma.eventFinanceCommitment.findFirst.mockResolvedValue(null);
    prisma.eventFinanceCommitment.create.mockResolvedValue({
      id: 'commitment-1',
    });
    prisma.assetIncident.findMany.mockResolvedValue([
      { id: 'incident-1', description: 'Damaged chair', estimatedLoss: 100 },
    ]);
    prisma.eventFinancialChange.findFirst.mockResolvedValue(null);
    prisma.eventFinancialChange.create.mockResolvedValue({ id: 'change-1' });
    prisma.executionCloseoutItem.findMany.mockResolvedValue([]);
    prisma.executionCloseoutItem.create.mockResolvedValue({ id: 'closeout-1' });

    const result = await service.synchronize(userId, organizationId, eventId);

    expect(result).toEqual(
      expect.objectContaining({
        commitmentsCreated: 1,
        assetChangesCreated: 1,
        automaticApprovalsPerformed: false,
      }),
    );
    expect(prisma.eventFinanceCommitment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ commercialAwardId: 'award-1' }),
    });
  });
});

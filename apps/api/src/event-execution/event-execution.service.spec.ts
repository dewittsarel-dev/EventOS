/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import {
  ExecutionControlStatus,
  ExecutionGateDecision,
  ExecutionStatus,
} from '@prisma/client';
import { EventExecutionService } from './event-execution.service';

describe('EventExecutionService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = '22222222-2222-2222-2222-222222222222';
  const executionId = '33333333-3333-3333-3333-333333333333';
  const baseExecution = {
    id: executionId,
    eventId,
    organizationId,
    status: ExecutionStatus.Created,
    executionPlanVersion: 0,
    summary: null,
    milestones: [],
    createdAt: new Date('2027-01-01T00:00:00.000Z'),
    updatedAt: new Date('2027-01-01T00:00:00.000Z'),
    archivedAt: null,
  };
  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    eventExecution: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    requirementItem: { findMany: jest.fn() },
    executionWorkstream: { upsert: jest.fn() },
    executionTask: {
      upsert: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    resource: { findUnique: jest.fn() },
    resourceReservation: { create: jest.fn(), updateMany: jest.fn() },
    commercialPurchaseOrderDraft: { findMany: jest.fn() },
    commercialRfq: { findMany: jest.fn() },
    executionCloseoutItem: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    executionReadinessGate: { upsert: jest.fn(), count: jest.fn() },
    executionSiteControl: { create: jest.fn() },
    executionCommissioningCheck: { create: jest.fn(), count: jest.fn() },
    executionAcceptance: { create: jest.fn(), count: jest.fn() },
    executionRunOfShowItem: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    executionCommandLog: { create: jest.fn() },
    executionIncident: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: EventExecutionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventExecutionService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('lists the supported execution capability actions', () => {
    expect(service.listSupportedActions()).toHaveLength(12);
  });

  it('creates a persistent execution with controlled lifecycle milestones', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue(null);
    prisma.eventExecution.create.mockResolvedValue(baseExecution);

    const result = await service.createExecution({
      organizationId,
      eventId,
      actorId: userId,
    });

    expect(result.status).toBe('created');
    expect(prisma.eventExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId,
        eventId,
        createdByUserId: userId,
        milestones: {
          create: expect.arrayContaining([
            expect.objectContaining({ key: 'go-live' }),
            expect.objectContaining({ key: 'venue-handover' }),
          ]),
        },
      }),
      include: expect.any(Object),
    });
  });

  it('requires explained human waiver for a readiness gate', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue(baseExecution);
    await expect(
      service.assessGate(userId, organizationId, eventId, {
        key: 'safety',
        name: 'Safety readiness',
        category: 'Safety',
        decision: ExecutionGateDecision.Waived,
      }),
    ).rejects.toThrow('waiver requires a recorded reason');
  });

  it('blocks go-live until required gates, commissioning and acceptance pass', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue(baseExecution);
    prisma.executionReadinessGate.count.mockResolvedValue(1);
    prisma.executionCommissioningCheck.count.mockResolvedValue(0);
    prisma.executionAcceptance.count.mockResolvedValue(1);

    await expect(
      service.approveGoLive(userId, organizationId, eventId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks completion while controlled closeout items remain', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue({
      ...baseExecution,
      status: ExecutionStatus.InProgress,
    });
    prisma.executionCloseoutItem.count.mockResolvedValue(1);

    await expect(
      service.complete({ organizationId, eventId, actorId: userId }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires completion evidence for objective task criteria', async () => {
    prisma.eventExecution.findUnique.mockResolvedValue(baseExecution);
    prisma.executionTask.findUnique.mockResolvedValue({
      id: 'task-1',
      eventExecutionId: executionId,
    });

    await expect(
      service.changeTaskStatus(userId, organizationId, eventId, 'task-1', {
        status: ExecutionControlStatus.Completed,
      }),
    ).rejects.toThrow('Completion evidence is required');
  });
});

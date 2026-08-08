/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  AssetCreationSource,
  AssetLifecycleStatus,
  AssetOwnershipType,
  AssetTrackingMode,
  AssetInspectionOutcome,
  AssetReservationStatus,
} from '@prisma/client';
import { AssetManagementService } from './asset-management.service';

describe('AssetManagementService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const definitionId = '22222222-2222-2222-2222-222222222222';
  const prisma = {
    membership: { findUnique: jest.fn() },
    assetDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    assetInstance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    assetIdentityAudit: { create: jest.fn() },
    assetLocation: { findUnique: jest.fn(), create: jest.fn() },
    assetMovement: { create: jest.fn() },
    assetQrEvent: { create: jest.fn() },
    requirementItem: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    assetReservation: {
      aggregate: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    assetOperation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assetInspection: { create: jest.fn() },
    assetDeployment: { create: jest.fn() },
    assetMaintenanceWorkOrder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    assetIncident: { create: jest.fn(), groupBy: jest.fn() },
    assetDisposal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assetBatch: { findUnique: jest.fn() },
    assetKit: { findUnique: jest.fn() },
    assetGovernanceException: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: AssetManagementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssetManagementService(prisma as never);
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('returns immutable formatted Asset Definition identities and audit evidence', async () => {
    prisma.assetDefinition.findMany.mockResolvedValue([]);
    prisma.assetDefinition.create.mockResolvedValue({
      id: definitionId,
      systemNumber: 1427,
      organizationId,
    });
    prisma.assetIdentityAudit.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.createDefinition(userId, {
      organizationId,
      assetCode: 'CHR-TIFF-WHT',
      name: 'White Tiffany Chair',
      classification: 'Furniture',
      category: 'Seating',
      trackingMode: AssetTrackingMode.Serialized,
      ownershipType: AssetOwnershipType.BusinessOwned,
      unitOfMeasure: 'Each',
      creationSource: AssetCreationSource.ManualRegistration,
    });

    expect(result.assetDefinitionId).toBe('AST-DEF-00001427');
    expect(prisma.assetIdentityAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'Created',
        entityType: 'AssetDefinition',
        userId,
      }),
    });
  });

  it('never automatically merges a probable duplicate', async () => {
    prisma.assetDefinition.findMany.mockResolvedValue([
      { id: definitionId, systemNumber: 1, assetCode: 'CHAIR', name: 'Chair' },
    ]);
    await expect(
      service.createDefinition(userId, {
        organizationId,
        assetCode: 'CHAIR',
        name: 'Chair',
        classification: 'Furniture',
        category: 'Seating',
        trackingMode: AssetTrackingMode.Quantity,
        ownershipType: AssetOwnershipType.BusinessOwned,
        unitOfMeasure: 'Each',
        creationSource: AssetCreationSource.ManualRegistration,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.assetDefinition.create).not.toHaveBeenCalled();
  });

  it('rejects instances under non-serialized definitions', async () => {
    prisma.assetDefinition.findUnique.mockResolvedValue({
      id: definitionId,
      organizationId,
      archivedAt: null,
      trackingMode: AssetTrackingMode.Quantity,
    });
    await expect(
      service.createInstance(userId, {
        assetDefinitionId: definitionId,
        operationalCode: 'CHAIR-0001',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records lifecycle transitions without replacing the asset identity', async () => {
    prisma.assetInstance.findUnique.mockResolvedValue({
      id: 'instance-1',
      systemNumber: 7,
      organizationId,
      lifecycleStatus: AssetLifecycleStatus.Active,
      archivedAt: null,
    });
    prisma.assetInstance.update.mockResolvedValue({
      id: 'instance-1',
      systemNumber: 7,
      organizationId,
      lifecycleStatus: AssetLifecycleStatus.InMaintenance,
    });
    prisma.assetIdentityAudit.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.changeLifecycle(userId, 'instance-1', {
      status: AssetLifecycleStatus.InMaintenance,
      reason: 'Scheduled service',
    });

    expect(result.assetInstanceId).toBe('AST-INS-00000007');
    expect(prisma.assetIdentityAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: 'instance-1',
        action: 'LifecycleChanged',
        reason: 'Scheduled service',
      }),
    });
  });

  it('calculates availability and refuses an over-allocation', async () => {
    prisma.assetDefinition.findUnique.mockResolvedValue({
      id: definitionId,
      organizationId,
      trackingMode: AssetTrackingMode.Quantity,
      quantityOnHand: 100,
      quantityUnavailable: 10,
    });
    prisma.requirementItem.findUnique.mockResolvedValue({
      id: 'requirement-1',
    });
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizationId,
    });
    prisma.assetReservation.aggregate.mockResolvedValue({
      _sum: { quantity: 80 },
    });

    await expect(
      service.createReservation(userId, {
        organizationId,
        eventId: '33333333-3333-3333-3333-333333333333',
        requirementItemId: '44444444-4444-4444-4444-444444444444',
        assetDefinitionId: definitionId,
        quantity: 20,
        startDateTime: '2027-01-01T08:00:00.000Z',
        endDateTime: '2027-01-02T08:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.assetReservation.create).not.toHaveBeenCalled();
  });

  it('quarantines a serialized asset after a failed inspection', async () => {
    prisma.assetInstance.findUnique.mockResolvedValue({
      id: 'instance-1',
      organizationId,
    });
    prisma.assetInspection.create.mockResolvedValue({ id: 'inspection-1' });
    prisma.assetInstance.update.mockResolvedValue({ id: 'instance-1' });

    await service.recordInspection(userId, {
      organizationId,
      assetEntityType: 'AssetInstance',
      assetEntityId: 'instance-1',
      inspectionType: 'Return',
      outcome: AssetInspectionOutcome.Fail,
      conditionGrade: 'D',
    });

    expect(prisma.assetInstance.update).toHaveBeenCalledWith({
      where: { id: 'instance-1' },
      data: {
        lifecycleStatus: AssetLifecycleStatus.Quarantined,
        conditionGrade: 'D',
      },
    });
  });

  it('records human approval when a reservation is confirmed', async () => {
    prisma.assetReservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      organizationId,
    });
    prisma.assetReservation.update.mockResolvedValue({ id: 'reservation-1' });

    await service.changeReservationStatus(userId, 'reservation-1', {
      status: AssetReservationStatus.Confirmed,
    });

    expect(prisma.assetReservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: expect.objectContaining({
        status: AssetReservationStatus.Confirmed,
        approvedByUserId: userId,
        approvedAt: expect.any(Date),
      }),
    });
  });
});

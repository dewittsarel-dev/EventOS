import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssetLifecycleStatus,
  AssetInspectionOutcome,
  AssetMaintenanceStatus,
  AssetOperationStatus,
  AssetReservationStatus,
  AssetTrackingMode,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssetSearchQueryDto,
  ChangeAssetLifecycleDto,
  CreateAssetDefinitionDto,
  CreateAssetBatchDto,
  CreateAssetKitDto,
  CreateAssetInstanceDto,
} from './dto/asset-identity.dto';
import {
  ChangeAssetDisposalStatusDto,
  ChangeAssetMaintenanceStatusDto,
  ChangeAssetOperationStatusDto,
  ChangeAssetReservationStatusDto,
  CreateAssetDisposalDto,
  CreateAssetIncidentDto,
  CreateAssetLocationDto,
  CreateAssetMaintenanceDto,
  CreateAssetOperationDto,
  CreateAssetReservationDto,
  RecordAssetInspectionDto,
  RecordAssetDeploymentDto,
  RecordAssetMovementDto,
  RecordAssetQrEventDto,
} from './dto/asset-operations.dto';

@Injectable()
export class AssetManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createDefinition(userId: string, dto: CreateAssetDefinitionDto) {
    await this.requireMembership(userId, dto.organizationId);
    const duplicates = await this.prisma.assetDefinition.findMany({
      where: {
        organizationId: dto.organizationId,
        archivedAt: null,
        OR: [
          { assetCode: { equals: dto.assetCode, mode: 'insensitive' } },
          ...(dto.barcode ? [{ barcode: dto.barcode }] : []),
          ...(dto.internalSku ? [{ internalSku: dto.internalSku }] : []),
          {
            AND: [
              { name: { equals: dto.name, mode: 'insensitive' } },
              { category: { equals: dto.category, mode: 'insensitive' } },
              ...(dto.brand
                ? [
                    {
                      brand: {
                        equals: dto.brand,
                        mode: 'insensitive' as const,
                      },
                    },
                  ]
                : []),
              ...(dto.model
                ? [
                    {
                      model: {
                        equals: dto.model,
                        mode: 'insensitive' as const,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      select: { id: true, systemNumber: true, assetCode: true, name: true },
      take: 10,
    });
    if (duplicates.length > 0) {
      throw new ConflictException({
        message: 'Possible duplicate Asset Definition requires operator review',
        probableDuplicates: duplicates.map((row) => ({
          ...row,
          assetDefinitionId: this.formatId('AST-DEF', row.systemNumber),
        })),
        automaticMergePerformed: false,
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const { openingQuantity, ...identity } = dto;
      const definition = await tx.assetDefinition.create({
        data: {
          ...identity,
          variantAttributes: dto.variantAttributes as Prisma.InputJsonValue,
          capabilityTags: dto.capabilityTags ?? [],
          quantityOnHand: openingQuantity ?? 0,
          createdByUserId: userId,
        },
      });
      await this.audit(tx, {
        organizationId: dto.organizationId,
        entityType: 'AssetDefinition',
        entityId: definition.id,
        action: 'Created',
        newValue: definition,
        sourceAction: dto.creationSource,
        userId,
      });
      return this.mapDefinition(definition);
    });
  }

  async createInstance(userId: string, dto: CreateAssetInstanceDto) {
    const definition = await this.prisma.assetDefinition.findUnique({
      where: { id: dto.assetDefinitionId },
    });
    if (!definition || definition.archivedAt) {
      throw new NotFoundException('Asset Definition not found');
    }
    await this.requireMembership(userId, definition.organizationId);
    if (definition.trackingMode !== AssetTrackingMode.Serialized) {
      throw new BadRequestException(
        'Asset Instances may only be created for serialized Asset Definitions',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.assetInstance.create({
        data: {
          ...dto,
          organizationId: definition.organizationId,
          ownershipType: definition.ownershipType,
          creationSource: definition.creationSource,
          acquisitionDate: dto.acquisitionDate
            ? new Date(dto.acquisitionDate)
            : undefined,
          warrantyExpiryDate: dto.warrantyExpiryDate
            ? new Date(dto.warrantyExpiryDate)
            : undefined,
          controlStartDate: dto.controlStartDate
            ? new Date(dto.controlStartDate)
            : undefined,
          expectedControlEndDate: dto.expectedControlEndDate
            ? new Date(dto.expectedControlEndDate)
            : undefined,
          createdByUserId: userId,
        },
      });
      await this.audit(tx, {
        organizationId: definition.organizationId,
        entityType: 'AssetInstance',
        entityId: instance.id,
        action: 'Created',
        newValue: instance,
        sourceAction: definition.creationSource,
        userId,
      });
      return this.mapInstance(instance);
    });
  }

  async createBatch(userId: string, dto: CreateAssetBatchDto) {
    const definition = await this.prisma.assetDefinition.findUnique({
      where: { id: dto.assetDefinitionId },
    });
    if (!definition || definition.trackingMode !== AssetTrackingMode.Batch)
      throw new BadRequestException(
        'Batches require a batch-tracked Asset Definition',
      );
    await this.requireMembership(userId, definition.organizationId);
    const batch = await this.prisma.assetBatch.create({
      data: {
        organizationId: definition.organizationId,
        assetDefinitionId: definition.id,
        quantityReceived: dto.quantity,
        quantityBalance: dto.quantity,
        originReference: dto.originReference,
        attributes: dto.attributes as Prisma.InputJsonValue,
      },
    });
    return { ...batch, batchId: this.formatId('AST-BAT', batch.systemNumber) };
  }

  async createKit(userId: string, dto: CreateAssetKitDto) {
    const definition = await this.prisma.assetDefinition.findUnique({
      where: { id: dto.assetDefinitionId },
    });
    if (!definition || definition.trackingMode !== AssetTrackingMode.Kit)
      throw new BadRequestException(
        'Kits require a kit-tracked Asset Definition',
      );
    await this.requireMembership(userId, definition.organizationId);
    for (const member of dto.members) {
      await this.requireAssetEntity(
        definition.organizationId,
        member.memberType,
        member.memberId,
      );
    }
    const kit = await this.prisma.assetKit.create({
      data: {
        organizationId: definition.organizationId,
        assetDefinitionId: definition.id,
        name: dto.name,
        members: { create: dto.members },
      },
      include: { members: true },
    });
    return { ...kit, kitId: this.formatId('AST-KIT', kit.systemNumber) };
  }

  async changeLifecycle(
    userId: string,
    instanceId: string,
    dto: ChangeAssetLifecycleDto,
  ) {
    const instance = await this.prisma.assetInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Asset Instance not found');
    await this.requireMembership(userId, instance.organizationId);
    if (instance.lifecycleStatus === dto.status) {
      throw new BadRequestException('Asset already has this lifecycle status');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assetInstance.update({
        where: { id: instanceId },
        data: {
          lifecycleStatus: dto.status,
          archivedAt:
            dto.status === AssetLifecycleStatus.Archived
              ? new Date()
              : instance.archivedAt,
        },
      });
      await this.audit(tx, {
        organizationId: instance.organizationId,
        entityType: 'AssetInstance',
        entityId: instance.id,
        action: 'LifecycleChanged',
        previousValue: { lifecycleStatus: instance.lifecycleStatus },
        newValue: { lifecycleStatus: updated.lifecycleStatus },
        reason: dto.reason,
        sourceAction: 'OperatorLifecycleTransition',
        userId,
      });
      return this.mapInstance(updated);
    });
  }

  async search(userId: string, query: AssetSearchQueryDto) {
    await this.requireMembership(userId, query.organizationId);
    const search = query.search?.trim();
    const [definitions, instances] = await Promise.all([
      this.prisma.assetDefinition.findMany({
        where: {
          organizationId: query.organizationId,
          ...(search
            ? {
                OR: [
                  { assetCode: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                  { barcode: { contains: search, mode: 'insensitive' } },
                  { internalSku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.assetInstance.findMany({
        where: {
          organizationId: query.organizationId,
          ...(search
            ? {
                OR: [
                  {
                    operationalCode: { contains: search, mode: 'insensitive' },
                  },
                  {
                    manufacturerSerial: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  { qrIdentity: { contains: search, mode: 'insensitive' } },
                  {
                    barcodeIdentity: { contains: search, mode: 'insensitive' },
                  },
                ],
              }
            : {}),
        },
        include: { assetDefinition: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);
    return {
      definitions: definitions.map((row) => this.mapDefinition(row)),
      instances: instances.map((row) => this.mapInstance(row)),
    };
  }

  async createLocation(userId: string, dto: CreateAssetLocationDto) {
    await this.requireMembership(userId, dto.organizationId);
    if (dto.parentLocationId) {
      const parent = await this.prisma.assetLocation.findUnique({
        where: { id: dto.parentLocationId },
      });
      if (!parent || parent.organizationId !== dto.organizationId)
        throw new BadRequestException(
          'Parent location is outside the organization',
        );
    }
    return this.prisma.assetLocation.create({
      data: {
        ...dto,
        handlingRules: dto.handlingRules as Prisma.InputJsonValue,
      },
    });
  }

  async recordMovement(userId: string, dto: RecordAssetMovementDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    if (
      dto.fromLocationId &&
      dto.toLocationId &&
      dto.fromLocationId === dto.toLocationId
    ) {
      throw new BadRequestException(
        'Movement requires distinct source and target locations',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.assetMovement.create({
        data: {
          ...dto,
          evidence: dto.evidence as Prisma.InputJsonValue,
          performedByUserId: userId,
        },
      });
      if (dto.assetEntityType === 'AssetInstance') {
        await tx.assetInstance.update({
          where: { id: dto.assetEntityId },
          data: {
            currentLocationId: dto.toLocationId,
            currentCustodianType: dto.toCustodianType,
            currentCustodianId: dto.toCustodianId,
          },
        });
      }
      await this.audit(tx, {
        organizationId: dto.organizationId,
        entityType: dto.assetEntityType,
        entityId: dto.assetEntityId,
        action: 'MovementRecorded',
        newValue: movement,
        reason: dto.reason,
        sourceAction: dto.movementType,
        userId,
      });
      return movement;
    });
  }

  async recordQrEvent(userId: string, dto: RecordAssetQrEventDto) {
    await this.requireMembership(userId, dto.organizationId);
    const instance = await this.prisma.assetInstance.findFirst({
      where: { organizationId: dto.organizationId, qrIdentity: dto.qrIdentity },
    });
    if (!instance)
      throw new NotFoundException(
        'QR identity is not assigned to an Asset Instance',
      );
    return this.prisma.assetQrEvent.create({
      data: {
        ...dto,
        assetEntityType: 'AssetInstance',
        assetEntityId: instance.id,
        offlineRecordedAt: dto.offlineRecordedAt
          ? new Date(dto.offlineRecordedAt)
          : undefined,
        synchronizedAt: dto.offlineRecordedAt ? new Date() : undefined,
        evidence: dto.evidence as Prisma.InputJsonValue,
        scannedByUserId: userId,
      },
    });
  }

  async createReservation(userId: string, dto: CreateAssetReservationDto) {
    await this.requireMembership(userId, dto.organizationId);
    const [definition, requirement, event] = await Promise.all([
      this.prisma.assetDefinition.findUnique({
        where: { id: dto.assetDefinitionId },
      }),
      this.prisma.requirementItem.findUnique({
        where: { id: dto.requirementItemId },
      }),
      this.prisma.event.findUnique({ where: { id: dto.eventId } }),
    ]);
    if (!definition || definition.organizationId !== dto.organizationId)
      throw new NotFoundException('Asset Definition not found');
    if (!requirement || !event || event.organizationId !== dto.organizationId)
      throw new BadRequestException(
        'Reservation requires a valid Event and Requirement Item',
      );
    const start = new Date(dto.startDateTime);
    const end = new Date(dto.endDateTime);
    if (start >= end)
      throw new BadRequestException('Reservation end must be after start');
    const overlapping = await this.prisma.assetReservation.aggregate({
      where: {
        assetDefinitionId: dto.assetDefinitionId,
        status: {
          in: [
            AssetReservationStatus.Reserved,
            AssetReservationStatus.Confirmed,
          ],
        },
        startDateTime: { lt: end },
        endDateTime: { gt: start },
      },
      _sum: { quantity: true },
    });
    const capacity =
      definition.trackingMode === AssetTrackingMode.Serialized
        ? await this.prisma.assetInstance.count({
            where: {
              assetDefinitionId: definition.id,
              lifecycleStatus: AssetLifecycleStatus.Active,
              archivedAt: null,
            },
          })
        : definition.quantityOnHand - definition.quantityUnavailable;
    const available = capacity - (overlapping._sum.quantity ?? 0);
    if (dto.quantity > available) {
      throw new ConflictException({
        message: 'Insufficient system-calculated availability',
        capacity,
        available,
        requested: dto.quantity,
      });
    }
    if (dto.assetInstanceId) {
      const instanceOverlap = await this.prisma.assetReservation.count({
        where: {
          assetInstanceId: dto.assetInstanceId,
          status: {
            in: [
              AssetReservationStatus.Reserved,
              AssetReservationStatus.Confirmed,
            ],
          },
          startDateTime: { lt: end },
          endDateTime: { gt: start },
        },
      });
      if (instanceOverlap > 0)
        throw new ConflictException(
          'Serialized Asset Instance is already reserved',
        );
    }
    return this.prisma.assetReservation.create({
      data: {
        ...dto,
        startDateTime: start,
        endDateTime: end,
        status: AssetReservationStatus.Reserved,
        createdByUserId: userId,
      },
    });
  }

  async changeReservationStatus(
    userId: string,
    id: string,
    dto: ChangeAssetReservationStatusDto,
  ) {
    const reservation = await this.prisma.assetReservation.findUnique({
      where: { id },
    });
    if (!reservation)
      throw new NotFoundException('Asset Reservation not found');
    await this.requireMembership(userId, reservation.organizationId);
    return this.prisma.assetReservation.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId:
          dto.status === AssetReservationStatus.Confirmed ? userId : undefined,
        approvedAt:
          dto.status === AssetReservationStatus.Confirmed
            ? new Date()
            : undefined,
        overrideReason: dto.reason,
      },
    });
  }

  async createOperation(userId: string, dto: CreateAssetOperationDto) {
    await this.requireMembership(userId, dto.organizationId);
    return this.prisma.assetOperation.create({
      data: {
        organizationId: dto.organizationId,
        eventId: dto.eventId,
        operationType: dto.operationType,
        sourceLocationId: dto.sourceLocationId,
        targetLocationId: dto.targetLocationId,
        createdByUserId: userId,
        lines: {
          create: dto.lines.map((line, sequence) => ({ ...line, sequence })),
        },
      },
      include: { lines: true },
    });
  }

  async changeOperationStatus(
    userId: string,
    id: string,
    dto: ChangeAssetOperationStatusDto,
  ) {
    const operation = await this.prisma.assetOperation.findUnique({
      where: { id },
    });
    if (!operation) throw new NotFoundException('Asset Operation not found');
    await this.requireMembership(userId, operation.organizationId);
    return this.prisma.assetOperation.update({
      where: { id },
      data: {
        status: dto.status,
        actualStart:
          dto.status === AssetOperationStatus.InProgress
            ? new Date()
            : undefined,
        actualEnd:
          dto.status === AssetOperationStatus.Completed
            ? new Date()
            : undefined,
        approvedByUserId:
          dto.status === AssetOperationStatus.Ready ? userId : undefined,
        approvedAt:
          dto.status === AssetOperationStatus.Ready ? new Date() : undefined,
        exceptionNotes: dto.exceptionNotes,
      },
      include: { lines: true },
    });
  }

  async recordInspection(userId: string, dto: RecordAssetInspectionDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.assetInspection.create({
        data: {
          ...dto,
          responses: dto.responses as Prisma.InputJsonValue,
          evidence: dto.evidence as Prisma.InputJsonValue,
          performedByUserId: userId,
        },
      });
      if (
        dto.assetEntityType === 'AssetInstance' &&
        (dto.outcome === AssetInspectionOutcome.Fail ||
          dto.outcome === AssetInspectionOutcome.Quarantine)
      ) {
        await tx.assetInstance.update({
          where: { id: dto.assetEntityId },
          data: {
            lifecycleStatus: AssetLifecycleStatus.Quarantined,
            conditionGrade: dto.conditionGrade,
          },
        });
      }
      return inspection;
    });
  }

  async recordDeployment(userId: string, dto: RecordAssetDeploymentDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      select: { organizationId: true },
    });
    if (!event || event.organizationId !== dto.organizationId)
      throw new BadRequestException(
        'Deployment event is outside the organization',
      );
    return this.prisma.assetDeployment.create({
      data: {
        ...dto,
        quantity: dto.quantity ?? 1,
        deployedAt: new Date(),
        evidence: dto.evidence as Prisma.InputJsonValue,
      },
    });
  }

  async createMaintenance(userId: string, dto: CreateAssetMaintenanceDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    return this.prisma.assetMaintenanceWorkOrder.create({
      data: {
        ...dto,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
        createdByUserId: userId,
      },
    });
  }

  async changeMaintenanceStatus(
    userId: string,
    id: string,
    dto: ChangeAssetMaintenanceStatusDto,
  ) {
    const workOrder = await this.prisma.assetMaintenanceWorkOrder.findUnique({
      where: { id },
    });
    if (!workOrder)
      throw new NotFoundException('Maintenance Work Order not found');
    await this.requireMembership(userId, workOrder.organizationId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assetMaintenanceWorkOrder.update({
        where: { id },
        data: {
          status: dto.status,
          approvedByUserId:
            dto.status === AssetMaintenanceStatus.Approved ? userId : undefined,
          approvedAt:
            dto.status === AssetMaintenanceStatus.Approved
              ? new Date()
              : undefined,
          completedAt:
            dto.status === AssetMaintenanceStatus.Completed
              ? new Date()
              : undefined,
          completionNotes: dto.completionNotes,
          actualCost: dto.actualCost,
        },
      });
      if (workOrder.assetEntityType === 'AssetInstance') {
        await tx.assetInstance.update({
          where: { id: workOrder.assetEntityId },
          data: {
            lifecycleStatus:
              dto.status === AssetMaintenanceStatus.Completed
                ? AssetLifecycleStatus.Active
                : dto.status === AssetMaintenanceStatus.InProgress
                  ? AssetLifecycleStatus.InMaintenance
                  : undefined,
          },
        });
      }
      return updated;
    });
  }

  async createIncident(userId: string, dto: CreateAssetIncidentDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    return this.prisma.$transaction(async (tx) => {
      const incident = await tx.assetIncident.create({
        data: {
          ...dto,
          occurredAt: new Date(dto.occurredAt),
          evidence: dto.evidence as Prisma.InputJsonValue,
          reportedByUserId: userId,
        },
      });
      if (dto.assetEntityType === 'AssetInstance') {
        const status =
          dto.incidentType === 'Loss' || dto.incidentType === 'Missing'
            ? AssetLifecycleStatus.Lost
            : dto.incidentType === 'Theft'
              ? AssetLifecycleStatus.Stolen
              : AssetLifecycleStatus.Damaged;
        await tx.assetInstance.update({
          where: { id: dto.assetEntityId },
          data: { lifecycleStatus: status },
        });
      }
      return incident;
    });
  }

  async createDisposal(userId: string, dto: CreateAssetDisposalDto) {
    await this.requireMembership(userId, dto.organizationId);
    await this.requireAssetEntity(
      dto.organizationId,
      dto.assetEntityType,
      dto.assetEntityId,
    );
    return this.prisma.assetDisposal.create({
      data: { ...dto, proposedByUserId: userId },
    });
  }

  async changeDisposalStatus(
    userId: string,
    id: string,
    dto: ChangeAssetDisposalStatusDto,
  ) {
    const disposal = await this.prisma.assetDisposal.findUnique({
      where: { id },
    });
    if (!disposal) throw new NotFoundException('Asset Disposal not found');
    await this.requireMembership(userId, disposal.organizationId);
    if (dto.status === 'Executed' && disposal.status !== 'Approved') {
      throw new ConflictException(
        'Disposal must be independently approved before execution',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assetDisposal.update({
        where: { id },
        data: {
          status: dto.status,
          realisedValue: dto.realisedValue,
          evidence: dto.evidence as Prisma.InputJsonValue,
          approvedByUserId: dto.status === 'Approved' ? userId : undefined,
          approvedAt: dto.status === 'Approved' ? new Date() : undefined,
          executedByUserId: dto.status === 'Executed' ? userId : undefined,
          executedAt: dto.status === 'Executed' ? new Date() : undefined,
        },
      });
      if (
        dto.status === 'Executed' &&
        disposal.assetEntityType === 'AssetInstance'
      ) {
        await tx.assetInstance.update({
          where: { id: disposal.assetEntityId },
          data: {
            lifecycleStatus: AssetLifecycleStatus.Retired,
            archivedAt: new Date(),
          },
        });
      }
      return updated;
    });
  }

  async governanceSummary(userId: string, organizationId: string) {
    await this.requireMembership(userId, organizationId);
    const [
      definitions,
      instances,
      reservations,
      incidents,
      maintenance,
      exceptions,
    ] = await Promise.all([
      this.prisma.assetDefinition.count({
        where: { organizationId, archivedAt: null },
      }),
      this.prisma.assetInstance.groupBy({
        where: { organizationId },
        by: ['lifecycleStatus'],
        _count: true,
      }),
      this.prisma.assetReservation.groupBy({
        where: { organizationId },
        by: ['status'],
        _count: true,
      }),
      this.prisma.assetIncident.groupBy({
        where: { organizationId },
        by: ['status'],
        _count: true,
      }),
      this.prisma.assetMaintenanceWorkOrder.groupBy({
        where: { organizationId },
        by: ['status'],
        _count: true,
      }),
      this.prisma.assetGovernanceException.count({
        where: { organizationId, resolvedAt: null },
      }),
    ]);
    return {
      readOnly: true,
      definitions,
      instances,
      reservations,
      incidents,
      maintenance,
      unresolvedGovernanceExceptions: exceptions,
    };
  }

  private async requireAssetEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
  ) {
    const row =
      entityType === 'AssetInstance'
        ? await this.prisma.assetInstance.findUnique({
            where: { id: entityId },
            select: { organizationId: true },
          })
        : entityType === 'AssetDefinition'
          ? await this.prisma.assetDefinition.findUnique({
              where: { id: entityId },
              select: { organizationId: true },
            })
          : entityType === 'AssetBatch'
            ? await this.prisma.assetBatch.findUnique({
                where: { id: entityId },
                select: { organizationId: true },
              })
            : entityType === 'AssetKit'
              ? await this.prisma.assetKit.findUnique({
                  where: { id: entityId },
                  select: { organizationId: true },
                })
              : null;
    if (!row || row.organizationId !== organizationId)
      throw new NotFoundException('Asset entity not found');
  }

  private async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }

  private audit(
    tx: Prisma.TransactionClient,
    data: {
      organizationId: string;
      entityType: string;
      entityId: string;
      action: string;
      previousValue?: unknown;
      newValue?: unknown;
      reason?: string;
      sourceAction: string;
      userId: string;
    },
  ) {
    return tx.assetIdentityAudit.create({
      data: {
        ...data,
        previousValue: data.previousValue as Prisma.InputJsonValue,
        newValue: data.newValue as Prisma.InputJsonValue,
      },
    });
  }

  private mapDefinition<T extends { systemNumber: number }>(row: T) {
    return {
      ...row,
      assetDefinitionId: this.formatId('AST-DEF', row.systemNumber),
    };
  }

  private mapInstance<T extends { systemNumber: number }>(row: T) {
    return {
      ...row,
      assetInstanceId: this.formatId('AST-INS', row.systemNumber),
    };
  }

  private formatId(prefix: string, value: number) {
    return `${prefix}-${String(value).padStart(8, '0')}`;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventResourceAllocationStatus,
  EventResourceOutstandingStatus,
  Prisma,
  ResourceCondition,
  ResourceQuantityMode,
  ResourceReservationSourceType,
  ResourceReservationStatus,
  ResourceStatus,
  ResourceVisibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CapabilityActionDefinition } from '../capabilities/capability.types';
import { resourceCapabilityActions } from './resource-capability.actions';
import type { ResourceEnginePort } from './resource-engine.port';
import type {
  ArchiveResourceInput,
  AvailabilityCalendarResult,
  CancelReservationInput,
  CheckAvailabilityInput,
  ConfirmReservationInput,
  EventResourceAllocationRecord,
  EventResourceOutstandingRecord,
  GetEventResourceAllocationsInput,
  GetResourceAllocationHistoryInput,
  GetResourceAvailabilitySummaryInput,
  ReleaseEventAllocationsInput,
  ReserveResourcesForEventInput,
  ReserveResourcesForEventResult,
  ResourceAvailabilitySummary,
  CreateReservationInput,
  CreateResourceInput,
  GetAvailabilityCalendarInput,
  GetReservationsForResourceInput,
  GetReservationsForSourceInput,
  GetResourceInput,
  ReleaseReservationInput,
  ResourceAvailabilitySnapshot,
  ResourceRecord,
  ResourceReservationRecord,
  ResourceSearchResult,
  RestoreResourceInput,
  SearchResourcesInput,
  UpdateReservationInput,
  UpdateResourceInput,
} from './resource.types';

type PermissionAction = 'View' | 'Create' | 'Edit' | 'Delete';
type RolePermissionMap = Record<string, Record<string, boolean>>;

const CAPACITY_CONSUMING_STATUSES: ResourceReservationStatus[] = [
  ResourceReservationStatus.PENDING,
  ResourceReservationStatus.RESERVED,
  ResourceReservationStatus.CONFIRMED,
  ResourceReservationStatus.DISPATCHED,
];

@Injectable()
export class ResourceEngineService implements ResourceEnginePort {
  constructor(private readonly prisma: PrismaService) {}

  listSupportedActions(): CapabilityActionDefinition[] {
    return resourceCapabilityActions.map((action) => ({ ...action }));
  }

  async createResource(input: CreateResourceInput): Promise<ResourceRecord> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'Create',
    );

    if (input.locationId) {
      await this.ensureLocationOwnership(
        input.locationId,
        input.organizationId,
      );
    }

    if (input.supplierId) {
      await this.ensureSupplierOwnership(
        input.supplierId,
        input.organizationId,
      );
    }

    this.validateTotalQuantity(input.quantityMode, input.totalQuantity);

    try {
      const created = await this.prisma.resource.create({
        data: {
          organizationId: input.organizationId,
          supplierId: input.supplierId ?? null,
          name: input.name.trim(),
          description: this.normalizeNullable(input.description),
          category: input.category.trim(),
          tags: this.normalizeStringArray(input.tags),
          keywords: this.normalizeStringArray(input.keywords),
          aiSummary: this.normalizeNullable(input.aiSummary),
          searchPhrases: this.normalizeStringArray(input.searchPhrases),
          imageUrls: this.normalizeImageUrls(input.imageUrls),
          resourceType: input.resourceType,
          quantityMode: input.quantityMode,
          sku: this.normalizeNullable(input.sku),
          barcode: this.normalizeNullable(input.barcode),
          status: input.status ?? ResourceStatus.AVAILABLE,
          visibility: input.visibility ?? ResourceVisibility.PRIVATE,
          unit: input.unit.trim(),
          totalQuantity: this.normalizeQuantityNullable(input.totalQuantity),
          condition: input.condition ?? ResourceCondition.UNKNOWN,
          locationId: input.locationId ?? null,
          purchaseValue: this.normalizeMoneyNullable(input.purchaseValue),
          replacementValue: this.normalizeMoneyNullable(input.replacementValue),
          rentalPrice: this.normalizeMoneyNullable(input.rentalPrice),
          damagedQuantity: this.normalizeNonNegativeQuantity(
            input.damagedQuantity,
            'damagedQuantity',
          ),
          maintenanceQuantity: this.normalizeNonNegativeQuantity(
            input.maintenanceQuantity,
            'maintenanceQuantity',
          ),
          notes: this.normalizeNullable(input.notes),
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.mapResource(created);
    } catch (error) {
      this.handleUniqueError(error, {
        Resource_organizationId_sku_key:
          'A resource with this SKU already exists in the organization',
        Resource_organizationId_barcode_key:
          'A resource with this barcode already exists in the organization',
      });
      throw error;
    }
  }

  async updateResource(input: UpdateResourceInput): Promise<ResourceRecord> {
    const existing = await this.prisma.resource.findUnique({
      where: { id: input.resourceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Resource with id ${input.resourceId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      input.actorUserId,
      existing.organizationId,
      'Edit',
    );

    if (input.locationId) {
      await this.ensureLocationOwnership(
        input.locationId,
        existing.organizationId,
      );
    }

    if (input.supplierId) {
      await this.ensureSupplierOwnership(
        input.supplierId,
        existing.organizationId,
      );
    }

    this.validateTotalQuantity(
      input.quantityMode ?? existing.quantityMode,
      input.totalQuantity === undefined
        ? existing.totalQuantity
        : input.totalQuantity,
    );

    try {
      const updated = await this.prisma.resource.update({
        where: { id: existing.id },
        data: {
          ...(input.supplierId === undefined
            ? {}
            : { supplierId: input.supplierId }),
          ...(input.name === undefined ? {} : { name: input.name.trim() }),
          ...(input.description === undefined
            ? {}
            : { description: this.normalizeNullable(input.description) }),
          ...(input.category === undefined
            ? {}
            : { category: input.category.trim() }),
          ...(input.tags === undefined
            ? {}
            : { tags: this.normalizeStringArray(input.tags) }),
          ...(input.keywords === undefined
            ? {}
            : { keywords: this.normalizeStringArray(input.keywords) }),
          ...(input.aiSummary === undefined
            ? {}
            : { aiSummary: this.normalizeNullable(input.aiSummary) }),
          ...(input.searchPhrases === undefined
            ? {}
            : {
                searchPhrases: this.normalizeStringArray(input.searchPhrases),
              }),
          ...(input.imageUrls === undefined
            ? {}
            : { imageUrls: this.normalizeImageUrls(input.imageUrls) }),
          ...(input.resourceType === undefined
            ? {}
            : { resourceType: input.resourceType }),
          ...(input.quantityMode === undefined
            ? {}
            : { quantityMode: input.quantityMode }),
          ...(input.sku === undefined
            ? {}
            : { sku: this.normalizeNullable(input.sku) }),
          ...(input.barcode === undefined
            ? {}
            : { barcode: this.normalizeNullable(input.barcode) }),
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.visibility === undefined
            ? {}
            : { visibility: input.visibility }),
          ...(input.unit === undefined ? {} : { unit: input.unit.trim() }),
          ...(input.totalQuantity === undefined
            ? {}
            : {
                totalQuantity: this.normalizeQuantityNullable(
                  input.totalQuantity,
                ),
              }),
          ...(input.condition === undefined
            ? {}
            : { condition: input.condition }),
          ...(input.locationId === undefined
            ? {}
            : { locationId: input.locationId }),
          ...(input.purchaseValue === undefined
            ? {}
            : {
                purchaseValue: this.normalizeMoneyNullable(input.purchaseValue),
              }),
          ...(input.replacementValue === undefined
            ? {}
            : {
                replacementValue: this.normalizeMoneyNullable(
                  input.replacementValue,
                ),
              }),
          ...(input.rentalPrice === undefined
            ? {}
            : {
                rentalPrice: this.normalizeMoneyNullable(input.rentalPrice),
              }),
          ...(input.damagedQuantity === undefined
            ? {}
            : {
                damagedQuantity: this.normalizeNonNegativeQuantity(
                  input.damagedQuantity,
                  'damagedQuantity',
                ),
              }),
          ...(input.maintenanceQuantity === undefined
            ? {}
            : {
                maintenanceQuantity: this.normalizeNonNegativeQuantity(
                  input.maintenanceQuantity,
                  'maintenanceQuantity',
                ),
              }),
          ...(input.notes === undefined
            ? {}
            : { notes: this.normalizeNullable(input.notes) }),
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.mapResource(updated);
    } catch (error) {
      this.handleUniqueError(error, {
        Resource_organizationId_sku_key:
          'A resource with this SKU already exists in the organization',
        Resource_organizationId_barcode_key:
          'A resource with this barcode already exists in the organization',
      });
      throw error;
    }
  }

  async archiveResource(input: ArchiveResourceInput): Promise<ResourceRecord> {
    const existing = await this.prisma.resource.findUnique({
      where: { id: input.resourceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Resource with id ${input.resourceId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      input.actorUserId,
      existing.organizationId,
      'Edit',
    );

    const updated = await this.prisma.resource.update({
      where: { id: existing.id },
      data: {
        archivedAt: existing.archivedAt ? existing.archivedAt : new Date(),
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapResource(updated);
  }

  async restoreResource(input: RestoreResourceInput): Promise<ResourceRecord> {
    const existing = await this.prisma.resource.findUnique({
      where: { id: input.resourceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Resource with id ${input.resourceId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      input.actorUserId,
      existing.organizationId,
      'Edit',
    );

    const updated = await this.prisma.resource.update({
      where: { id: existing.id },
      data: { archivedAt: null },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapResource(updated);
  }

  async searchResources(
    input: SearchResourcesInput,
  ): Promise<ResourceSearchResult> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const tagTokens = this.parseSearchTokens(input.tags);
    const keywordTokens = this.parseSearchTokens(input.keywords);

    const where: Prisma.ResourceWhereInput = {
      organizationId: input.organizationId,
      ...(input.includeArchived ? {} : { archivedAt: null }),
      ...(input.category
        ? {
            category: {
              contains: input.category,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(input.query
        ? {
            OR: [
              {
                name: {
                  contains: input.query,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: input.query,
                  mode: 'insensitive',
                },
              },
              {
                aiSummary: {
                  contains: input.query,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: input.query,
                  mode: 'insensitive',
                },
              },
              {
                barcode: {
                  contains: input.query,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  has: input.query,
                },
              },
              {
                keywords: {
                  has: input.query,
                },
              },
              {
                searchPhrases: {
                  has: input.query,
                },
              },
            ],
          }
        : {}),
      ...(tagTokens.length > 0
        ? {
            tags: {
              hasSome: tagTokens,
            },
          }
        : {}),
      ...(keywordTokens.length > 0
        ? {
            keywords: {
              hasSome: keywordTokens,
            },
          }
        : {}),
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
      ...(input.resourceType ? { resourceType: input.resourceType } : {}),
      ...(input.quantityMode ? { quantityMode: input.quantityMode } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.resource.findMany({
        where,
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapResource(row)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getResource(input: GetResourceInput): Promise<ResourceRecord> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: input.resourceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(
        `Resource with id ${input.resourceId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      input.actorUserId,
      resource.organizationId,
      'View',
    );

    return this.mapResource(resource);
  }

  async checkAvailability(
    input: CheckAvailabilityInput,
  ): Promise<ResourceAvailabilitySnapshot> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const start = this.parseIsoDate(input.startDateTime, 'startDateTime');
    const end = this.parseIsoDate(input.endDateTime, 'endDateTime');
    this.assertValidWindow(start, end);

    const resource = await this.findResourceInOrganization(
      input.resourceId,
      input.organizationId,
    );

    return this.computeAvailability(
      this.prisma,
      resource,
      start,
      end,
      input.quantity,
    );
  }

  async createReservation(
    input: CreateReservationInput,
  ): Promise<ResourceReservationRecord> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'Create',
    );

    const start = this.parseIsoDate(input.startDateTime, 'startDateTime');
    const end = this.parseIsoDate(input.endDateTime, 'endDateTime');
    this.assertValidWindow(start, end);

    if (input.quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const resource = await this.findResourceInOrganization(
          input.resourceId,
          input.organizationId,
          tx,
        );

        if (resource.archivedAt) {
          throw new BadRequestException(
            'Archived resources cannot receive new reservations',
          );
        }

        await this.ensureReservationSourceOwnership(
          tx,
          resource.organizationId,
          input.sourceType,
          input.sourceId,
        );

        await this.lockResource(tx, resource.organizationId, resource.id);

        const targetStatus = input.status ?? ResourceReservationStatus.PENDING;

        if (this.statusConsumesCapacity(targetStatus)) {
          const snapshot = await this.computeAvailability(
            tx,
            resource,
            start,
            end,
            input.quantity,
          );

          if (!snapshot.canFulfill) {
            throw this.toReservationConflict(snapshot);
          }
        }

        const created = await tx.resourceReservation.create({
          data: {
            organizationId: resource.organizationId,
            resourceId: resource.id,
            sourceType: input.sourceType,
            sourceId: input.sourceId.trim(),
            quantity: input.quantity,
            startDateTime: start,
            endDateTime: end,
            status: targetStatus,
            notes: this.normalizeNullable(input.notes),
          },
        });

        return this.mapReservation(created);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async updateReservation(
    input: UpdateReservationInput,
  ): Promise<ResourceReservationRecord> {
    const existing = await this.prisma.resourceReservation.findUnique({
      where: { id: input.reservationId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Reservation with id ${input.reservationId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      input.actorUserId,
      existing.organizationId,
      'Edit',
    );

    return this.prisma.$transaction(
      async (tx) => {
        await this.lockResource(
          tx,
          existing.organizationId,
          existing.resourceId,
        );

        const current = await tx.resourceReservation.findUnique({
          where: { id: existing.id },
        });

        if (!current) {
          throw new NotFoundException(
            `Reservation with id ${input.reservationId} not found`,
          );
        }

        const resource = await this.findResourceInOrganization(
          current.resourceId,
          current.organizationId,
          tx,
        );

        const nextStart = input.startDateTime
          ? this.parseIsoDate(input.startDateTime, 'startDateTime')
          : current.startDateTime;
        const nextEnd = input.endDateTime
          ? this.parseIsoDate(input.endDateTime, 'endDateTime')
          : current.endDateTime;
        this.assertValidWindow(nextStart, nextEnd);

        const nextQuantity = input.quantity ?? current.quantity;
        if (nextQuantity <= 0) {
          throw new BadRequestException('quantity must be greater than zero');
        }

        const nextStatus = input.status ?? current.status;

        if (this.statusConsumesCapacity(nextStatus)) {
          const snapshot = await this.computeAvailability(
            tx,
            resource,
            nextStart,
            nextEnd,
            nextQuantity,
            current.id,
          );

          if (!snapshot.canFulfill) {
            throw this.toReservationConflict(snapshot);
          }
        }

        const updated = await tx.resourceReservation.update({
          where: { id: current.id },
          data: {
            ...(input.quantity === undefined ? {} : { quantity: nextQuantity }),
            ...(input.startDateTime === undefined
              ? {}
              : { startDateTime: nextStart }),
            ...(input.endDateTime === undefined
              ? {}
              : { endDateTime: nextEnd }),
            ...(input.status === undefined ? {} : { status: nextStatus }),
            ...(input.notes === undefined
              ? {}
              : { notes: this.normalizeNullable(input.notes) }),
          },
        });

        return this.mapReservation(updated);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async confirmReservation(
    input: ConfirmReservationInput,
  ): Promise<ResourceReservationRecord> {
    return this.transitionReservationWithCapacityCheck(
      input.actorUserId,
      input.reservationId,
      ResourceReservationStatus.CONFIRMED,
      input.notes,
    );
  }

  async releaseReservation(
    input: ReleaseReservationInput,
  ): Promise<ResourceReservationRecord> {
    return this.transitionReservationWithoutCapacityCheck(
      input.actorUserId,
      input.reservationId,
      ResourceReservationStatus.RELEASED,
      input.notes,
    );
  }

  async cancelReservation(
    input: CancelReservationInput,
  ): Promise<ResourceReservationRecord> {
    return this.transitionReservationWithoutCapacityCheck(
      input.actorUserId,
      input.reservationId,
      ResourceReservationStatus.CANCELLED,
      input.notes,
    );
  }

  async getReservationsForResource(
    input: GetReservationsForResourceInput,
  ): Promise<ResourceReservationRecord[]> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const resource = await this.findResourceInOrganization(
      input.resourceId,
      input.organizationId,
    );

    const from = input.from ? this.parseIsoDate(input.from, 'from') : null;
    const to = input.to ? this.parseIsoDate(input.to, 'to') : null;

    if (from && to) {
      this.assertValidWindow(from, to);
    }

    const rows = await this.prisma.resourceReservation.findMany({
      where: {
        organizationId: input.organizationId,
        resourceId: resource.id,
        ...(from || to
          ? {
              AND: [
                ...(to ? [{ startDateTime: { lt: to } }] : []),
                ...(from ? [{ endDateTime: { gt: from } }] : []),
              ],
            }
          : {}),
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return rows.map((row) => this.mapReservation(row));
  }

  async getReservationsForSource(
    input: GetReservationsForSourceInput,
  ): Promise<ResourceReservationRecord[]> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const rows = await this.prisma.resourceReservation.findMany({
      where: {
        organizationId: input.organizationId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return rows.map((row) => this.mapReservation(row));
  }

  async getAvailabilityCalendar(
    input: GetAvailabilityCalendarInput,
  ): Promise<AvailabilityCalendarResult> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const start = this.parseIsoDate(input.from, 'from');
    const end = this.parseIsoDate(input.to, 'to');
    this.assertValidWindow(start, end);

    const resource = await this.findResourceInOrganization(
      input.resourceId,
      input.organizationId,
    );

    const reservations = await this.prisma.resourceReservation.findMany({
      where: {
        organizationId: resource.organizationId,
        resourceId: resource.id,
        status: {
          in: CAPACITY_CONSUMING_STATUSES,
        },
        startDateTime: { lt: end },
        endDateTime: { gt: start },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const entries = reservations.map((reservation) => {
      const reservedQuantity = reservation.quantity;
      const availableQuantity =
        resource.quantityMode === ResourceQuantityMode.UNLIMITED
          ? null
          : Math.max((resource.totalQuantity ?? 0) - reservedQuantity, 0);

      return {
        startDateTime: reservation.startDateTime.toISOString(),
        endDateTime: reservation.endDateTime.toISOString(),
        reservedQuantity,
        availableQuantity,
      };
    });

    return {
      resourceId: resource.id,
      quantityMode: resource.quantityMode,
      from: start.toISOString(),
      to: end.toISOString(),
      entries,
    };
  }

  async reserveResourcesForEvent(
    input: ReserveResourcesForEventInput,
  ): Promise<ReserveResourcesForEventResult> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'Create',
    );

    if (!input.requests.length) {
      throw new BadRequestException(
        'At least one resource request is required',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: input.eventId },
          select: {
            id: true,
            organizationId: true,
            startDateTime: true,
            endDateTime: true,
          },
        });

        if (!event) {
          throw new NotFoundException(
            `Event with id ${input.eventId} not found`,
          );
        }

        if (event.organizationId !== input.organizationId) {
          throw new ForbiddenException('Event is outside this organization');
        }

        const allocations: EventResourceAllocationRecord[] = [];
        const outstandings: EventResourceOutstandingRecord[] = [];

        for (const request of input.requests) {
          if (request.quantity <= 0) {
            throw new BadRequestException('quantity must be greater than zero');
          }

          const resource = await this.findResourceInOrganization(
            request.resourceId,
            input.organizationId,
            tx,
          );

          if (resource.archivedAt) {
            throw new BadRequestException(
              `Resource ${request.resourceId} is archived and cannot be allocated`,
            );
          }

          await this.lockResource(tx, input.organizationId, resource.id);

          const reservedDate = request.reservedDate
            ? this.parseIsoDate(request.reservedDate, 'reservedDate')
            : event.startDateTime;
          const expectedReturnDate = request.expectedReturnDate
            ? this.parseIsoDate(
                request.expectedReturnDate,
                'expectedReturnDate',
              )
            : event.endDateTime;

          this.assertValidWindow(reservedDate, expectedReturnDate);

          const availability = await this.computeAvailability(
            tx,
            resource,
            reservedDate,
            expectedReturnDate,
            request.quantity,
          );

          const availableQuantity =
            availability.availableQuantity ?? request.quantity;
          const canFulfill = availability.canFulfill;
          const allowPartial = request.allowPartial ?? false;

          if (!canFulfill && !allowPartial) {
            throw this.toReservationConflict(availability);
          }

          const quantityReserved = canFulfill
            ? request.quantity
            : Math.max(Math.min(availableQuantity, request.quantity), 0);

          let reservationId: string | null = null;

          if (quantityReserved > 0) {
            const reservation = await tx.resourceReservation.create({
              data: {
                organizationId: input.organizationId,
                resourceId: resource.id,
                sourceType: ResourceReservationSourceType.EVENT,
                sourceId: input.eventId,
                quantity: quantityReserved,
                startDateTime: reservedDate,
                endDateTime: expectedReturnDate,
                status: ResourceReservationStatus.RESERVED,
                notes: this.normalizeNullable(request.notes),
              },
            });

            reservationId = reservation.id;
          }

          const allocation = await tx.eventResourceAllocation.create({
            data: {
              organizationId: input.organizationId,
              eventId: input.eventId,
              resourceId: resource.id,
              resourceReservationId: reservationId,
              quantityRequested: request.quantity,
              quantityReserved,
              reservedDate,
              expectedReturnDate,
              status: EventResourceAllocationStatus.Reserved,
              createdByUserId: input.actorUserId,
              updatedByUserId: input.actorUserId,
              notes: this.normalizeNullable(request.notes),
            },
          });

          allocations.push(this.mapEventAllocation(allocation));

          const outstandingQuantity = Math.max(
            request.quantity - quantityReserved,
            0,
          );

          if (outstandingQuantity > 0) {
            const outstanding = await tx.eventResourceOutstanding.create({
              data: {
                organizationId: input.organizationId,
                eventId: input.eventId,
                resourceId: resource.id,
                allocationId: allocation.id,
                requestedQuantity: request.quantity,
                reservedQuantity: quantityReserved,
                outstandingQuantity,
                status: EventResourceOutstandingStatus.Open,
                createdByUserId: input.actorUserId,
                notes: this.normalizeNullable(request.notes),
              },
            });

            outstandings.push(this.mapEventOutstanding(outstanding));
          }
        }

        return {
          allocations,
          outstandings,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async getEventResourceAllocations(
    input: GetEventResourceAllocationsInput,
  ): Promise<EventResourceAllocationRecord[]> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    await this.ensureEventOwnership(input.eventId, input.organizationId);

    const rows = await this.prisma.eventResourceAllocation.findMany({
      where: {
        organizationId: input.organizationId,
        eventId: input.eventId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return rows.map((row) => this.mapEventAllocation(row));
  }

  async getResourceAllocationHistory(
    input: GetResourceAllocationHistoryInput,
  ): Promise<EventResourceAllocationRecord[]> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    await this.findResourceInOrganization(
      input.resourceId,
      input.organizationId,
    );

    const rows = await this.prisma.eventResourceAllocation.findMany({
      where: {
        organizationId: input.organizationId,
        resourceId: input.resourceId,
      },
      orderBy: {
        reservedDate: 'desc',
      },
    });

    return rows.map((row) => this.mapEventAllocation(row));
  }

  async getResourceAvailabilitySummary(
    input: GetResourceAvailabilitySummaryInput,
  ): Promise<ResourceAvailabilitySummary> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'View',
    );

    const resource = await this.findResourceInOrganization(
      input.resourceId,
      input.organizationId,
    );

    const [reservations, losses] = await this.prisma.$transaction([
      this.prisma.resourceReservation.findMany({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          status: {
            in: CAPACITY_CONSUMING_STATUSES,
          },
        },
        select: {
          quantity: true,
        },
      }),
      this.prisma.eventResourceAllocation.aggregate({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
        },
        _sum: {
          quantityLost: true,
        },
      }),
    ]);

    const totalQuantity = resource.totalQuantity ?? 0;
    const reservedQuantity = reservations.reduce(
      (sum, reservation) => sum + reservation.quantity,
      0,
    );
    const lostQuantity = losses._sum.quantityLost ?? 0;

    return {
      resourceId: resource.id,
      totalQuantity,
      reservedQuantity,
      lostQuantity,
      availableQuantity: Math.max(
        totalQuantity - reservedQuantity - lostQuantity,
        0,
      ),
    };
  }

  async releaseEventAllocations(
    input: ReleaseEventAllocationsInput,
  ): Promise<EventResourceAllocationRecord[]> {
    await this.ensureOrganizationPermission(
      input.actorUserId,
      input.organizationId,
      'Edit',
    );

    await this.ensureEventOwnership(input.eventId, input.organizationId);

    return this.prisma.$transaction(
      async (tx) => {
        const allocations = await tx.eventResourceAllocation.findMany({
          where: {
            organizationId: input.organizationId,
            eventId: input.eventId,
            status: {
              notIn: [
                EventResourceAllocationStatus.Cancelled,
                EventResourceAllocationStatus.Returned,
              ],
            },
          },
        });

        const nextStatus =
          input.reason === 'Cancelled'
            ? EventResourceAllocationStatus.Cancelled
            : EventResourceAllocationStatus.Returned;
        const reservationStatus =
          input.reason === 'Cancelled'
            ? ResourceReservationStatus.CANCELLED
            : ResourceReservationStatus.RELEASED;
        const now = new Date();

        const released: EventResourceAllocationRecord[] = [];

        for (const allocation of allocations) {
          await this.lockResource(
            tx,
            input.organizationId,
            allocation.resourceId,
          );

          if (allocation.resourceReservationId) {
            await tx.resourceReservation.update({
              where: { id: allocation.resourceReservationId },
              data: {
                status: reservationStatus,
                notes: `Auto-${input.reason.toLowerCase()} via event lifecycle`,
              },
            });
          }

          const updated = await tx.eventResourceAllocation.update({
            where: { id: allocation.id },
            data: {
              status: nextStatus,
              actualReturnDate: now,
              quantityReturned:
                input.reason === 'Completed'
                  ? allocation.quantityReserved
                  : allocation.quantityReturned,
              updatedByUserId: input.actorUserId,
            },
          });

          released.push(this.mapEventAllocation(updated));
        }

        await tx.eventResourceOutstanding.updateMany({
          where: {
            organizationId: input.organizationId,
            eventId: input.eventId,
            status: EventResourceOutstandingStatus.Open,
          },
          data: {
            status: EventResourceOutstandingStatus.Cancelled,
          },
        });

        return released;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async transitionReservationWithCapacityCheck(
    actorUserId: string,
    reservationId: string,
    targetStatus: ResourceReservationStatus,
    notes?: string,
  ) {
    const existing = await this.prisma.resourceReservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Reservation with id ${reservationId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      actorUserId,
      existing.organizationId,
      'Edit',
    );

    return this.prisma.$transaction(
      async (tx) => {
        await this.lockResource(
          tx,
          existing.organizationId,
          existing.resourceId,
        );

        const current = await tx.resourceReservation.findUnique({
          where: { id: existing.id },
        });

        if (!current) {
          throw new NotFoundException(
            `Reservation with id ${reservationId} not found`,
          );
        }

        const resource = await this.findResourceInOrganization(
          current.resourceId,
          current.organizationId,
          tx,
        );

        const snapshot = await this.computeAvailability(
          tx,
          resource,
          current.startDateTime,
          current.endDateTime,
          current.quantity,
          current.id,
        );

        if (!snapshot.canFulfill) {
          throw this.toReservationConflict(snapshot);
        }

        const updated = await tx.resourceReservation.update({
          where: { id: current.id },
          data: {
            status: targetStatus,
            ...(notes ? { notes: notes.trim() } : {}),
          },
        });

        return this.mapReservation(updated);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async transitionReservationWithoutCapacityCheck(
    actorUserId: string,
    reservationId: string,
    targetStatus: ResourceReservationStatus,
    notes?: string,
  ) {
    const existing = await this.prisma.resourceReservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Reservation with id ${reservationId} not found`,
      );
    }

    await this.ensureOrganizationPermission(
      actorUserId,
      existing.organizationId,
      'Edit',
    );

    const updated = await this.prisma.resourceReservation.update({
      where: { id: existing.id },
      data: {
        status: targetStatus,
        ...(notes ? { notes: notes.trim() } : {}),
      },
    });

    return this.mapReservation(updated);
  }

  private async computeAvailability(
    prismaClient: Prisma.TransactionClient | PrismaService,
    resource: {
      id: string;
      organizationId: string;
      quantityMode: ResourceQuantityMode;
      totalQuantity: number | null;
      status: ResourceStatus;
      condition: ResourceCondition;
      archivedAt: Date | null;
    },
    startDateTime: Date,
    endDateTime: Date,
    requestedQuantity: number,
    excludeReservationId?: string,
  ): Promise<ResourceAvailabilitySnapshot> {
    if (resource.archivedAt) {
      return {
        resourceId: resource.id,
        quantityMode: resource.quantityMode,
        requestable: false,
        confirmationRequired: true,
        requestedQuantity,
        availableQuantity: 0,
        reservedQuantity: 0,
        canFulfill: false,
        conflict: {
          requestedQuantity,
          availableQuantity: 0,
          shortageQuantity: requestedQuantity,
          conflictingReservationIds: [],
          conflictStartDateTime: startDateTime.toISOString(),
          conflictEndDateTime: endDateTime.toISOString(),
          earliestNextAvailability: null,
        },
      };
    }

    if (resource.quantityMode === ResourceQuantityMode.UNLIMITED) {
      return {
        resourceId: resource.id,
        quantityMode:
          resource.quantityMode as ResourceAvailabilitySnapshot['quantityMode'],
        requestable: true,
        confirmationRequired: true,
        requestedQuantity,
        availableQuantity: null,
        reservedQuantity: null,
        canFulfill: true,
        conflict: null,
      };
    }

    if (
      resource.quantityMode === ResourceQuantityMode.SERIALIZED &&
      requestedQuantity !== 1
    ) {
      throw new BadRequestException(
        'SERIALIZED resources require quantity exactly equal to 1',
      );
    }

    const overlaps = await prismaClient.resourceReservation.findMany({
      where: {
        organizationId: resource.organizationId,
        resourceId: resource.id,
        status: {
          in: CAPACITY_CONSUMING_STATUSES,
        },
        startDateTime: { lt: endDateTime },
        endDateTime: { gt: startDateTime },
        ...(excludeReservationId
          ? {
              id: {
                not: excludeReservationId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        quantity: true,
        startDateTime: true,
        endDateTime: true,
      },
    });

    const reservedQuantity = overlaps.reduce(
      (sum, row) => sum + row.quantity,
      0,
    );

    const totalQuantity = resource.totalQuantity ?? 0;

    const operationalUnavailable =
      resource.status === ResourceStatus.DISPATCHED ||
      resource.status === ResourceStatus.MAINTENANCE ||
      resource.status === ResourceStatus.RETIRED ||
      resource.condition === ResourceCondition.DAMAGED ||
      resource.condition === ResourceCondition.RETIRED
        ? totalQuantity
        : 0;

    const availableQuantity = Math.max(
      totalQuantity - reservedQuantity - operationalUnavailable,
      0,
    );

    const canFulfill = requestedQuantity <= availableQuantity;

    const conflictStartDateTime = overlaps.length
      ? overlaps
          .map((row) => row.startDateTime)
          .sort((a, b) => a.getTime() - b.getTime())[0]
      : startDateTime;

    const conflictEndDateTime = overlaps.length
      ? overlaps
          .map((row) => row.endDateTime)
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : endDateTime;

    const earliestNextAvailability = overlaps.length
      ? overlaps
          .map((row) => row.endDateTime)
          .sort((a, b) => a.getTime() - b.getTime())[0]
          .toISOString()
      : null;

    return {
      resourceId: resource.id,
      quantityMode:
        resource.quantityMode as ResourceAvailabilitySnapshot['quantityMode'],
      requestable: true,
      confirmationRequired: false,
      requestedQuantity,
      availableQuantity,
      reservedQuantity,
      canFulfill,
      conflict: canFulfill
        ? null
        : {
            requestedQuantity,
            availableQuantity,
            shortageQuantity: Math.max(
              requestedQuantity - availableQuantity,
              0,
            ),
            conflictingReservationIds: overlaps.map((row) => row.id),
            conflictStartDateTime: conflictStartDateTime.toISOString(),
            conflictEndDateTime: conflictEndDateTime.toISOString(),
            earliestNextAvailability,
          },
    };
  }

  private async lockResource(
    prismaClient: Prisma.TransactionClient,
    organizationId: string,
    resourceId: string,
  ) {
    // Concurrency strategy: serialize competing reservations per resource
    // inside a DB transaction using PostgreSQL advisory transaction locks.
    const lockKey = `resource-reservation:${organizationId}:${resourceId}`;
    await prismaClient.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
  }

  private async ensureReservationSourceOwnership(
    prismaClient: Prisma.TransactionClient,
    organizationId: string,
    sourceType: ResourceReservationSourceType,
    sourceId: string,
  ) {
    if (!sourceId.trim()) {
      throw new BadRequestException('sourceId is required');
    }

    if (sourceType === ResourceReservationSourceType.EVENT) {
      const event = await prismaClient.event.findUnique({
        where: { id: sourceId },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!event) {
        throw new BadRequestException('Event source was not found');
      }

      if (event.organizationId !== organizationId) {
        throw new ForbiddenException(
          'Event source is outside this organization',
        );
      }
    }

    if (sourceType === ResourceReservationSourceType.INTERNAL_JOB) {
      const task = await prismaClient.task.findUnique({
        where: { id: sourceId },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!task) {
        throw new BadRequestException('Internal job source was not found');
      }

      if (task.organizationId !== organizationId) {
        throw new ForbiddenException(
          'Internal job source is outside this organization',
        );
      }
    }
  }

  private async ensureEventOwnership(eventId: string, organizationId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Event is outside this organization');
    }
  }

  private async findResourceInOrganization(
    resourceId: string,
    organizationId: string,
    prismaClient: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const resource = await prismaClient.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        organizationId: true,
        quantityMode: true,
        totalQuantity: true,
        status: true,
        condition: true,
        archivedAt: true,
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with id ${resourceId} not found`);
    }

    if (resource.organizationId !== organizationId) {
      throw new ForbiddenException('Resource is outside this organization');
    }

    return resource;
  }

  private statusConsumesCapacity(status: ResourceReservationStatus) {
    return CAPACITY_CONSUMING_STATUSES.includes(status);
  }

  private toReservationConflict(snapshot: ResourceAvailabilitySnapshot) {
    if (!snapshot.conflict) {
      return new ConflictException('Reservation conflict');
    }

    return new ConflictException({
      message: 'Reservation conflict',
      requestedQuantity: snapshot.conflict.requestedQuantity,
      availableQuantity: snapshot.conflict.availableQuantity,
      shortageQuantity: snapshot.conflict.shortageQuantity,
      conflictingReservationIds: snapshot.conflict.conflictingReservationIds,
      conflictStartDateTime: snapshot.conflict.conflictStartDateTime,
      conflictEndDateTime: snapshot.conflict.conflictEndDateTime,
      earliestNextAvailability: snapshot.conflict.earliestNextAvailability,
    });
  }

  private mapResource(row: {
    id: string;
    organizationId: string;
    supplierId: string | null;
    name: string;
    description: string | null;
    category: string;
    tags: string[];
    keywords: string[];
    aiSummary: string | null;
    searchPhrases: string[];
    imageUrls: string[];
    resourceType: string;
    quantityMode: string;
    sku: string | null;
    barcode: string | null;
    status: string;
    visibility: string;
    unit: string;
    totalQuantity: number | null;
    condition: string;
    locationId: string | null;
    purchaseValue: number | null;
    replacementValue: number | null;
    rentalPrice: number | null;
    damagedQuantity: number;
    maintenanceQuantity: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
    location?: {
      id: string;
      name: string;
    } | null;
  }): ResourceRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      supplierId: row.supplierId,
      name: row.name,
      description: row.description,
      category: row.category,
      tags: row.tags,
      keywords: row.keywords,
      aiSummary: row.aiSummary,
      searchPhrases: row.searchPhrases,
      imageUrls: row.imageUrls,
      resourceType: row.resourceType as ResourceRecord['resourceType'],
      quantityMode: row.quantityMode as ResourceRecord['quantityMode'],
      sku: row.sku,
      barcode: row.barcode,
      status: row.status as ResourceRecord['status'],
      visibility: row.visibility as ResourceRecord['visibility'],
      unit: row.unit,
      totalQuantity: row.totalQuantity,
      condition: row.condition as ResourceRecord['condition'],
      locationId: row.locationId,
      locationName: row.location?.name ?? null,
      purchaseValue: row.purchaseValue,
      replacementValue: row.replacementValue,
      rentalPrice: row.rentalPrice,
      damagedQuantity: row.damagedQuantity,
      maintenanceQuantity: row.maintenanceQuantity,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    };
  }

  private mapReservation(row: {
    id: string;
    organizationId: string;
    resourceId: string;
    sourceType: string;
    sourceId: string;
    quantity: number;
    startDateTime: Date;
    endDateTime: Date;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ResourceReservationRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      resourceId: row.resourceId,
      sourceType: row.sourceType as ResourceReservationRecord['sourceType'],
      sourceId: row.sourceId,
      quantity: row.quantity,
      startDateTime: row.startDateTime.toISOString(),
      endDateTime: row.endDateTime.toISOString(),
      status: row.status as ResourceReservationRecord['status'],
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapEventAllocation(row: {
    id: string;
    eventId: string;
    resourceId: string;
    organizationId: string;
    resourceReservationId: string | null;
    quantityRequested: number;
    quantityReserved: number;
    quantityReturned: number;
    quantityDamaged: number;
    quantityLost: number;
    reservedDate: Date;
    expectedReturnDate: Date | null;
    actualReturnDate: Date | null;
    status: string;
    createdByUserId: string;
    updatedByUserId: string;
    createdAt: Date;
    updatedAt: Date;
  }): EventResourceAllocationRecord {
    return {
      id: row.id,
      eventId: row.eventId,
      resourceId: row.resourceId,
      organizationId: row.organizationId,
      resourceReservationId: row.resourceReservationId,
      quantityRequested: row.quantityRequested,
      quantityReserved: row.quantityReserved,
      quantityReturned: row.quantityReturned,
      quantityDamaged: row.quantityDamaged,
      quantityLost: row.quantityLost,
      reservedDate: row.reservedDate.toISOString(),
      expectedReturnDate: row.expectedReturnDate
        ? row.expectedReturnDate.toISOString()
        : null,
      actualReturnDate: row.actualReturnDate
        ? row.actualReturnDate.toISOString()
        : null,
      status: row.status as EventResourceAllocationRecord['status'],
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapEventOutstanding(row: {
    id: string;
    eventId: string;
    resourceId: string;
    allocationId: string | null;
    organizationId: string;
    requestedQuantity: number;
    reservedQuantity: number;
    outstandingQuantity: number;
    status: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
  }): EventResourceOutstandingRecord {
    return {
      id: row.id,
      eventId: row.eventId,
      resourceId: row.resourceId,
      allocationId: row.allocationId,
      organizationId: row.organizationId,
      requestedQuantity: row.requestedQuantity,
      reservedQuantity: row.reservedQuantity,
      outstandingQuantity: row.outstandingQuantity,
      status: row.status as EventResourceOutstandingRecord['status'],
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private parseIsoDate(value: string, field: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO datetime`);
    }
    return parsed;
  }

  private assertValidWindow(startDateTime: Date, endDateTime: Date) {
    if (startDateTime.getTime() >= endDateTime.getTime()) {
      throw new BadRequestException(
        'startDateTime must be before endDateTime for half-open intervals',
      );
    }
  }

  private validateTotalQuantity(
    quantityMode: ResourceQuantityMode,
    totalQuantity: number | null | undefined,
  ) {
    if (quantityMode === ResourceQuantityMode.UNLIMITED) {
      return;
    }

    if (totalQuantity === null || totalQuantity === undefined) {
      throw new BadRequestException(
        `totalQuantity is required for ${quantityMode} resources`,
      );
    }

    if (totalQuantity < 0) {
      throw new BadRequestException('totalQuantity cannot be negative');
    }
  }

  private normalizeNullable(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeMoneyNullable(value?: number | null) {
    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException('Monetary values must be non-negative');
    }

    return Number(value);
  }

  private normalizeQuantityNullable(value?: number | null) {
    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException('totalQuantity must be non-negative');
    }

    return Number(value);
  }

  private normalizeNonNegativeQuantity(
    value: number | undefined,
    field: string,
  ) {
    if (value === undefined) {
      return 0;
    }

    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${field} must be non-negative`);
    }

    return Number(value);
  }

  private normalizeStringArray(values?: string[]) {
    if (!values || values.length === 0) {
      return [];
    }

    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return Array.from(new Set(normalized));
  }

  private normalizeImageUrls(values?: string[]) {
    if (!values || values.length === 0) {
      return [];
    }

    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (normalized.length > 5) {
      throw new BadRequestException(
        'imageUrls cannot contain more than 5 URLs',
      );
    }

    return Array.from(new Set(normalized));
  }

  private parseSearchTokens(value?: string) {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private async ensureLocationOwnership(
    locationId: string,
    organizationId: string,
  ) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!location) {
      throw new BadRequestException('Storage location not found');
    }

    if (location.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Storage location is outside this organization',
      );
    }
  }

  private async ensureSupplierOwnership(
    supplierId: string,
    organizationId: string,
  ) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    if (supplier.organizationId !== organizationId) {
      throw new ForbiddenException('Supplier is outside this organization');
    }
  }

  private async ensureOrganizationPermission(
    userId: string,
    organizationId: string,
    action: PermissionAction,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const normalizedRole = membership.role.trim().toLowerCase();

    if (normalizedRole === 'owner' || normalizedRole === 'administrator') {
      return;
    }

    const role = await this.prisma.role.findFirst({
      where: {
        organizationId,
        name: membership.role,
      },
      select: {
        permissions: true,
      },
    });

    if (!role) {
      throw new ForbiddenException('No role permissions found for this user');
    }

    let permissions: RolePermissionMap = {};

    try {
      permissions = JSON.parse(role.permissions) as RolePermissionMap;
    } catch {
      permissions = {};
    }

    const allowed = Boolean(permissions.Resource?.[action]);

    if (!allowed) {
      throw new ForbiddenException(`Missing Resource ${action} permission`);
    }
  }

  private handleUniqueError(error: unknown, messages: Record<string, string>) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const rawTarget = error.meta?.target;
      const target = Array.isArray(rawTarget)
        ? rawTarget
            .filter((value): value is string => typeof value === 'string')
            .join('_')
        : typeof rawTarget === 'string'
          ? rawTarget
          : '';

      const message = messages[target];

      if (message) {
        throw new BadRequestException(message);
      }

      throw new BadRequestException('A unique field value already exists');
    }
  }
}

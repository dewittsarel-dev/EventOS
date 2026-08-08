/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  EventResourceAllocationStatus,
  EventResourceOutstandingStatus,
  ResourceQuantityMode,
  ResourceReservationStatus,
  ResourceStatus,
} from '@prisma/client';
import { ResourceEngineService } from './resource-engine.service';

type ResourceRow = {
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
  quantityMode: ResourceQuantityMode;
  sku: string | null;
  barcode: string | null;
  status: ResourceStatus;
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
};

type ReservationRow = {
  id: string;
  organizationId: string;
  resourceId: string;
  sourceType: string;
  sourceId: string;
  quantity: number;
  startDateTime: Date;
  endDateTime: Date;
  status: ResourceReservationStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventAllocationRow = {
  id: string;
  organizationId: string;
  eventId: string;
  resourceId: string;
  resourceReservationId: string | null;
  quantityRequested: number;
  quantityReserved: number;
  quantityReturned: number;
  quantityDamaged: number;
  quantityLost: number;
  reservedDate: Date;
  expectedReturnDate: Date | null;
  actualReturnDate: Date | null;
  status: EventResourceAllocationStatus;
  createdByUserId: string;
  updatedByUserId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventOutstandingRow = {
  id: string;
  organizationId: string;
  eventId: string;
  resourceId: string;
  allocationId: string | null;
  requestedQuantity: number;
  reservedQuantity: number;
  outstandingQuantity: number;
  status: EventResourceOutstandingStatus;
  createdByUserId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function buildPrismaMock() {
  const memberships = [
    {
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'administrator',
    },
    {
      userId: 'user-2',
      organizationId: 'org-2',
      role: 'administrator',
    },
  ];

  const locations = [
    {
      id: 'loc-1',
      organizationId: 'org-1',
      name: 'Main Warehouse',
    },
  ];

  const events = [
    {
      id: 'event-1',
      organizationId: 'org-1',
      startDateTime: new Date('2026-08-10T10:00:00.000Z'),
      endDateTime: new Date('2026-08-10T12:00:00.000Z'),
    },
    {
      id: 'event-2',
      organizationId: 'org-2',
      startDateTime: new Date('2026-08-10T10:00:00.000Z'),
      endDateTime: new Date('2026-08-10T12:00:00.000Z'),
    },
  ];

  const tasks = [
    {
      id: 'task-1',
      organizationId: 'org-1',
    },
  ];

  const resources: ResourceRow[] = [];
  const reservations: ReservationRow[] = [];
  const eventAllocations: EventAllocationRow[] = [];
  const eventOutstandings: EventOutstandingRow[] = [];

  let resourceSeq = 0;
  let reservationSeq = 0;
  let eventAllocationSeq = 0;
  let eventOutstandingSeq = 0;

  const lockMap = new Map<string, Promise<void>>();
  const lockReleaseMap = new Map<string, () => void>();

  const matchesWhere = <T extends Record<string, unknown>>(
    row: T,
    where: Record<string, unknown>,
  ) => {
    const entries = Object.entries(where);

    return entries.every(([key, value]) => {
      if (key === 'AND' && Array.isArray(value)) {
        return value.every(
          (child) =>
            child &&
            typeof child === 'object' &&
            matchesWhere(row, child as Record<string, unknown>),
        );
      }

      const current = row[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('in' in value && Array.isArray(value.in)) {
          return value.in.includes(current);
        }

        if ('notIn' in value && Array.isArray(value.notIn)) {
          return !value.notIn.includes(current);
        }

        if ('not' in value) {
          return current !== value.not;
        }

        if ('lt' in value) {
          return (
            current instanceof Date &&
            current.getTime() < new Date(String(value.lt)).getTime()
          );
        }

        if ('gt' in value) {
          return (
            current instanceof Date &&
            current.getTime() > new Date(String(value.gt)).getTime()
          );
        }
      }

      return current === value;
    });
  };

  const includeLocation = (resource: ResourceRow) => ({
    ...resource,
    location: resource.locationId
      ? {
          id: resource.locationId,
          name:
            locations.find((location) => location.id === resource.locationId)
              ?.name ?? 'Location',
        }
      : null,
  });

  const prisma = {
    membership: {
      findUnique: jest.fn(async ({ where }: any) => {
        const key = where.userId_organizationId;
        return (
          memberships.find(
            (membership) =>
              membership.userId === key.userId &&
              membership.organizationId === key.organizationId,
          ) ?? null
        );
      }),
    },
    role: {
      findFirst: jest.fn(async () => null),
    },
    storageLocation: {
      findUnique: jest.fn(async ({ where }: any) => {
        return locations.find((location) => location.id === where.id) ?? null;
      }),
    },
    event: {
      findUnique: jest.fn(async ({ where, select }: any) => {
        const row = events.find((event) => event.id === where.id) ?? null;
        if (!row) {
          return null;
        }

        if (!select) {
          return row;
        }

        const selected: Record<string, unknown> = {};
        Object.keys(select).forEach((key) => {
          if (select[key]) {
            selected[key] = (row as Record<string, unknown>)[key];
          }
        });
        return selected;
      }),
    },
    task: {
      findUnique: jest.fn(async ({ where }: any) => {
        return tasks.find((task) => task.id === where.id) ?? null;
      }),
    },
    resource: {
      create: jest.fn(async ({ data }: any) => {
        resourceSeq += 1;
        const now = new Date();
        const row: ResourceRow = {
          id: `resource-${resourceSeq}`,
          organizationId: data.organizationId,
          supplierId: data.supplierId ?? null,
          name: data.name,
          description: data.description ?? null,
          category: data.category,
          tags: data.tags ?? [],
          keywords: data.keywords ?? [],
          aiSummary: data.aiSummary ?? null,
          searchPhrases: data.searchPhrases ?? [],
          imageUrls: data.imageUrls ?? [],
          resourceType: data.resourceType,
          quantityMode: data.quantityMode,
          sku: data.sku ?? null,
          barcode: data.barcode ?? null,
          status: data.status,
          visibility: data.visibility,
          unit: data.unit,
          totalQuantity: data.totalQuantity ?? null,
          condition: data.condition,
          locationId: data.locationId ?? null,
          purchaseValue: data.purchaseValue ?? null,
          replacementValue: data.replacementValue ?? null,
          rentalPrice: data.rentalPrice ?? null,
          damagedQuantity: data.damagedQuantity ?? 0,
          maintenanceQuantity: data.maintenanceQuantity ?? 0,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
        };
        resources.push(row);
        return includeLocation(row);
      }),
      findUnique: jest.fn(async ({ where, select, include }: any) => {
        const row =
          resources.find((resource) => resource.id === where.id) ?? null;
        if (!row) {
          return null;
        }

        if (select) {
          const selected: Record<string, unknown> = {};
          Object.keys(select).forEach((key) => {
            if (select[key]) {
              selected[key] = (row as Record<string, unknown>)[key];
            }
          });
          return selected;
        }

        if (include?.location) {
          return includeLocation(row);
        }

        return row;
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const index = resources.findIndex(
          (resource) => resource.id === where.id,
        );
        if (index < 0) {
          throw new Error('resource not found');
        }

        resources[index] = {
          ...resources[index],
          ...Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
          ),
          updatedAt: new Date(),
        };

        return include?.location
          ? includeLocation(resources[index])
          : resources[index];
      }),
      findMany: jest.fn(async ({ where, skip, take }: any) => {
        const filtered = resources.filter((resource) =>
          matchesWhere(resource as any, where),
        );
        return filtered
          .slice(skip ?? 0, (skip ?? 0) + (take ?? filtered.length))
          .map(includeLocation);
      }),
      count: jest.fn(async ({ where }: any) => {
        return resources.filter((resource) =>
          matchesWhere(resource as any, where),
        ).length;
      }),
    },
    resourceReservation: {
      findMany: jest.fn(async ({ where, orderBy, select }: any) => {
        let filtered = reservations.filter((reservation) =>
          matchesWhere(reservation as any, where),
        );

        if (orderBy?.startDateTime === 'asc') {
          filtered = filtered.sort(
            (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
          );
        }

        if (select) {
          return filtered.map((row) => {
            const selected: Record<string, unknown> = {};
            Object.keys(select).forEach((key) => {
              if (select[key]) {
                selected[key] = (row as Record<string, unknown>)[key];
              }
            });
            return selected;
          });
        }

        return filtered;
      }),
      create: jest.fn(async ({ data }: any) => {
        reservationSeq += 1;
        const now = new Date();
        const row: ReservationRow = {
          id: `reservation-${reservationSeq}`,
          organizationId: data.organizationId,
          resourceId: data.resourceId,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          quantity: data.quantity,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          status: data.status,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        reservations.push(row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return (
          reservations.find((reservation) => reservation.id === where.id) ??
          null
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = reservations.findIndex(
          (reservation) => reservation.id === where.id,
        );
        if (index < 0) {
          throw new Error('reservation not found');
        }

        reservations[index] = {
          ...reservations[index],
          ...Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
          ),
          updatedAt: new Date(),
        };

        return reservations[index];
      }),
    },
    eventResourceAllocation: {
      create: jest.fn(async ({ data }: any) => {
        eventAllocationSeq += 1;
        const now = new Date();
        const row: EventAllocationRow = {
          id: `allocation-${eventAllocationSeq}`,
          organizationId: data.organizationId,
          eventId: data.eventId,
          resourceId: data.resourceId,
          resourceReservationId: data.resourceReservationId ?? null,
          quantityRequested: data.quantityRequested,
          quantityReserved: data.quantityReserved,
          quantityReturned: data.quantityReturned ?? 0,
          quantityDamaged: data.quantityDamaged ?? 0,
          quantityLost: data.quantityLost ?? 0,
          reservedDate: data.reservedDate,
          expectedReturnDate: data.expectedReturnDate ?? null,
          actualReturnDate: data.actualReturnDate ?? null,
          status: data.status,
          createdByUserId: data.createdByUserId,
          updatedByUserId: data.updatedByUserId,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        eventAllocations.push(row);
        return row;
      }),
      findMany: jest.fn(async ({ where, orderBy }: any) => {
        let filtered = eventAllocations.filter((row) =>
          matchesWhere(row as any, where),
        );

        if (orderBy?.createdAt === 'asc') {
          filtered = filtered.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
        }

        if (orderBy?.reservedDate === 'desc') {
          filtered = filtered.sort(
            (a, b) => b.reservedDate.getTime() - a.reservedDate.getTime(),
          );
        }

        return filtered;
      }),
      aggregate: jest.fn(async ({ where }: any) => {
        const filtered = eventAllocations.filter((row) =>
          matchesWhere(row as any, where),
        );

        return {
          _sum: {
            quantityLost: filtered.reduce(
              (sum, row) => sum + row.quantityLost,
              0,
            ),
          },
        };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = eventAllocations.findIndex((row) => row.id === where.id);
        if (index < 0) {
          throw new Error('allocation not found');
        }

        eventAllocations[index] = {
          ...eventAllocations[index],
          ...Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
          ),
          updatedAt: new Date(),
        };

        return eventAllocations[index];
      }),
    },
    eventResourceOutstanding: {
      create: jest.fn(async ({ data }: any) => {
        eventOutstandingSeq += 1;
        const now = new Date();
        const row: EventOutstandingRow = {
          id: `outstanding-${eventOutstandingSeq}`,
          organizationId: data.organizationId,
          eventId: data.eventId,
          resourceId: data.resourceId,
          allocationId: data.allocationId ?? null,
          requestedQuantity: data.requestedQuantity,
          reservedQuantity: data.reservedQuantity,
          outstandingQuantity: data.outstandingQuantity,
          status: data.status,
          createdByUserId: data.createdByUserId,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        eventOutstandings.push(row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (let i = 0; i < eventOutstandings.length; i += 1) {
          if (matchesWhere(eventOutstandings[i] as any, where)) {
            eventOutstandings[i] = {
              ...eventOutstandings[i],
              ...Object.fromEntries(
                Object.entries(data).filter(([, value]) => value !== undefined),
              ),
              updatedAt: new Date(),
            };
            count += 1;
          }
        }

        return { count };
      }),
    },
  };

  const makeTransactionClient = () => {
    const heldKeys: string[] = [];

    return {
      ...prisma,
      $queryRaw: jest.fn(
        async (_strings: TemplateStringsArray, key: string) => {
          const existing = lockMap.get(key);
          if (existing) {
            await existing;
          }

          let release = () => undefined;
          const lockPromise = new Promise<void>((resolve) => {
            release = resolve;
          });

          lockMap.set(key, lockPromise);
          lockReleaseMap.set(key, release);
          heldKeys.push(key);
        },
      ),
      __releaseLocks: () => {
        for (const key of heldKeys) {
          const release = lockReleaseMap.get(key);
          if (release) {
            release();
          }
          lockMap.delete(key);
          lockReleaseMap.delete(key);
        }
      },
    };
  };

  return {
    prisma: {
      ...prisma,
      $queryRaw: jest.fn(async () => undefined),
      $transaction: jest.fn(async (arg: any) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }

        const tx = makeTransactionClient();
        try {
          return await arg(tx);
        } finally {
          tx.__releaseLocks();
        }
      }),
    },
    state: {
      resources,
      reservations,
      eventAllocations,
      eventOutstandings,
    },
  };
}

describe('ResourceEngineService', () => {
  it('creates each supported resource type', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resourceTypes = [
      'ASSET',
      'BULK_ITEM',
      'CONSUMABLE',
      'SERVICE',
      'STAFF',
      'VEHICLE',
      'VENUE',
    ] as const;

    for (const type of resourceTypes) {
      const created = await service.createResource({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        name: `Resource ${type}`,
        category: 'General',
        resourceType: type,
        quantityMode: 'QUANTITY',
        unit: 'each',
        totalQuantity: 10,
      });

      expect(created.resourceType).toBe(type);
    }
  });

  it('supports quantity reservations, overlap math, half-open windows and state releases', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Banquet Chairs',
      category: 'Furniture',
      resourceType: 'BULK_ITEM',
      quantityMode: 'QUANTITY',
      unit: 'each',
      totalQuantity: 10,
    });

    const r1 = await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'EVENT',
      sourceId: 'event-1',
      quantity: 4,
      startDateTime: '2026-08-10T10:00:00.000Z',
      endDateTime: '2026-08-10T12:00:00.000Z',
      status: 'RESERVED',
    });

    const r2 = await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'EVENT',
      sourceId: 'event-1',
      quantity: 5,
      startDateTime: '2026-08-10T12:00:00.000Z',
      endDateTime: '2026-08-10T13:00:00.000Z',
      status: 'RESERVED',
    });

    expect(r1.id).toBeTruthy();
    expect(r2.id).toBeTruthy();

    const overlapSnapshot = await service.checkAvailability({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      quantity: 7,
      startDateTime: '2026-08-10T10:30:00.000Z',
      endDateTime: '2026-08-10T11:30:00.000Z',
    });

    expect(overlapSnapshot.canFulfill).toBe(false);
    expect(overlapSnapshot.availableQuantity).toBe(6);

    await expect(
      service.createReservation({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        resourceId: resource.id,
        sourceType: 'EVENT',
        sourceId: 'event-1',
        quantity: 7,
        startDateTime: '2026-08-10T10:30:00.000Z',
        endDateTime: '2026-08-10T11:30:00.000Z',
        status: 'RESERVED',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await service.releaseReservation({
      actorUserId: 'user-1',
      reservationId: r1.id,
    });

    const afterRelease = await service.checkAvailability({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      quantity: 7,
      startDateTime: '2026-08-10T10:30:00.000Z',
      endDateTime: '2026-08-10T11:30:00.000Z',
    });

    expect(afterRelease.canFulfill).toBe(true);

    await service.cancelReservation({
      actorUserId: 'user-1',
      reservationId: r2.id,
    });

    const afterCancel = await service.checkAvailability({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      quantity: 10,
      startDateTime: '2026-08-10T12:00:00.000Z',
      endDateTime: '2026-08-10T13:00:00.000Z',
    });

    expect(afterCancel.canFulfill).toBe(true);
  });

  it('does not count expired reservations as consuming capacity', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Table Linen',
      category: 'Decor',
      resourceType: 'CONSUMABLE',
      quantityMode: 'QUANTITY',
      unit: 'set',
      totalQuantity: 5,
    });

    await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'EVENT',
      sourceId: 'event-1',
      quantity: 5,
      startDateTime: '2026-08-12T08:00:00.000Z',
      endDateTime: '2026-08-12T09:00:00.000Z',
      status: 'EXPIRED',
    });

    const snapshot = await service.checkAvailability({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      quantity: 5,
      startDateTime: '2026-08-12T08:00:00.000Z',
      endDateTime: '2026-08-12T09:00:00.000Z',
    });

    expect(snapshot.canFulfill).toBe(true);
  });

  it('prevents serialized double-booking', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Generator Unit A',
      category: 'Power',
      resourceType: 'ASSET',
      quantityMode: 'SERIALIZED',
      unit: 'unit',
      totalQuantity: 1,
    });

    await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'INTERNAL_JOB',
      sourceId: 'task-1',
      quantity: 1,
      startDateTime: '2026-08-15T08:00:00.000Z',
      endDateTime: '2026-08-15T11:00:00.000Z',
      status: 'CONFIRMED',
    });

    await expect(
      service.createReservation({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        resourceId: resource.id,
        sourceType: 'INTERNAL_JOB',
        sourceId: 'task-1',
        quantity: 1,
        startDateTime: '2026-08-15T09:00:00.000Z',
        endDateTime: '2026-08-15T10:00:00.000Z',
        status: 'CONFIRMED',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calculates overlapping capacity reservations', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Venue Hall Alpha',
      category: 'Venue',
      resourceType: 'VENUE',
      quantityMode: 'CAPACITY',
      unit: 'guests',
      totalQuantity: 100,
    });

    await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'EVENT',
      sourceId: 'event-1',
      quantity: 80,
      startDateTime: '2026-08-16T10:00:00.000Z',
      endDateTime: '2026-08-16T14:00:00.000Z',
      status: 'RESERVED',
    });

    const snapshot = await service.checkAvailability({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      quantity: 25,
      startDateTime: '2026-08-16T11:00:00.000Z',
      endDateTime: '2026-08-16T12:00:00.000Z',
    });

    expect(snapshot.canFulfill).toBe(false);
    expect(snapshot.availableQuantity).toBe(20);
  });

  it('rejects cross-organization access and archived resource reservations', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Stage Platform',
      category: 'Equipment',
      resourceType: 'ASSET',
      quantityMode: 'QUANTITY',
      unit: 'set',
      totalQuantity: 2,
    });

    await expect(
      service.getResource({
        actorUserId: 'user-2',
        resourceId: resource.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.archiveResource({
      actorUserId: 'user-1',
      resourceId: resource.id,
    });

    await expect(
      service.createReservation({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        resourceId: resource.id,
        sourceType: 'EVENT',
        sourceId: 'event-1',
        quantity: 1,
        startDateTime: '2026-08-17T09:00:00.000Z',
        endDateTime: '2026-08-17T10:00:00.000Z',
        status: 'PENDING',
      }),
    ).rejects.toThrow('Archived resources cannot receive new reservations');
  });

  it('prevents overbooking under concurrent requests with locking', async () => {
    const { prisma, state } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Transport Van',
      category: 'Transport',
      resourceType: 'VEHICLE',
      quantityMode: 'QUANTITY',
      unit: 'vehicle',
      totalQuantity: 1,
    });

    const firstRequest = service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'MANUAL_HOLD',
      sourceId: 'hold-1',
      quantity: 1,
      startDateTime: '2026-08-18T08:00:00.000Z',
      endDateTime: '2026-08-18T12:00:00.000Z',
      status: 'CONFIRMED',
    });

    const secondRequest = service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'MANUAL_HOLD',
      sourceId: 'hold-2',
      quantity: 1,
      startDateTime: '2026-08-18T08:30:00.000Z',
      endDateTime: '2026-08-18T09:30:00.000Z',
      status: 'CONFIRMED',
    });

    const [a, b] = await Promise.allSettled([firstRequest, secondRequest]);

    const fulfilledCount = [a, b].filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const rejectedCount = [a, b].filter(
      (result) => result.status === 'rejected',
    ).length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);
    expect(state.reservations).toHaveLength(1);
  });

  it('supports partial event allocation with outstanding records', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Cocktail Tables',
      category: 'Furniture',
      resourceType: 'BULK_ITEM',
      quantityMode: 'QUANTITY',
      unit: 'each',
      totalQuantity: 3,
    });

    const result = await service.reserveResourcesForEvent({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      eventId: 'event-1',
      requests: [
        {
          resourceId: resource.id,
          quantity: 5,
          allowPartial: true,
        },
      ],
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]?.quantityReserved).toBe(3);
    expect(result.outstandings).toHaveLength(1);
    expect(result.outstandings[0]?.outstandingQuantity).toBe(2);
  });

  it('rejects overbooking when partial allocation is not allowed', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Lighting Rig',
      category: 'Lighting',
      resourceType: 'ASSET',
      quantityMode: 'QUANTITY',
      unit: 'set',
      totalQuantity: 1,
    });

    await expect(
      service.reserveResourcesForEvent({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        eventId: 'event-1',
        requests: [
          {
            resourceId: resource.id,
            quantity: 2,
            allowPartial: false,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('releases event allocations and reservation capacity when event completes', async () => {
    const { prisma, state } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Speaker Stack',
      category: 'Audio',
      resourceType: 'ASSET',
      quantityMode: 'QUANTITY',
      unit: 'set',
      totalQuantity: 2,
    });

    const created = await service.reserveResourcesForEvent({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      eventId: 'event-1',
      requests: [
        {
          resourceId: resource.id,
          quantity: 2,
        },
      ],
    });

    expect(state.reservations[0]?.status).toBe(
      ResourceReservationStatus.RESERVED,
    );

    const released = await service.releaseEventAllocations({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      eventId: 'event-1',
      reason: 'Completed',
    });

    expect(released[0]?.status).toBe('Returned');
    expect(state.reservations[0]?.status).toBe(
      ResourceReservationStatus.RELEASED,
    );

    const history = await service.getResourceAllocationHistory({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
    });

    expect(history[0]?.id).toBe(created.allocations[0]?.id);
    expect(history[0]?.quantityReturned).toBe(2);
  });

  it('returns resource availability summary using reserved and lost quantities', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Folding Chairs',
      category: 'Furniture',
      resourceType: 'BULK_ITEM',
      quantityMode: 'QUANTITY',
      unit: 'each',
      totalQuantity: 10,
    });

    await service.createReservation({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
      sourceType: 'MANUAL_HOLD',
      sourceId: 'hold-1',
      quantity: 3,
      startDateTime: '2026-08-20T10:00:00.000Z',
      endDateTime: '2026-08-20T12:00:00.000Z',
      status: 'RESERVED',
    });

    const allocation = await service.reserveResourcesForEvent({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      eventId: 'event-1',
      requests: [
        {
          resourceId: resource.id,
          quantity: 2,
        },
      ],
    });

    const allocationId = allocation.allocations[0]?.id;
    expect(allocationId).toBeTruthy();

    await prisma.eventResourceAllocation.update({
      where: { id: allocationId },
      data: { quantityLost: 1 },
    });

    const summary = await service.getResourceAvailabilitySummary({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      resourceId: resource.id,
    });

    expect(summary.totalQuantity).toBe(10);
    expect(summary.reservedQuantity).toBe(5);
    expect(summary.lostQuantity).toBe(1);
    expect(summary.availableQuantity).toBe(4);
  });

  it('prevents cross-organization event allocation access', async () => {
    const { prisma } = buildPrismaMock();
    const service = new ResourceEngineService(prisma as any);

    const resource = await service.createResource({
      actorUserId: 'user-1',
      organizationId: 'org-1',
      name: 'Backdrop Panels',
      category: 'Decor',
      resourceType: 'ASSET',
      quantityMode: 'QUANTITY',
      unit: 'panel',
      totalQuantity: 8,
    });

    await expect(
      service.reserveResourcesForEvent({
        actorUserId: 'user-1',
        organizationId: 'org-1',
        eventId: 'event-2',
        requests: [
          {
            resourceId: resource.id,
            quantity: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

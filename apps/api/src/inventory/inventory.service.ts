import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  EventResourceAllocationStatus,
  Prisma,
  ResourceCondition,
  ResourceQuantityMode,
  ResourceReservationStatus,
  ResourceStatus,
  ResourceVisibility,
  StockMovementType as PrismaStockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  RESOURCE_ENGINE_PORT,
  type ResourceEnginePort,
} from '../resources/resource-engine.port';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateOpeningBalanceDto } from './dto/create-opening-balance.dto';
import {
  CreateStockAdjustmentDto,
  StockAdjustmentType,
} from './dto/create-stock-adjustment.dto';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { FindResourceWorkspaceCardsQueryDto } from './dto/find-resource-workspace-cards-query.dto';
import { FindInventoryCategoriesQueryDto } from './dto/find-inventory-categories-query.dto';
import { FindInventoryItemsQueryDto } from './dto/find-inventory-items-query.dto';
import { FindStockLevelsQueryDto } from './dto/find-stock-levels-query.dto';
import { FindStockMovementsQueryDto } from './dto/find-stock-movements-query.dto';
import { FindStorageLocationsQueryDto } from './dto/find-storage-locations-query.dto';
import { InventorySortBy } from './dto/inventory-sort.enum';
import { StockMovementType as StockMovementTypeDto } from './dto/stock-movement-type.enum';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';

type PermissionAction = 'View' | 'Create' | 'Edit' | 'Delete';

type RolePermissionMap = Record<string, Record<string, boolean>>;

const CAPACITY_CONSUMING_RESERVATION_STATUSES: ResourceReservationStatus[] = [
  ResourceReservationStatus.PENDING,
  ResourceReservationStatus.RESERVED,
  ResourceReservationStatus.CONFIRMED,
  ResourceReservationStatus.DISPATCHED,
];

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(RESOURCE_ENGINE_PORT)
    private readonly resourceEngine?: ResourceEnginePort,
  ) {}

  async getOverview(userId: string, organizationId: string) {
    await this.ensureOrganizationPermission(userId, organizationId, 'View');

    const [totalActiveItems, activeLocations, items, recentMovements] =
      await Promise.all([
        this.prisma.inventoryItem.count({
          where: {
            organizationId,
            active: true,
          },
        }),
        this.prisma.storageLocation.count({
          where: {
            organizationId,
            active: true,
          },
        }),
        this.prisma.inventoryItem.findMany({
          where: { organizationId, active: true },
          select: {
            id: true,
            reorderLevel: true,
            stockLevels: {
              select: {
                quantityOnHand: true,
                quantityReserved: true,
              },
            },
          },
        }),
        this.prisma.stockMovement.findMany({
          where: { organizationId },
          include: {
            inventoryItem: {
              select: { id: true, name: true },
            },
            storageLocation: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    let totalStockQuantity = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    for (const item of items) {
      const quantityOnHand = item.stockLevels.reduce(
        (sum, row) => sum + row.quantityOnHand,
        0,
      );
      const quantityReserved = item.stockLevels.reduce(
        (sum, row) => sum + row.quantityReserved,
        0,
      );
      const available = quantityOnHand - quantityReserved;

      totalStockQuantity += quantityOnHand;

      if (available <= 0) {
        outOfStockItems += 1;
      }

      if (item.reorderLevel !== null && available <= item.reorderLevel) {
        lowStockItems += 1;
      }
    }

    return {
      totalActiveItems,
      totalStockQuantity,
      lowStockItems,
      outOfStockItems,
      activeLocations,
      recentStockMovements: recentMovements.map((row) => this.mapMovement(row)),
    };
  }

  async getResourceWorkspaceSummary(userId: string, organizationId: string) {
    await this.ensureOrganizationPermission(userId, organizationId, 'View');

    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const returnedSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [resources, reservationsToday, allocations, recentlyReturned] =
      await Promise.all([
        this.prisma.resource.findMany({
          where: {
            organizationId,
            archivedAt: null,
          },
          select: {
            id: true,
            totalQuantity: true,
            quantityMode: true,
            status: true,
            condition: true,
            name: true,
          },
        }),
        this.prisma.resourceReservation.findMany({
          where: {
            organizationId,
            status: {
              in: CAPACITY_CONSUMING_RESERVATION_STATUSES,
            },
            startDateTime: { lt: endOfDay },
            endDateTime: { gt: startOfDay },
          },
          select: {
            resourceId: true,
            quantity: true,
            endDateTime: true,
          },
        }),
        this.prisma.eventResourceAllocation.findMany({
          where: {
            organizationId,
          },
          select: {
            resourceId: true,
            quantityDamaged: true,
            quantityLost: true,
          },
        }),
        this.prisma.eventResourceAllocation.findMany({
          where: {
            organizationId,
            status: EventResourceAllocationStatus.Returned,
            actualReturnDate: {
              gte: returnedSince,
            },
          },
          select: {
            resourceId: true,
            quantityReturned: true,
            actualReturnDate: true,
            resource: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            actualReturnDate: 'desc',
          },
          take: 8,
        }),
      ]);

    const reservedByResource = new Map<string, number>();
    let returningToday = 0;

    for (const reservation of reservationsToday) {
      reservedByResource.set(
        reservation.resourceId,
        (reservedByResource.get(reservation.resourceId) ?? 0) +
          reservation.quantity,
      );

      if (
        reservation.endDateTime >= startOfDay &&
        reservation.endDateTime < endOfDay
      ) {
        returningToday += 1;
      }
    }

    const damagedByResource = new Map<string, number>();
    const lostByResource = new Map<string, number>();

    for (const allocation of allocations) {
      damagedByResource.set(
        allocation.resourceId,
        (damagedByResource.get(allocation.resourceId) ?? 0) +
          allocation.quantityDamaged,
      );
      lostByResource.set(
        allocation.resourceId,
        (lostByResource.get(allocation.resourceId) ?? 0) +
          allocation.quantityLost,
      );
    }

    let availableToday = 0;
    let damaged = 0;
    let missing = 0;
    let maintenanceDue = 0;

    for (const resource of resources) {
      const reserved = reservedByResource.get(resource.id) ?? 0;
      const lost = lostByResource.get(resource.id) ?? 0;
      const damagedQuantity = damagedByResource.get(resource.id) ?? 0;
      const hasMaintenanceAlert =
        resource.status === ResourceStatus.MAINTENANCE ||
        resource.condition === ResourceCondition.DAMAGED ||
        resource.condition === ResourceCondition.RETIRED;

      const resourceAvailable =
        resource.quantityMode === ResourceQuantityMode.UNLIMITED
          ? true
          : Math.max((resource.totalQuantity ?? 0) - reserved - lost, 0) > 0;

      if (resourceAvailable) {
        availableToday += 1;
      }

      if (
        damagedQuantity > 0 ||
        resource.condition === ResourceCondition.DAMAGED
      ) {
        damaged += 1;
      }

      if (lost > 0 || resource.status === ResourceStatus.RETIRED) {
        missing += 1;
      }

      if (hasMaintenanceAlert) {
        maintenanceDue += 1;
      }
    }

    return {
      totalResources: resources.length,
      availableToday,
      reservedToday: reservedByResource.size,
      damaged,
      missing,
      returningToday,
      maintenanceDue,
      recentlyReturnedResources: recentlyReturned.map((row) => ({
        resourceId: row.resourceId,
        resourceName: row.resource.name,
        quantityReturned: row.quantityReturned,
        returnedAt: row.actualReturnDate ?? now,
      })),
    };
  }

  async findResourceWorkspaceCards(
    userId: string,
    query: FindResourceWorkspaceCardsQueryDto,
  ) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const supplierSkuSet = await this.resolveSupplierSkuSet(
      query.organizationId,
      query.supplierId,
    );

    const searchTokens = [query.search, query.tags, query.keywords]
      .filter((value): value is string => Boolean(value && value.trim()))
      .flatMap((value) =>
        value
          .split(/[\s,]+/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      );

    const baseWhere: Prisma.ResourceWhereInput = {
      organizationId: query.organizationId,
      archivedAt: null,
      ...(query.category
        ? {
            category: {
              contains: query.category,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(supplierSkuSet
        ? {
            sku: {
              in: [...supplierSkuSet],
            },
          }
        : {}),
      ...(searchTokens.length
        ? {
            AND: searchTokens.map((token) => ({
              OR: [
                {
                  name: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
                {
                  category: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
                {
                  sku: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
                {
                  barcode: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
                {
                  notes: {
                    contains: token,
                    mode: 'insensitive',
                  },
                },
              ],
            })),
          }
        : {}),
    };

    const resources = await this.prisma.resource.findMany({
      where: baseWhere,
      include: {
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const resourceIds = resources.map((resource) => resource.id);

    const [reservations, allocations, supplierLinks] = await Promise.all([
      resourceIds.length
        ? this.prisma.resourceReservation.findMany({
            where: {
              organizationId: query.organizationId,
              resourceId: {
                in: resourceIds,
              },
              status: {
                in: CAPACITY_CONSUMING_RESERVATION_STATUSES,
              },
            },
            select: {
              resourceId: true,
              quantity: true,
              startDateTime: true,
            },
            orderBy: {
              startDateTime: 'asc',
            },
          })
        : Promise.resolve([]),
      resourceIds.length
        ? this.prisma.eventResourceAllocation.findMany({
            where: {
              organizationId: query.organizationId,
              resourceId: {
                in: resourceIds,
              },
            },
            select: {
              resourceId: true,
              quantityDamaged: true,
              quantityLost: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.inventoryItem.findMany({
        where: {
          organizationId: query.organizationId,
          ...(resourceIds.length
            ? {
                sku: {
                  in: resources
                    .map((resource) => resource.sku)
                    .filter((sku): sku is string => Boolean(sku)),
                },
              }
            : {}),
        },
        select: {
          sku: true,
          preferredSupplierId: true,
          preferredSupplier: {
            select: {
              companyName: true,
            },
          },
        },
      }),
    ]);

    const reservedByResource = new Map<string, number>();
    const nextReservationByResource = new Map<string, Date>();
    const now = new Date();

    for (const reservation of reservations) {
      reservedByResource.set(
        reservation.resourceId,
        (reservedByResource.get(reservation.resourceId) ?? 0) +
          reservation.quantity,
      );

      if (reservation.startDateTime >= now) {
        const current = nextReservationByResource.get(reservation.resourceId);
        if (!current || reservation.startDateTime < current) {
          nextReservationByResource.set(
            reservation.resourceId,
            reservation.startDateTime,
          );
        }
      }
    }

    const damagedByResource = new Map<string, number>();
    const lostByResource = new Map<string, number>();

    for (const allocation of allocations) {
      damagedByResource.set(
        allocation.resourceId,
        (damagedByResource.get(allocation.resourceId) ?? 0) +
          allocation.quantityDamaged,
      );
      lostByResource.set(
        allocation.resourceId,
        (lostByResource.get(allocation.resourceId) ?? 0) +
          allocation.quantityLost,
      );
    }

    const supplierBySku = new Map<
      string,
      { supplierId: string | null; supplierName: string | null }
    >();

    for (const row of supplierLinks) {
      if (!row.sku || supplierBySku.has(row.sku)) {
        continue;
      }

      supplierBySku.set(row.sku, {
        supplierId: row.preferredSupplierId,
        supplierName: row.preferredSupplier?.companyName ?? null,
      });
    }

    const filteredCards = resources
      .map((resource) => {
        const reservedQuantity = reservedByResource.get(resource.id) ?? 0;
        const damagedQuantity = damagedByResource.get(resource.id) ?? 0;
        const missingQuantity = lostByResource.get(resource.id) ?? 0;
        const availableQuantity =
          resource.quantityMode === ResourceQuantityMode.UNLIMITED
            ? null
            : Math.max(
                (resource.totalQuantity ?? 0) -
                  reservedQuantity -
                  missingQuantity,
                0,
              );
        const supplier = resource.sku
          ? supplierBySku.get(resource.sku)
          : undefined;

        return {
          id: resource.id,
          name: resource.name,
          category: resource.category,
          quantity:
            resource.quantityMode === ResourceQuantityMode.UNLIMITED
              ? null
              : resource.totalQuantity,
          availableQuantity,
          reservedQuantity:
            resource.quantityMode === ResourceQuantityMode.UNLIMITED
              ? null
              : reservedQuantity,
          damagedQuantity,
          missingQuantity,
          marketplaceStatus:
            resource.visibility === ResourceVisibility.MARKETPLACE
              ? 'MARKETPLACE'
              : 'PRIVATE',
          currentLocation: resource.location?.name ?? null,
          nextReservation: nextReservationByResource.get(resource.id) ?? null,
          primaryImage: null,
          supplierId: supplier?.supplierId ?? null,
          supplierName: supplier?.supplierName ?? null,
          status: resource.status,
          condition: resource.condition,
          visibility: resource.visibility,
        };
      })
      .filter((card) => {
        if (
          query.available &&
          card.availableQuantity !== null &&
          card.availableQuantity <= 0
        ) {
          return false;
        }

        if (query.reserved && (card.reservedQuantity ?? 0) <= 0) {
          return false;
        }

        if (query.damaged && card.damagedQuantity <= 0) {
          return false;
        }

        if (query.missing && card.missingQuantity <= 0) {
          return false;
        }

        if (
          query.maintenanceDue &&
          card.status !== ResourceStatus.MAINTENANCE &&
          card.condition !== ResourceCondition.DAMAGED &&
          card.condition !== ResourceCondition.RETIRED
        ) {
          return false;
        }

        if (
          query.marketplacePublished &&
          card.visibility !== ResourceVisibility.MARKETPLACE
        ) {
          return false;
        }

        return true;
      });

    const total = filteredCards.length;
    const data = filteredCards
      .slice((page - 1) * limit, (page - 1) * limit + limit)
      .map((card) => ({
        id: card.id,
        name: card.name,
        category: card.category,
        quantity: card.quantity,
        availableQuantity: card.availableQuantity,
        reservedQuantity: card.reservedQuantity,
        damagedQuantity: card.damagedQuantity,
        missingQuantity: card.missingQuantity,
        marketplaceStatus: card.marketplaceStatus,
        currentLocation: card.currentLocation,
        nextReservation: card.nextReservation,
        primaryImage: card.primaryImage,
        supplierId: card.supplierId,
        supplierName: card.supplierName,
      }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async createCategory(userId: string, dto: CreateInventoryCategoryDto) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
    );

    try {
      return await this.prisma.inventoryCategory.create({
        data: {
          organizationId: dto.organizationId,
          name: dto.name.trim(),
          description: this.normalizeNullable(dto.description),
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      this.handleUniqueError(error, {
        InventoryCategory_organizationId_name_key:
          'A category with this name already exists in the organization',
      });
      throw error;
    }
  }

  async findCategories(userId: string, query: FindInventoryCategoriesQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.InventoryCategoryWhereInput = {
      organizationId: query.organizationId,
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryCategory.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryCategory.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateInventoryCategoryDto,
  ) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Inventory category with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      category.organizationId,
      'Edit',
    );

    try {
      return await this.prisma.inventoryCategory.update({
        where: { id: category.id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.description === undefined
            ? {}
            : { description: this.normalizeNullable(dto.description) }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
      });
    } catch (error) {
      this.handleUniqueError(error, {
        InventoryCategory_organizationId_name_key:
          'A category with this name already exists in the organization',
      });
      throw error;
    }
  }

  async removeCategory(userId: string, id: string) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Inventory category with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      category.organizationId,
      'Delete',
    );

    await this.prisma.inventoryCategory.delete({
      where: { id: category.id },
    });
  }

  async createLocation(userId: string, dto: CreateStorageLocationDto) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
    );

    try {
      return await this.prisma.storageLocation.create({
        data: {
          organizationId: dto.organizationId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          physicalAddress: this.normalizeNullable(dto.physicalAddress),
          city: this.normalizeNullable(dto.city),
          province: this.normalizeNullable(dto.province),
          notes: this.normalizeNullable(dto.notes),
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      this.handleUniqueError(error, {
        StorageLocation_organizationId_code_key:
          'A storage location with this code already exists in the organization',
      });
      throw error;
    }
  }

  async findLocations(userId: string, query: FindStorageLocationsQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.StorageLocationWhereInput = {
      organizationId: query.organizationId,
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                city: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                province: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.storageLocation.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.storageLocation.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findLocation(userId: string, id: string) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Storage location with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      location.organizationId,
      'View',
    );

    return location;
  }

  async updateLocation(
    userId: string,
    id: string,
    dto: UpdateStorageLocationDto,
  ) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Storage location with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      location.organizationId,
      'Edit',
    );

    try {
      return await this.prisma.storageLocation.update({
        where: { id: location.id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.code === undefined ? {} : { code: dto.code.trim() }),
          ...(dto.physicalAddress === undefined
            ? {}
            : { physicalAddress: this.normalizeNullable(dto.physicalAddress) }),
          ...(dto.city === undefined
            ? {}
            : { city: this.normalizeNullable(dto.city) }),
          ...(dto.province === undefined
            ? {}
            : { province: this.normalizeNullable(dto.province) }),
          ...(dto.notes === undefined
            ? {}
            : { notes: this.normalizeNullable(dto.notes) }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
      });
    } catch (error) {
      this.handleUniqueError(error, {
        StorageLocation_organizationId_code_key:
          'A storage location with this code already exists in the organization',
      });
      throw error;
    }
  }

  async removeLocation(userId: string, id: string) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Storage location with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      location.organizationId,
      'Delete',
    );

    await this.prisma.storageLocation.delete({
      where: { id: location.id },
    });
  }

  async createItem(userId: string, dto: CreateInventoryItemDto) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
    );
    await this.ensureCategoryOwnership(dto.categoryId, dto.organizationId);

    if (dto.preferredSupplierId) {
      await this.ensureSupplierOwnership(
        dto.preferredSupplierId,
        dto.organizationId,
      );
    }

    try {
      const created = await this.prisma.inventoryItem.create({
        data: {
          organizationId: dto.organizationId,
          publicName: this.normalizeNullable(dto.publicName),
          internalName: this.normalizeNullable(dto.internalName),
          sku: dto.sku.trim(),
          barcode: this.normalizeNullable(dto.barcode),
          qrCode: this.normalizeNullable(dto.qrCode),
          name: dto.name.trim(),
          description: this.normalizeNullable(dto.description),
          shortDescription: this.normalizeNullable(dto.shortDescription),
          longDescription: this.normalizeNullable(dto.longDescription),
          internalNotes: this.normalizeNullable(dto.internalNotes),
          marketplaceTitle: this.normalizeNullable(dto.marketplaceTitle),
          marketplaceDescription: this.normalizeNullable(
            dto.marketplaceDescription,
          ),
          aiSummary: this.normalizeNullable(dto.aiSummary),
          aiKeywords: this.normalizeStringArray(dto.aiKeywords),
          aiTags: this.normalizeStringArray(dto.aiTags),
          aiConfidence: dto.aiConfidence ?? null,
          categoryId: dto.categoryId,
          subCategory: this.normalizeNullable(dto.subCategory),
          brand: this.normalizeNullable(dto.brand),
          preferredSupplierId: dto.preferredSupplierId,
          resourceStatus: dto.resourceStatus,
          itemType: dto.itemType,
          unitOfMeasure: dto.unitOfMeasure,
          style: this.normalizeNullable(dto.style),
          theme: this.normalizeNullable(dto.theme),
          colour: this.normalizeNullable(dto.colour),
          material: this.normalizeNullable(dto.material),
          dimensions: this.normalizeNullable(dto.dimensions),
          weight: this.normalizeNullable(dto.weight),
          capacity: this.normalizeNullable(dto.capacity),
          indoorOutdoor: dto.indoorOutdoor,
          suitableEventTypes: this.normalizeStringArray(dto.suitableEventTypes),
          manualTags: this.normalizeStringArray(dto.manualTags),
          keywords: this.normalizeStringArray(dto.keywords),
          aiGeneratedTags: this.normalizeStringArray(dto.aiGeneratedTags),
          marketplaceVisibility: dto.marketplaceVisibility,
          photoUrls: this.normalizeStringArray(dto.photoUrls),
          primaryPhotoUrl: this.normalizeNullable(dto.primaryPhotoUrl),
          photoAssets:
            dto.photoAssets === undefined
              ? undefined
              : (dto.photoAssets as Prisma.InputJsonValue),
          costPrice: dto.costPrice,
          replacementValue: dto.replacementValue,
          rentalPrice: dto.rentalPrice,
          sellingPrice: dto.sellingPrice,
          taxable: dto.taxable ?? false,
          active: dto.active ?? true,
          trackQuantity: dto.trackQuantity ?? true,
          trackSerialNumbers: dto.trackSerialNumbers ?? false,
          minimumStock: dto.minimumStock,
          reorderLevel: dto.reorderLevel,
          notes: this.normalizeNullable(dto.notes),
        },
        include: this.itemInclude,
      });

      return this.mapItem(created, {
        quantityOnHand: 0,
        quantityReserved: 0,
      });
    } catch (error) {
      this.handleUniqueError(error, {
        InventoryItem_organizationId_sku_key:
          'SKU already exists in this organization',
        InventoryItem_organizationId_barcode_key:
          'Barcode already exists in this organization',
      });
      throw error;
    }
  }

  async findItems(userId: string, query: FindInventoryItemsQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? InventorySortBy.Name;

    const where = this.buildItemWhere(query);

    if (sortBy === InventorySortBy.StockLevel || query.lowStockOnly) {
      const allItems = await this.prisma.inventoryItem.findMany({
        where,
        include: this.itemInclude,
      });

      const stockMap = await this.getStockAggregateMap(
        allItems.map((item) => item.id),
      );

      let rows = allItems.map((item) =>
        this.mapItem(
          item,
          stockMap.get(item.id) ?? { quantityOnHand: 0, quantityReserved: 0 },
        ),
      );

      if (query.lowStockOnly) {
        rows = rows.filter(
          (item) =>
            item.reorderLevel !== null &&
            item.stock.quantityAvailable <= item.reorderLevel,
        );
      }

      if (sortBy === InventorySortBy.StockLevel) {
        rows = rows.sort(
          (left, right) =>
            right.stock.quantityAvailable - left.stock.quantityAvailable,
        );
      } else if (sortBy === InventorySortBy.Newest) {
        rows = rows.sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        );
      } else if (sortBy === InventorySortBy.Oldest) {
        rows = rows.sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
        );
      } else if (sortBy === InventorySortBy.Sku) {
        rows = rows.sort((left, right) => left.sku.localeCompare(right.sku));
      } else {
        rows = rows.sort((left, right) => left.name.localeCompare(right.name));
      }

      const total = rows.length;
      const paged = rows.slice((page - 1) * limit, (page - 1) * limit + limit);

      return {
        data: paged,
        meta: {
          page,
          limit,
          total,
        },
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        include: this.itemInclude,
        orderBy: this.resolveItemOrderBy(sortBy),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    const stockMap = await this.getStockAggregateMap(
      rows.map((item) => item.id),
    );

    return {
      data: rows.map((item) =>
        this.mapItem(
          item,
          stockMap.get(item.id) ?? { quantityOnHand: 0, quantityReserved: 0 },
        ),
      ),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findItem(userId: string, id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: this.itemInclude,
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      item.organizationId,
      'View',
    );

    const stockMap = await this.getStockAggregateMap([item.id]);
    return this.mapItem(
      item,
      stockMap.get(item.id) ?? { quantityOnHand: 0, quantityReserved: 0 },
    );
  }

  async updateItem(userId: string, id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: this.itemInclude,
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      item.organizationId,
      'Edit',
    );

    if (dto.categoryId) {
      await this.ensureCategoryOwnership(dto.categoryId, item.organizationId);
    }

    if (dto.preferredSupplierId) {
      await this.ensureSupplierOwnership(
        dto.preferredSupplierId,
        item.organizationId,
      );
    }

    try {
      const updated = await this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          ...(dto.publicName === undefined
            ? {}
            : { publicName: this.normalizeNullable(dto.publicName) }),
          ...(dto.internalName === undefined
            ? {}
            : { internalName: this.normalizeNullable(dto.internalName) }),
          ...(dto.sku === undefined ? {} : { sku: dto.sku.trim() }),
          ...(dto.barcode === undefined
            ? {}
            : { barcode: this.normalizeNullable(dto.barcode) }),
          ...(dto.qrCode === undefined
            ? {}
            : { qrCode: this.normalizeNullable(dto.qrCode) }),
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.description === undefined
            ? {}
            : { description: this.normalizeNullable(dto.description) }),
          ...(dto.shortDescription === undefined
            ? {}
            : {
                shortDescription: this.normalizeNullable(dto.shortDescription),
              }),
          ...(dto.longDescription === undefined
            ? {}
            : { longDescription: this.normalizeNullable(dto.longDescription) }),
          ...(dto.internalNotes === undefined
            ? {}
            : { internalNotes: this.normalizeNullable(dto.internalNotes) }),
          ...(dto.marketplaceTitle === undefined
            ? {}
            : {
                marketplaceTitle: this.normalizeNullable(dto.marketplaceTitle),
              }),
          ...(dto.marketplaceDescription === undefined
            ? {}
            : {
                marketplaceDescription: this.normalizeNullable(
                  dto.marketplaceDescription,
                ),
              }),
          ...(dto.aiSummary === undefined
            ? {}
            : { aiSummary: this.normalizeNullable(dto.aiSummary) }),
          ...(dto.aiKeywords === undefined
            ? {}
            : { aiKeywords: this.normalizeStringArray(dto.aiKeywords) }),
          ...(dto.aiTags === undefined
            ? {}
            : { aiTags: this.normalizeStringArray(dto.aiTags) }),
          ...(dto.aiConfidence === undefined
            ? {}
            : { aiConfidence: dto.aiConfidence }),
          ...(dto.categoryId === undefined
            ? {}
            : { categoryId: dto.categoryId }),
          ...(dto.subCategory === undefined
            ? {}
            : { subCategory: this.normalizeNullable(dto.subCategory) }),
          ...(dto.brand === undefined
            ? {}
            : { brand: this.normalizeNullable(dto.brand) }),
          ...(dto.preferredSupplierId === undefined
            ? {}
            : { preferredSupplierId: dto.preferredSupplierId }),
          ...(dto.resourceStatus === undefined
            ? {}
            : { resourceStatus: dto.resourceStatus }),
          ...(dto.itemType === undefined ? {} : { itemType: dto.itemType }),
          ...(dto.unitOfMeasure === undefined
            ? {}
            : { unitOfMeasure: dto.unitOfMeasure }),
          ...(dto.style === undefined
            ? {}
            : { style: this.normalizeNullable(dto.style) }),
          ...(dto.theme === undefined
            ? {}
            : { theme: this.normalizeNullable(dto.theme) }),
          ...(dto.colour === undefined
            ? {}
            : { colour: this.normalizeNullable(dto.colour) }),
          ...(dto.material === undefined
            ? {}
            : { material: this.normalizeNullable(dto.material) }),
          ...(dto.dimensions === undefined
            ? {}
            : { dimensions: this.normalizeNullable(dto.dimensions) }),
          ...(dto.weight === undefined
            ? {}
            : { weight: this.normalizeNullable(dto.weight) }),
          ...(dto.capacity === undefined
            ? {}
            : { capacity: this.normalizeNullable(dto.capacity) }),
          ...(dto.indoorOutdoor === undefined
            ? {}
            : { indoorOutdoor: dto.indoorOutdoor }),
          ...(dto.suitableEventTypes === undefined
            ? {}
            : {
                suitableEventTypes: this.normalizeStringArray(
                  dto.suitableEventTypes,
                ),
              }),
          ...(dto.manualTags === undefined
            ? {}
            : { manualTags: this.normalizeStringArray(dto.manualTags) }),
          ...(dto.keywords === undefined
            ? {}
            : { keywords: this.normalizeStringArray(dto.keywords) }),
          ...(dto.aiGeneratedTags === undefined
            ? {}
            : {
                aiGeneratedTags: this.normalizeStringArray(dto.aiGeneratedTags),
              }),
          ...(dto.marketplaceVisibility === undefined
            ? {}
            : { marketplaceVisibility: dto.marketplaceVisibility }),
          ...(dto.photoUrls === undefined
            ? {}
            : { photoUrls: this.normalizeStringArray(dto.photoUrls) }),
          ...(dto.primaryPhotoUrl === undefined
            ? {}
            : {
                primaryPhotoUrl: this.normalizeNullable(dto.primaryPhotoUrl),
              }),
          ...(dto.photoAssets === undefined
            ? {}
            : { photoAssets: dto.photoAssets as Prisma.InputJsonValue }),
          ...(dto.costPrice === undefined ? {} : { costPrice: dto.costPrice }),
          ...(dto.replacementValue === undefined
            ? {}
            : { replacementValue: dto.replacementValue }),
          ...(dto.rentalPrice === undefined
            ? {}
            : { rentalPrice: dto.rentalPrice }),
          ...(dto.sellingPrice === undefined
            ? {}
            : { sellingPrice: dto.sellingPrice }),
          ...(dto.taxable === undefined ? {} : { taxable: dto.taxable }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
          ...(dto.trackQuantity === undefined
            ? {}
            : { trackQuantity: dto.trackQuantity }),
          ...(dto.trackSerialNumbers === undefined
            ? {}
            : { trackSerialNumbers: dto.trackSerialNumbers }),
          ...(dto.minimumStock === undefined
            ? {}
            : { minimumStock: dto.minimumStock }),
          ...(dto.reorderLevel === undefined
            ? {}
            : { reorderLevel: dto.reorderLevel }),
          ...(dto.notes === undefined
            ? {}
            : { notes: this.normalizeNullable(dto.notes) }),
        },
        include: this.itemInclude,
      });

      const stockMap = await this.getStockAggregateMap([updated.id]);
      return this.mapItem(
        updated,
        stockMap.get(updated.id) ?? { quantityOnHand: 0, quantityReserved: 0 },
      );
    } catch (error) {
      this.handleUniqueError(error, {
        InventoryItem_organizationId_sku_key:
          'SKU already exists in this organization',
        InventoryItem_organizationId_barcode_key:
          'Barcode already exists in this organization',
      });
      throw error;
    }
  }

  async removeItem(userId: string, id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      item.organizationId,
      'Delete',
    );

    await this.prisma.inventoryItem.delete({ where: { id: item.id } });
  }

  async findStockLevels(userId: string, query: FindStockLevelsQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.StockLevelWhereInput = {
      inventoryItem: {
        organizationId: query.organizationId,
      },
      ...(query.inventoryItemId
        ? { inventoryItemId: query.inventoryItemId }
        : {}),
      ...(query.storageLocationId
        ? { storageLocationId: query.storageLocationId }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockLevel.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
            },
          },
          storageLocation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            inventoryItem: {
              name: 'asc',
            },
          },
          {
            storageLocation: {
              name: 'asc',
            },
          },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        inventoryItemId: row.inventoryItemId,
        inventoryItemName: row.inventoryItem.name,
        storageLocationId: row.storageLocationId,
        storageLocationName: row.storageLocation.name,
        quantityOnHand: row.quantityOnHand,
        quantityReserved: row.quantityReserved,
        quantityAvailable: this.quantityAvailable(
          row.quantityOnHand,
          row.quantityReserved,
        ),
        updatedAt: row.updatedAt,
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findStockMovements(userId: string, query: FindStockMovementsQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.StockMovementWhereInput = {
      organizationId: query.organizationId,
      ...(query.inventoryItemId
        ? { inventoryItemId: query.inventoryItemId }
        : {}),
      ...(query.storageLocationId
        ? { storageLocationId: query.storageLocationId }
        : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(query.search
        ? {
            OR: [
              {
                reference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                reason: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                notes: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                inventoryItem: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                storageLocation: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
            },
          },
          storageLocation: {
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
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapMovement(row)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async createOpeningBalance(userId: string, dto: CreateOpeningBalanceDto) {
    await this.ensureOrganizationPermission(userId, dto.organizationId, 'Edit');

    return this.prisma.$transaction(async (tx) => {
      const context = await this.getMovementContext(
        tx,
        dto.organizationId,
        dto.inventoryItemId,
        dto.storageLocationId,
      );

      const level = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.storageLocationId,
          },
        },
      });

      const nextOnHand = (level?.quantityOnHand ?? 0) + dto.quantity;

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.storageLocationId,
          },
        },
        update: {
          quantityOnHand: nextOnHand,
        },
        create: {
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.storageLocationId,
          quantityOnHand: dto.quantity,
          quantityReserved: 0,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: dto.organizationId,
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.storageLocationId,
          movementType: StockMovementTypeDto.OpeningBalance,
          quantity: dto.quantity,
          reference: this.normalizeNullable(dto.reference),
          reason: dto.reason.trim(),
          notes: this.normalizeNullable(dto.notes),
          createdByUserId: userId,
        },
        include: this.movementInclude,
      });

      return {
        ...this.mapMovement(movement),
        inventoryItemName: context.item.name,
        storageLocationName: context.location.name,
      };
    });
  }

  async createStockAdjustment(userId: string, dto: CreateStockAdjustmentDto) {
    await this.ensureOrganizationPermission(userId, dto.organizationId, 'Edit');

    return this.prisma.$transaction(async (tx) => {
      await this.getMovementContext(
        tx,
        dto.organizationId,
        dto.inventoryItemId,
        dto.storageLocationId,
      );

      const level = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.storageLocationId,
          },
        },
      });

      const currentOnHand = level?.quantityOnHand ?? 0;
      const currentReserved = level?.quantityReserved ?? 0;
      const available = this.quantityAvailable(currentOnHand, currentReserved);

      const isIncrease = dto.adjustmentType === StockAdjustmentType.Increase;
      const movementType = isIncrease
        ? StockMovementTypeDto.AdjustmentIncrease
        : StockMovementTypeDto.AdjustmentDecrease;
      const nextOnHand = isIncrease
        ? currentOnHand + dto.quantity
        : currentOnHand - dto.quantity;

      if (!isIncrease) {
        if (dto.quantity > available) {
          throw new BadRequestException(
            'Adjustment exceeds available stock for this location',
          );
        }

        if (nextOnHand < 0) {
          throw new BadRequestException(
            'Stock cannot become negative from this adjustment',
          );
        }
      }

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.storageLocationId,
          },
        },
        update: {
          quantityOnHand: nextOnHand,
        },
        create: {
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.storageLocationId,
          quantityOnHand: nextOnHand,
          quantityReserved: 0,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: dto.organizationId,
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.storageLocationId,
          movementType,
          quantity: dto.quantity,
          reference: this.normalizeNullable(dto.reference),
          reason: dto.reason.trim(),
          notes: this.normalizeNullable(dto.notes),
          createdByUserId: userId,
        },
        include: this.movementInclude,
      });

      return this.mapMovement(movement);
    });
  }

  async createStockTransfer(userId: string, dto: CreateStockTransferDto) {
    await this.ensureOrganizationPermission(userId, dto.organizationId, 'Edit');

    if (dto.sourceLocationId === dto.destinationLocationId) {
      throw new BadRequestException(
        'Source and destination locations cannot be the same',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.getMovementContext(
        tx,
        dto.organizationId,
        dto.inventoryItemId,
        dto.sourceLocationId,
      );
      await this.getMovementContext(
        tx,
        dto.organizationId,
        dto.inventoryItemId,
        dto.destinationLocationId,
      );

      const sourceLevel = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.sourceLocationId,
          },
        },
      });

      const sourceOnHand = sourceLevel?.quantityOnHand ?? 0;
      const sourceReserved = sourceLevel?.quantityReserved ?? 0;
      const sourceAvailable = this.quantityAvailable(
        sourceOnHand,
        sourceReserved,
      );

      if (dto.quantity > sourceAvailable) {
        throw new BadRequestException(
          'Transfer quantity exceeds available stock in source location',
        );
      }

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.sourceLocationId,
          },
        },
        update: {
          quantityOnHand: sourceOnHand - dto.quantity,
        },
        create: {
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.sourceLocationId,
          quantityOnHand: -dto.quantity,
          quantityReserved: 0,
        },
      });

      const destinationLevel = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.destinationLocationId,
          },
        },
      });

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.destinationLocationId,
          },
        },
        update: {
          quantityOnHand:
            (destinationLevel?.quantityOnHand ?? 0) + dto.quantity,
        },
        create: {
          inventoryItemId: dto.inventoryItemId,
          storageLocationId: dto.destinationLocationId,
          quantityOnHand: dto.quantity,
          quantityReserved: 0,
        },
      });

      const [transferOut, transferIn] = await Promise.all([
        tx.stockMovement.create({
          data: {
            organizationId: dto.organizationId,
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.sourceLocationId,
            movementType: StockMovementTypeDto.TransferOut,
            quantity: dto.quantity,
            reference: this.normalizeNullable(dto.reference),
            reason: dto.reason.trim(),
            notes: this.normalizeNullable(dto.notes),
            createdByUserId: userId,
          },
          include: this.movementInclude,
        }),
        tx.stockMovement.create({
          data: {
            organizationId: dto.organizationId,
            inventoryItemId: dto.inventoryItemId,
            storageLocationId: dto.destinationLocationId,
            movementType: StockMovementTypeDto.TransferIn,
            quantity: dto.quantity,
            reference: this.normalizeNullable(dto.reference),
            reason: dto.reason.trim(),
            notes: this.normalizeNullable(dto.notes),
            createdByUserId: userId,
          },
          include: this.movementInclude,
        }),
      ]);

      return {
        transferOut: this.mapMovement(transferOut),
        transferIn: this.mapMovement(transferIn),
      };
    });
  }

  async applyGoodsReceiptMovements(
    tx: Prisma.TransactionClient,
    userId: string,
    params: {
      organizationId: string;
      purchaseOrderNumber: string;
      goodsReceiptNumber: string;
      inventoryItemId: string;
      storageLocationId: string;
      quantityAccepted: number;
      quantityDamaged: number;
      notes?: string | null;
    },
  ) {
    const context = await this.getMovementContext(
      tx,
      params.organizationId,
      params.inventoryItemId,
      params.storageLocationId,
    );

    const reference = `PO:${params.purchaseOrderNumber} GR:${params.goodsReceiptNumber}`;

    const createdMovementIds: string[] = [];

    if (params.quantityAccepted > 0) {
      const level = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: params.inventoryItemId,
            storageLocationId: params.storageLocationId,
          },
        },
      });

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_storageLocationId: {
            inventoryItemId: params.inventoryItemId,
            storageLocationId: params.storageLocationId,
          },
        },
        update: {
          quantityOnHand:
            (level?.quantityOnHand ?? 0) + params.quantityAccepted,
        },
        create: {
          inventoryItemId: params.inventoryItemId,
          storageLocationId: params.storageLocationId,
          quantityOnHand: params.quantityAccepted,
          quantityReserved: 0,
        },
      });

      const stockIn = await tx.stockMovement.create({
        data: {
          organizationId: params.organizationId,
          inventoryItemId: params.inventoryItemId,
          storageLocationId: params.storageLocationId,
          movementType: StockMovementTypeDto.StockIn,
          quantity: params.quantityAccepted,
          reference,
          reason: 'Goods receipt accepted quantity',
          notes: this.normalizeNullable(params.notes ?? null),
          createdByUserId: userId,
        },
        include: this.movementInclude,
      });

      createdMovementIds.push(stockIn.id);
    }

    if (params.quantityDamaged > 0) {
      const damaged = await tx.stockMovement.create({
        data: {
          organizationId: params.organizationId,
          inventoryItemId: params.inventoryItemId,
          storageLocationId: params.storageLocationId,
          movementType: StockMovementTypeDto.Damaged,
          quantity: params.quantityDamaged,
          reference,
          reason: 'Goods receipt damaged quantity',
          notes: this.normalizeNullable(params.notes ?? null),
          createdByUserId: userId,
        },
        include: this.movementInclude,
      });

      createdMovementIds.push(damaged.id);
    }

    return {
      inventoryItemName: context.item.name,
      storageLocationName: context.location.name,
      movementIds: createdMovementIds,
    };
  }

  private readonly itemInclude = {
    category: {
      select: {
        id: true,
        name: true,
      },
    },
    preferredSupplier: {
      select: {
        id: true,
        companyName: true,
      },
    },
  } as const;

  private readonly movementInclude = {
    inventoryItem: {
      select: {
        id: true,
        name: true,
      },
    },
    storageLocation: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const;

  private resolveItemOrderBy(sortBy: InventorySortBy) {
    if (sortBy === InventorySortBy.Sku) {
      return [{ sku: 'asc' as const }];
    }

    if (sortBy === InventorySortBy.Newest) {
      return [{ createdAt: 'desc' as const }];
    }

    if (sortBy === InventorySortBy.Oldest) {
      return [{ createdAt: 'asc' as const }];
    }

    return [{ name: 'asc' as const }];
  }

  private buildItemWhere(query: FindInventoryItemsQueryDto) {
    const tagTokens = this.parseSearchTokens(query.tags);
    const keywordTokens = this.parseSearchTokens(query.keywords);
    const andClauses: Prisma.InventoryItemWhereInput[] = [];

    if (query.search) {
      andClauses.push({
        OR: [
          {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            sku: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            barcode: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            shortDescription: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            marketplaceTitle: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            marketplaceDescription: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            longDescription: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            aiSummary: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            style: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            theme: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            material: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            colour: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            dimensions: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            manualTags: {
              has: query.search,
            },
          },
          {
            keywords: {
              has: query.search,
            },
          },
          {
            aiGeneratedTags: {
              has: query.search,
            },
          },
          {
            aiTags: {
              has: query.search,
            },
          },
          {
            aiKeywords: {
              has: query.search,
            },
          },
        ],
      });
    }

    if (tagTokens.length > 0) {
      andClauses.push({
        OR: [
          {
            manualTags: {
              hasSome: tagTokens,
            },
          },
          {
            aiGeneratedTags: {
              hasSome: tagTokens,
            },
          },
          {
            aiTags: {
              hasSome: tagTokens,
            },
          },
          {
            keywords: {
              hasSome: tagTokens,
            },
          },
        ],
      });
    }

    if (keywordTokens.length > 0) {
      andClauses.push({
        OR: [
          {
            aiKeywords: {
              hasSome: keywordTokens,
            },
          },
          {
            keywords: {
              hasSome: keywordTokens,
            },
          },
        ],
      });
    }

    const where: Prisma.InventoryItemWhereInput = {
      organizationId: query.organizationId,
      ...(andClauses.length > 0 ? { AND: andClauses } : {}),
      ...(query.style
        ? {
            style: {
              contains: query.style,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.material
        ? {
            material: {
              contains: query.material,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.colour
        ? {
            colour: {
              contains: query.colour,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.dimensions
        ? {
            dimensions: {
              contains: query.dimensions,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.itemType ? { itemType: query.itemType } : {}),
      ...(query.resourceStatus ? { resourceStatus: query.resourceStatus } : {}),
      ...(query.marketplaceVisibility
        ? { marketplaceVisibility: query.marketplaceVisibility }
        : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.preferredSupplierId
        ? { preferredSupplierId: query.preferredSupplierId }
        : {}),
    };

    return where;
  }

  private async getStockAggregateMap(itemIds: string[]) {
    const map = new Map<
      string,
      {
        quantityOnHand: number;
        quantityReserved: number;
      }
    >();

    if (itemIds.length === 0) {
      return map;
    }

    const rows = await this.prisma.stockLevel.groupBy({
      by: ['inventoryItemId'],
      where: {
        inventoryItemId: {
          in: itemIds,
        },
      },
      _sum: {
        quantityOnHand: true,
        quantityReserved: true,
      },
    });

    for (const row of rows) {
      map.set(row.inventoryItemId, {
        quantityOnHand: row._sum.quantityOnHand ?? 0,
        quantityReserved: row._sum.quantityReserved ?? 0,
      });
    }

    return map;
  }

  private mapItem(
    item: {
      id: string;
      organizationId: string;
      sku: string;
      publicName: string | null;
      internalName: string | null;
      barcode: string | null;
      qrCode: string | null;
      name: string;
      description: string | null;
      shortDescription: string | null;
      longDescription: string | null;
      internalNotes: string | null;
      marketplaceTitle: string | null;
      marketplaceDescription: string | null;
      aiSummary: string | null;
      aiKeywords: string[];
      aiTags: string[];
      aiConfidence: number | null;
      categoryId: string;
      subCategory: string | null;
      brand: string | null;
      preferredSupplierId: string | null;
      resourceStatus: string;
      itemType: string;
      unitOfMeasure: string;
      style: string | null;
      theme: string | null;
      colour: string | null;
      material: string | null;
      dimensions: string | null;
      weight: string | null;
      capacity: string | null;
      indoorOutdoor: string;
      suitableEventTypes: string[];
      manualTags: string[];
      keywords: string[];
      aiGeneratedTags: string[];
      marketplaceVisibility: string;
      photoUrls: string[];
      primaryPhotoUrl: string | null;
      photoAssets: Prisma.JsonValue | null;
      costPrice: number | null;
      replacementValue: number | null;
      rentalPrice: number | null;
      sellingPrice: number | null;
      taxable: boolean;
      active: boolean;
      trackQuantity: boolean;
      trackSerialNumbers: boolean;
      minimumStock: number | null;
      reorderLevel: number | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      category: { id: string; name: string };
      preferredSupplier: { id: string; companyName: string } | null;
    },
    stock: {
      quantityOnHand: number;
      quantityReserved: number;
    },
  ) {
    return {
      id: item.id,
      organizationId: item.organizationId,
      sku: item.sku,
      publicName: item.publicName,
      internalName: item.internalName,
      barcode: item.barcode,
      qrCode: item.qrCode,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription,
      longDescription: item.longDescription,
      internalNotes: item.internalNotes,
      marketplaceTitle: item.marketplaceTitle,
      marketplaceDescription: item.marketplaceDescription,
      aiSummary: item.aiSummary,
      aiKeywords: item.aiKeywords,
      aiTags: item.aiTags,
      aiConfidence: item.aiConfidence,
      categoryId: item.categoryId,
      subCategory: item.subCategory,
      brand: item.brand,
      categoryName: item.category.name,
      preferredSupplierId: item.preferredSupplierId,
      preferredSupplierName: item.preferredSupplier?.companyName ?? null,
      resourceStatus: item.resourceStatus,
      itemType: item.itemType,
      unitOfMeasure: item.unitOfMeasure,
      style: item.style,
      theme: item.theme,
      colour: item.colour,
      material: item.material,
      dimensions: item.dimensions,
      weight: item.weight,
      capacity: item.capacity,
      indoorOutdoor: item.indoorOutdoor,
      suitableEventTypes: item.suitableEventTypes,
      manualTags: item.manualTags,
      keywords: item.keywords,
      aiGeneratedTags: item.aiGeneratedTags,
      marketplaceVisibility: item.marketplaceVisibility,
      photoUrls: item.photoUrls,
      primaryPhotoUrl: item.primaryPhotoUrl,
      photoAssets: Array.isArray(item.photoAssets) ? item.photoAssets : null,
      costPrice: item.costPrice,
      replacementValue: item.replacementValue,
      rentalPrice: item.rentalPrice,
      sellingPrice: item.sellingPrice,
      taxable: item.taxable,
      active: item.active,
      trackQuantity: item.trackQuantity,
      trackSerialNumbers: item.trackSerialNumbers,
      minimumStock: item.minimumStock,
      reorderLevel: item.reorderLevel,
      notes: item.notes,
      stock: {
        quantityOnHand: stock.quantityOnHand,
        quantityReserved: stock.quantityReserved,
        quantityAvailable: this.quantityAvailable(
          stock.quantityOnHand,
          stock.quantityReserved,
        ),
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapMovement(movement: {
    id: string;
    organizationId: string;
    inventoryItemId: string;
    storageLocationId: string;
    movementType: PrismaStockMovementType;
    quantity: number;
    reference: string | null;
    reason: string | null;
    notes: string | null;
    createdByUserId: string;
    createdAt: Date;
    inventoryItem: { id: string; name: string };
    storageLocation: { id: string; name: string };
  }) {
    return {
      id: movement.id,
      organizationId: movement.organizationId,
      inventoryItemId: movement.inventoryItemId,
      inventoryItemName: movement.inventoryItem.name,
      storageLocationId: movement.storageLocationId,
      storageLocationName: movement.storageLocation.name,
      movementType: movement.movementType,
      quantity: movement.quantity,
      reference: movement.reference,
      reason: movement.reason,
      notes: movement.notes,
      createdByUserId: movement.createdByUserId,
      createdAt: movement.createdAt,
    };
  }

  private quantityAvailable(quantityOnHand: number, quantityReserved: number) {
    return quantityOnHand - quantityReserved;
  }

  private normalizeNullable(value: string | undefined | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private normalizeStringArray(values: string[] | undefined | null) {
    if (!values || values.length === 0) {
      return [];
    }

    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

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

  private async ensureCategoryOwnership(
    categoryId: string,
    organizationId: string,
  ) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Category does not belong to this organization',
      );
    }
  }

  private async ensureSupplierOwnership(
    supplierId: string,
    organizationId: string,
  ) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier || supplier.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Supplier does not belong to this organization',
      );
    }
  }

  private async getMovementContext(
    tx: Prisma.TransactionClient,
    organizationId: string,
    inventoryItemId: string,
    storageLocationId: string,
  ) {
    const [item, location] = await Promise.all([
      tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        select: {
          id: true,
          organizationId: true,
          active: true,
          name: true,
        },
      }),
      tx.storageLocation.findUnique({
        where: { id: storageLocationId },
        select: {
          id: true,
          organizationId: true,
          active: true,
          name: true,
        },
      }),
    ]);

    if (!item || item.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Inventory item is outside this organization',
      );
    }

    if (!location || location.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Storage location is outside this organization',
      );
    }

    if (!item.active) {
      throw new BadRequestException(
        'Inactive inventory items cannot receive stock movements',
      );
    }

    if (!location.active) {
      throw new BadRequestException(
        'Inactive storage locations cannot receive stock movements',
      );
    }

    return {
      item,
      location,
    };
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

    const allowed = Boolean(permissions.Inventory?.[action]);

    if (!allowed) {
      throw new ForbiddenException(`Missing Inventory ${action} permission`);
    }
  }

  private async resolveSupplierSkuSet(
    organizationId: string,
    supplierId?: string,
  ) {
    if (!supplierId) {
      return null;
    }

    const supplierItems = await this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        preferredSupplierId: supplierId,
      },
      select: {
        sku: true,
      },
    });

    const skus = supplierItems
      .map((item) => item.sku.trim())
      .filter((sku) => sku.length > 0);

    if (!skus.length) {
      return new Set<string>(['__no-sku-match__']);
    }

    return new Set(skus);
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

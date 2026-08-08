import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarketplaceCapabilityService } from './marketplace-capability.service';
import { MarketplaceFulfilmentStatus } from './dto/marketplace-fulfilment-status.enum';
import { MarketplaceSearchMode } from './dto/marketplace-search-mode.enum';

describe('MarketplaceCapabilityService', () => {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const prisma = {
    membership: {
      findFirst: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
    },
    resource: {
      findMany: jest.fn(),
    },
    resourceReservation: {
      findMany: jest.fn(),
    },
  };

  let service: MarketplaceCapabilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketplaceCapabilityService(prisma as never);

    prisma.membership.findFirst.mockResolvedValue({ id: 'membership-1' });
    prisma.supplier.findMany.mockResolvedValue([
      {
        id: 'supplier-own',
        companyName: 'Own Stock Co',
        city: 'Pretoria',
        province: 'Gauteng',
        internalRating: 4,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
      },
      {
        id: 'supplier-source',
        companyName: 'Source Blend Co',
        city: 'Pretoria',
        province: 'Gauteng',
        internalRating: 3,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
      },
      {
        id: 'supplier-partial',
        companyName: 'Partial Only Co',
        city: 'Johannesburg',
        province: 'Gauteng',
        internalRating: 2,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 'supplier-none',
        companyName: 'Unavailable Co',
        city: 'Cape Town',
        province: 'Western Cape',
        internalRating: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]);

    prisma.resource.findMany.mockResolvedValue([
      {
        id: 'resource-1',
        supplierId: 'supplier-own',
        name: 'Gold Tiffany Chair',
        category: 'Furniture',
        tags: ['gold', 'tiffany', 'stackable'],
        keywords: ['wedding', 'chair'],
        searchPhrases: ['gold tiffany chairs'],
        quantityMode: 'QUANTITY',
        totalQuantity: 200,
        status: 'AVAILABLE',
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        rentalPrice: 30,
      },
      {
        id: 'resource-2',
        supplierId: 'supplier-source',
        name: 'Gold Banquet Chair',
        category: 'Furniture',
        tags: ['gold', 'banquet'],
        keywords: ['chair'],
        searchPhrases: ['gold banquet chairs'],
        quantityMode: 'QUANTITY',
        totalQuantity: 60,
        status: 'AVAILABLE',
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        rentalPrice: 25,
      },
      {
        id: 'resource-3',
        supplierId: 'supplier-partial',
        name: 'Event Chair',
        category: 'Furniture',
        tags: ['chair'],
        keywords: ['event'],
        searchPhrases: ['event chairs'],
        quantityMode: 'QUANTITY',
        totalQuantity: 20,
        status: 'AVAILABLE',
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        rentalPrice: 27,
      },
    ]);

    prisma.resourceReservation.findMany.mockResolvedValue([
      {
        resourceId: 'resource-1',
        quantity: 10,
      },
    ]);
  });

  it('applies adaptive own-coverage threshold and prevents negligible own-stock flooding', async () => {
    const result = await service.searchCapability(userId, {
      searchMode: MarketplaceSearchMode.AI_ASSISTED,
      requirement: {
        itemOrService: 'Gold Tiffany Chairs',
        requiredQuantity: 150,
        startDateTime: '2026-09-15T00:00:00.000Z',
        endDateTime: '2026-09-17T23:59:59.000Z',
        deliveryLocation: 'Pretoria',
        specifications: ['Gold finish', 'Stackable'],
      },
    });

    const byId = new Map(
      result.suppliers.map((entry) => [entry.supplierId, entry]),
    );

    expect(result.appliedOwnCoverageThresholdPercentage).toBe(10);

    expect(byId.get('supplier-own')?.fulfilmentStatus).toBe(
      MarketplaceFulfilmentStatus.OWN_STOCK,
    );
    expect(byId.get('supplier-source')?.fulfilmentStatus).toBe(
      MarketplaceFulfilmentStatus.SOURCING_POSSIBLE,
    );
    expect(byId.get('supplier-partial')?.fulfilmentStatus).toBe(
      MarketplaceFulfilmentStatus.SOURCING_POSSIBLE,
    );
    expect(byId.get('supplier-none')).toBeUndefined();

    const source = byId.get('supplier-source');
    expect(source?.ownCoveragePercentage).toBe(40);
    expect(source?.sourcedCoveragePercentage).toBe(60);
    expect(source?.marketplaceSecondarySupplierCount).toBeGreaterThan(0);
    expect(source?.fulfilmentConfidenceScore).toBeGreaterThan(0);
  });

  it('classifies partial-only when total marketplace availability cannot fully satisfy requirement', async () => {
    const result = await service.searchCapability(userId, {
      searchMode: MarketplaceSearchMode.AI_ASSISTED,
      requirement: {
        itemOrService: 'Gold Tiffany Chairs',
        requiredQuantity: 400,
        startDateTime: '2026-09-15T00:00:00.000Z',
        endDateTime: '2026-09-17T23:59:59.000Z',
        deliveryLocation: 'Pretoria',
        specifications: ['Gold finish', 'Stackable'],
      },
    });

    const byId = new Map(
      result.suppliers.map((entry) => [entry.supplierId, entry]),
    );

    expect(byId.get('supplier-source')?.fulfilmentStatus).toBe(
      MarketplaceFulfilmentStatus.PARTIAL_ONLY,
    );
    expect(result.appliedOwnCoverageThresholdPercentage).toBe(10);
  });

  it('classifies unavailable when no matching marketplace stock exists for the date window', async () => {
    prisma.resource.findMany.mockResolvedValue([]);
    prisma.resourceReservation.findMany.mockResolvedValue([]);

    const result = await service.searchCapability(userId, {
      searchMode: MarketplaceSearchMode.MANUAL,
      requirement: {
        itemOrService: 'Gold Tiffany Chairs',
        requiredQuantity: 150,
        startDateTime: '2026-09-15T00:00:00.000Z',
        endDateTime: '2026-09-17T23:59:59.000Z',
        deliveryLocation: 'Pretoria',
        specifications: [],
      },
    });

    expect(result.suppliers).toEqual([]);
  });

  it('returns supplier shortfall summary without auto-commit actions', async () => {
    const result = await service.getSupplierShortfallSummary(userId, {
      searchMode: MarketplaceSearchMode.MANUAL,
      primarySupplierId: 'supplier-source',
      requirement: {
        itemOrService: 'Gold Tiffany Chairs',
        requiredQuantity: 150,
        startDateTime: '2026-09-15T00:00:00.000Z',
        endDateTime: '2026-09-17T23:59:59.000Z',
        deliveryLocation: 'Pretoria',
        specifications: [],
      },
    });

    expect(result.fulfilmentStatus).toBe(
      MarketplaceFulfilmentStatus.SOURCING_POSSIBLE,
    );
    expect(result.shortfallQuantity).toBe(90);
    expect(result.marketplaceSourcingOptionsExist).toBe(true);
    expect(result.allowedActions).toEqual(
      expect.arrayContaining([
        'Review sourcing options',
        'Request quotations from secondary suppliers',
        'Use own external sourcing',
        'Reduce quantity offered',
        'Decline RFQ',
      ]),
    );
  });

  it('throws not found for unknown primary supplier summary request', async () => {
    await expect(
      service.getSupplierShortfallSummary(userId, {
        primarySupplierId: 'missing-supplier',
        requirement: {
          itemOrService: 'Gold Tiffany Chairs',
          requiredQuantity: 150,
          startDateTime: '2026-09-15T00:00:00.000Z',
          endDateTime: '2026-09-17T23:59:59.000Z',
          deliveryLocation: 'Pretoria',
          specifications: [],
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws forbidden when user has no active ClientOS membership', async () => {
    prisma.membership.findFirst.mockResolvedValue(null);

    await expect(
      service.searchCapability(userId, {
        requirement: {
          itemOrService: 'Gold Tiffany Chairs',
          requiredQuantity: 150,
          startDateTime: '2026-09-15T00:00:00.000Z',
          endDateTime: '2026-09-17T23:59:59.000Z',
          deliveryLocation: 'Pretoria',
          specifications: [],
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

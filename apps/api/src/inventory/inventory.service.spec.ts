import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StockAdjustmentType } from './dto/create-stock-adjustment.dto';

describe('InventoryService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const inventoryItemId = 'item-1';
  const sourceLocationId = 'loc-1';
  const destinationLocationId = 'loc-2';

  const tx = {
    inventoryItem: {
      findUnique: jest.fn(),
    },
    storageLocation: {
      findUnique: jest.fn(),
    },
    stockLevel: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    inventoryCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    storageLocation: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inventoryItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    stockLevel: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: InventoryService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new InventoryService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    tx.inventoryItem.findUnique.mockResolvedValue({
      id: inventoryItemId,
      organizationId,
      active: true,
      name: 'Banquet Chair',
    });

    tx.storageLocation.findUnique
      .mockResolvedValueOnce({
        id: sourceLocationId,
        organizationId,
        active: true,
        name: 'Main Warehouse',
      })
      .mockResolvedValueOnce({
        id: destinationLocationId,
        organizationId,
        active: true,
        name: 'Branch Store',
      });

    prisma.$transaction.mockImplementation(async (handler: unknown) => {
      if (typeof handler === 'function') {
        const transactionHandler = handler as (
          client: typeof tx,
        ) => Promise<unknown>;
        return transactionHandler(tx);
      }

      return Promise.all(handler as Promise<unknown>[]);
    });
  });

  it('rejects transfer to the same location', async () => {
    await expect(
      service.createStockTransfer(userId, {
        organizationId,
        inventoryItemId,
        sourceLocationId,
        destinationLocationId: sourceLocationId,
        quantity: 2,
        reason: 'Move stock',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects decrease adjustment when quantity exceeds available stock', async () => {
    tx.storageLocation.findUnique.mockReset();
    tx.storageLocation.findUnique.mockResolvedValue({
      id: sourceLocationId,
      organizationId,
      active: true,
      name: 'Main Warehouse',
    });

    tx.stockLevel.findUnique.mockResolvedValue({
      inventoryItemId,
      storageLocationId: sourceLocationId,
      quantityOnHand: 5,
      quantityReserved: 4,
    });

    await expect(
      service.createStockAdjustment(userId, {
        organizationId,
        inventoryItemId,
        storageLocationId: sourceLocationId,
        adjustmentType: StockAdjustmentType.Decrease,
        quantity: 3,
        reason: 'Stock count',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates transfer out and transfer in movements in one transaction', async () => {
    tx.stockLevel.findUnique
      .mockResolvedValueOnce({
        inventoryItemId,
        storageLocationId: sourceLocationId,
        quantityOnHand: 10,
        quantityReserved: 2,
      })
      .mockResolvedValueOnce({
        inventoryItemId,
        storageLocationId: destinationLocationId,
        quantityOnHand: 3,
        quantityReserved: 0,
      });

    tx.stockMovement.create
      .mockResolvedValueOnce({
        id: 'm-out',
        organizationId,
        inventoryItemId,
        storageLocationId: sourceLocationId,
        movementType: 'TransferOut',
        quantity: 4,
        reference: null,
        reason: 'Move stock',
        notes: null,
        createdByUserId: userId,
        createdAt: new Date(),
        inventoryItem: { id: inventoryItemId, name: 'Banquet Chair' },
        storageLocation: { id: sourceLocationId, name: 'Main Warehouse' },
      })
      .mockResolvedValueOnce({
        id: 'm-in',
        organizationId,
        inventoryItemId,
        storageLocationId: destinationLocationId,
        movementType: 'TransferIn',
        quantity: 4,
        reference: null,
        reason: 'Move stock',
        notes: null,
        createdByUserId: userId,
        createdAt: new Date(),
        inventoryItem: { id: inventoryItemId, name: 'Banquet Chair' },
        storageLocation: { id: destinationLocationId, name: 'Branch Store' },
      });

    const result = await service.createStockTransfer(userId, {
      organizationId,
      inventoryItemId,
      sourceLocationId,
      destinationLocationId,
      quantity: 4,
      reason: 'Move stock',
    });

    expect(tx.stockLevel.upsert).toHaveBeenCalledTimes(2);
    expect(tx.stockMovement.create).toHaveBeenCalledTimes(2);
    expect(result.transferOut.movementType).toBe('TransferOut');
    expect(result.transferIn.movementType).toBe('TransferIn');
  });

  it('blocks users that do not have inventory view permission', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-2',
      userId,
      organizationId,
      role: 'Planner',
    });

    prisma.role.findFirst.mockResolvedValue({
      id: 'role-1',
      organizationId,
      name: 'Planner',
      permissions: JSON.stringify({
        Inventory: {
          View: false,
          Create: false,
          Edit: false,
          Delete: false,
        },
      }),
    });

    await expect(
      service.findCategories(userId, {
        organizationId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('persists resource intelligence fields when creating an item', async () => {
    prisma.inventoryCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      organizationId,
      active: true,
    });

    prisma.supplier.findUnique.mockResolvedValue({
      id: 'supplier-1',
      organizationId,
      active: true,
    });

    prisma.inventoryItem.create.mockResolvedValue({
      id: 'item-2',
      organizationId,
      sku: 'CHAIR-002',
      publicName: 'Banquet Chair Gold',
      internalName: 'Warehouse Chair 02',
      barcode: '123456',
      qrCode: 'QR-123456',
      name: 'Banquet Chair',
      description: 'Primary description',
      shortDescription: 'Short description',
      longDescription: 'Long description',
      internalNotes: 'Internal only',
      aiSummary: 'AI summary',
      aiKeywords: ['chair', 'gold'],
      aiTags: ['wedding'],
      aiConfidence: 0.92,
      categoryId: 'cat-1',
      subCategory: 'Seating',
      brand: 'Acme',
      preferredSupplierId: 'supplier-1',
      resourceStatus: 'Active',
      itemType: 'Furniture',
      unitOfMeasure: 'Each',
      style: 'Luxury',
      colour: 'Gold',
      material: 'Metal',
      dimensions: '50cm x 45cm x 90cm',
      weight: '6kg',
      capacity: '1 person',
      indoorOutdoor: 'Both',
      suitableEventTypes: ['Wedding', 'Corporate'],
      manualTags: ['hero'],
      aiGeneratedTags: ['premium'],
      marketplaceVisibility: 'Private',
      photoUrls: ['https://cdn.example.com/photo-1.jpg'],
      costPrice: 400,
      replacementValue: 800,
      rentalPrice: 120,
      sellingPrice: 0,
      taxable: false,
      active: true,
      trackQuantity: true,
      trackSerialNumbers: false,
      minimumStock: 10,
      reorderLevel: 20,
      notes: 'Handle with care',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'cat-1',
        name: 'Furniture',
      },
      preferredSupplier: {
        id: 'supplier-1',
        companyName: 'Acme Supplies',
      },
    });

    await service.createItem(userId, {
      organizationId,
      sku: 'CHAIR-002',
      publicName: 'Banquet Chair Gold',
      internalName: 'Warehouse Chair 02',
      barcode: '123456',
      qrCode: 'QR-123456',
      name: 'Banquet Chair',
      description: 'Primary description',
      shortDescription: 'Short description',
      longDescription: 'Long description',
      internalNotes: 'Internal only',
      aiSummary: 'AI summary',
      aiKeywords: ['chair', 'gold'],
      aiTags: ['wedding'],
      aiConfidence: 0.92,
      categoryId: 'cat-1',
      subCategory: 'Seating',
      brand: 'Acme',
      preferredSupplierId: 'supplier-1',
      resourceStatus: 'Active',
      itemType: 'Furniture',
      unitOfMeasure: 'Each',
      style: 'Luxury',
      colour: 'Gold',
      material: 'Metal',
      dimensions: '50cm x 45cm x 90cm',
      weight: '6kg',
      capacity: '1 person',
      indoorOutdoor: 'Both',
      suitableEventTypes: ['Wedding', 'Corporate'],
      manualTags: ['hero'],
      aiGeneratedTags: ['premium'],
      marketplaceVisibility: 'Private',
      photoUrls: ['https://cdn.example.com/photo-1.jpg'],
      costPrice: 400,
      replacementValue: 800,
      rentalPrice: 120,
      sellingPrice: 0,
      minimumStock: 10,
      reorderLevel: 20,
      notes: 'Handle with care',
    });

    expect(prisma.inventoryItem.create).toHaveBeenCalled();

    const createCall = prisma.inventoryItem.create.mock.calls[0] as
      | [
          {
            data: Record<string, unknown>;
          },
        ]
      | undefined;
    expect(createCall).toBeDefined();

    const createArgs = createCall?.[0];
    expect(createArgs).toBeDefined();
    expect(createArgs!.data).toMatchObject({
      publicName: 'Banquet Chair Gold',
      internalName: 'Warehouse Chair 02',
      qrCode: 'QR-123456',
      shortDescription: 'Short description',
      longDescription: 'Long description',
      aiSummary: 'AI summary',
      aiKeywords: ['chair', 'gold'],
      aiTags: ['wedding'],
      resourceStatus: 'Active',
      style: 'Luxury',
      material: 'Metal',
      colour: 'Gold',
      dimensions: '50cm x 45cm x 90cm',
      suitableEventTypes: ['Wedding', 'Corporate'],
      manualTags: ['hero'],
      aiGeneratedTags: ['premium'],
      marketplaceVisibility: 'Private',
      photoUrls: ['https://cdn.example.com/photo-1.jpg'],
    });
  });
});

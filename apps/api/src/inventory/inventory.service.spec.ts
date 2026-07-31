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
});

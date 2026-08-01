import { BadRequestException } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const supplierId = '22222222-2222-4222-8222-222222222222';
  const locationId = '33333333-3333-4333-8333-333333333333';
  const itemId = '44444444-4444-4444-8444-444444444444';
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const inventoryService = {
    applyGoodsReceiptMovements: jest.fn(),
  };

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    storageLocation: {
      findUnique: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseOrderLineItem: {
      deleteMany: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    goodsReceipt: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: PurchaseOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PurchaseOrdersService(
      prisma as never,
      inventoryService as never,
    );

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.supplier.findUnique.mockResolvedValue({
      id: supplierId,
      organizationId,
      active: true,
      companyName: 'Supplier',
    });

    prisma.storageLocation.findUnique.mockResolvedValue({
      id: locationId,
      organizationId,
      active: true,
    });

    prisma.inventoryItem.findMany.mockResolvedValue([
      {
        id: itemId,
        organizationId,
        active: true,
      },
    ]);

    prisma.$transaction.mockImplementation(async (handler: unknown) => {
      if (typeof handler === 'function') {
        const transactionHandler = handler as (
          client: typeof prisma,
        ) => Promise<unknown>;
        return transactionHandler(prisma);
      }

      return Promise.all(handler as Promise<unknown>[]);
    });
  });

  it('creates purchase order and computes totals from lines', async () => {
    prisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-1',
      organizationId,
      purchaseOrderNumber: 'PO-1001',
      supplierId,
      orderDate: new Date('2026-08-01T00:00:00.000Z'),
      expectedDeliveryDate: null,
      deliveryLocationId: locationId,
      status: 'Draft',
      currency: 'ZAR',
      subtotal: 200,
      taxAmount: 30,
      totalAmount: 230,
      supplierReference: null,
      internalReference: null,
      notes: null,
      createdByUserId: userId,
      approvedByUserId: null,
      approvedAt: null,
      sentAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      supplier: { id: supplierId, companyName: 'Supplier' },
      deliveryLocation: { id: locationId, name: 'Main Warehouse' },
      createdBy: { id: userId, name: 'Owner' },
      approvedBy: null,
      lineItems: [
        {
          id: 'line-1',
          purchaseOrderId: 'po-1',
          inventoryItemId: itemId,
          description: 'Chair',
          supplierSku: null,
          quantityOrdered: 2,
          quantityReceived: 0,
          unitPrice: 100,
          taxRate: 15,
          lineSubtotal: 200,
          lineTax: 30,
          lineTotal: 230,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          inventoryItem: {
            id: itemId,
            name: 'Chair',
            sku: 'CHR-1',
            active: true,
          },
        },
      ],
    });

    const result = await service.create(userId, {
      organizationId,
      purchaseOrderNumber: 'PO-1001',
      supplierId,
      orderDate: '2026-08-01T00:00:00.000Z',
      deliveryLocationId: locationId,
      lineItems: [
        {
          inventoryItemId: itemId,
          description: 'Chair',
          quantityOrdered: 2,
          unitPrice: 100,
          taxRate: 15,
        },
      ],
    });

    expect(prisma.purchaseOrder.create).toHaveBeenCalled();
    expect(result.totalAmount).toBe(230);
    expect(result.status).toBe('Draft');
  });

  it('rejects duplicate inventory lines in the same purchase order', async () => {
    await expect(
      service.create(userId, {
        organizationId,
        purchaseOrderNumber: 'PO-1002',
        supplierId,
        orderDate: '2026-08-01T00:00:00.000Z',
        deliveryLocationId: locationId,
        lineItems: [
          {
            inventoryItemId: itemId,
            description: 'Chair',
            quantityOrdered: 1,
            unitPrice: 50,
          },
          {
            inventoryItemId: itemId,
            description: 'Chair duplicate',
            quantityOrdered: 2,
            unitPrice: 55,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects mark-as-sent transition when purchase order is not approved', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      organizationId,
      purchaseOrderNumber: 'PO-1001',
      supplierId,
      orderDate: new Date(),
      expectedDeliveryDate: null,
      deliveryLocationId: locationId,
      status: 'Draft',
      currency: 'ZAR',
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      supplierReference: null,
      internalReference: null,
      notes: null,
      createdByUserId: userId,
      approvedByUserId: null,
      approvedAt: null,
      sentAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      supplier: { id: supplierId, companyName: 'Supplier' },
      deliveryLocation: { id: locationId, name: 'Main Warehouse' },
      createdBy: { id: userId, name: 'Owner' },
      approvedBy: null,
      lineItems: [],
    });

    await expect(service.markSent(userId, 'po-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

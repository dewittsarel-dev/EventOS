import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupplierCategory } from './dto/supplier-category.enum';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const supplierId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  function makeSupplier(overrides: Record<string, unknown> = {}) {
    return {
      id: supplierId,
      organizationId,
      companyName: 'Sunrise Catering Co.',
      category: SupplierCategory.Catering,
      primaryContactName: 'Maya Jacobs',
      phone: '+27 21 555 1234',
      mobile: '+27 82 000 0000',
      email: 'hello@sunrise-catering.co.za',
      website: 'https://sunrise-catering.co.za',
      physicalAddress: '12 Harbour Road',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      vatNumber: '4010123456',
      registrationNumber: '2019/123456/07',
      preferredSupplier: false,
      active: true,
      preferredPaymentTerms: '30 days EOM',
      internalRating: 4,
      notes: 'Reliable supplier',
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: {
        id: organizationId,
        name: 'EventOS HQ',
      },
      ...overrides,
    };
  }

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    supplier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseOrder: {
      count: jest.fn(),
    },
    inventoryItem: {
      count: jest.fn(),
    },
    supplierQuotation: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: SuppliersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SuppliersService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });
    prisma.supplier.findFirst.mockResolvedValue(null);
    prisma.purchaseOrder.count.mockResolvedValue(0);
    prisma.inventoryItem.count.mockResolvedValue(0);
    prisma.supplierQuotation.count.mockResolvedValue(0);
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
  });

  it('creates a supplier with organization scope enforcement', async () => {
    prisma.supplier.create.mockResolvedValue(makeSupplier());

    const result = await service.create(userId, {
      organizationId,
      companyName: '  Sunrise Catering Co.  ',
      category: SupplierCategory.Catering,
      preferredSupplier: true,
    });

    expect(prisma.supplier.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: supplierId,
        companyName: 'Sunrise Catering Co.',
        organizationName: 'EventOS HQ',
      }),
    );
  });

  it('lists suppliers with pagination and filtering', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.supplier.findMany.mockResolvedValue([makeSupplier()]);
    prisma.supplier.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 2,
      limit: 5,
      search: 'sunrise',
      category: SupplierCategory.Catering,
      preferredSupplier: true,
      active: true,
      sortBy: 'companyName',
    });

    expect(prisma.supplier.findMany).toHaveBeenCalled();
    expect(result.meta).toEqual({ page: 2, limit: 5, total: 1 });
  });

  it('throws forbidden for cross-organization access', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(
      service.findAll(userId, {
        organizationId: otherOrganizationId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found on missing supplier read', async () => {
    prisma.supplier.findUnique.mockResolvedValue(null);

    await expect(service.findOne(userId, supplierId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes supplier in own organization when no dependencies exist', async () => {
    prisma.supplier.findUnique.mockResolvedValue(makeSupplier());

    await service.remove(userId, supplierId);

    expect(prisma.supplier.delete).toHaveBeenCalledWith({
      where: { id: supplierId },
    });
  });

  it('archives supplier by setting active to false', async () => {
    prisma.supplier.findUnique.mockResolvedValue(makeSupplier());
    prisma.supplier.update.mockResolvedValue(
      makeSupplier({
        active: false,
      }),
    );

    const result = await service.archive(userId, supplierId);

    expect(prisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: supplierId },
        data: { active: false },
      }),
    );
    expect(result.active).toBe(false);
  });

  it('fails delete when supplier has dependencies', async () => {
    prisma.supplier.findUnique.mockResolvedValue(makeSupplier());
    prisma.purchaseOrder.count.mockResolvedValue(1);

    await expect(service.remove(userId, supplierId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.supplier.delete).not.toHaveBeenCalled();
  });

  it('fails create on duplicate VAT number in organization', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 'existing-supplier' });

    await expect(
      service.create(userId, {
        organizationId,
        companyName: 'New Supplier',
        category: SupplierCategory.Other,
        vatNumber: '12345',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

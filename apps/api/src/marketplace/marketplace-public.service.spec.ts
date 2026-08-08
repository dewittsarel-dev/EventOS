import { NotFoundException } from '@nestjs/common';
import { MarketplacePublicService } from './marketplace-public.service';

describe('MarketplacePublicService', () => {
  const resource = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  };
  const membership = { findFirst: jest.fn() };
  const marketplaceEnquiry = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  const auditLog = { create: jest.fn() };
  const prisma = {
    resource,
    membership,
    marketplaceEnquiry,
    auditLog,
    $transaction: jest.fn(
      (operation: (transaction: unknown) => Promise<unknown>) =>
        operation({ marketplaceEnquiry, auditLog }),
    ),
  };
  const service = new MarketplacePublicService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns only the explicit public projection', async () => {
    prisma.resource.findMany.mockResolvedValue([
      {
        id: 'item-1',
        name: 'Gold Chair',
        description: 'Elegant seating',
        tags: ['Wedding'],
        imageUrls: [],
        rentalPrice: 30,
        unit: 'Each',
        category: 'Furniture',
        resourceType: 'ASSET',
        quantityMode: 'QUANTITY',
        status: 'AVAILABLE',
        condition: 'GOOD',
        totalQuantity: 120,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        reservations: [],
        organization: {
          tradingName: 'Celebrations',
          name: 'Celebrations Pty',
          slug: 'celebrations',
          logoUrl: null,
          website: 'https://celebrations.example',
        },
      },
    ]);
    prisma.resource.count.mockResolvedValue(1);

    const result = await service.findListings({ page: 1, limit: 24 });
    expect(result.items[0]).toMatchObject({
      title: 'Gold Chair',
      supplierName: 'Celebrations',
      supplierSlug: 'celebrations',
      categoryName: 'Furniture',
    });
    expect(prisma.resource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher is intentionally dynamic in this assertion.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          archivedAt: null,
          visibility: 'MARKETPLACE',
        }),
      }),
    );
    expect(result.items[0]).not.toHaveProperty('costPrice');
  });

  it('applies public category, type and supplier filters', async () => {
    prisma.resource.findMany.mockResolvedValue([]);
    prisma.resource.count.mockResolvedValue(0);

    await service.findListings({
      page: 1,
      limit: 24,
      category: 'Furniture',
      resourceType: 'ASSET',
      supplier: 'celebrations',
    });

    expect(prisma.resource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher is intentionally dynamic in this assertion.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          category: { equals: 'Furniture', mode: 'insensitive' },
          resourceType: 'ASSET',
          organization: { slug: 'celebrations' },
        }),
      }),
    );
  });

  it('creates an enquiry against the published listing owner', async () => {
    prisma.resource.findFirst.mockResolvedValue({
      id: 'item-1',
      organizationId: 'org-1',
    });
    prisma.marketplaceEnquiry.create.mockResolvedValue({
      id: 'enquiry-1',
      status: 'New',
      createdAt: new Date(),
    });
    await service.createEnquiry({
      resourceId: 'item-1',
      customerName: 'Sam',
      customerEmail: 'sam@example.com',
      message: 'Need 100 chairs',
    });
    expect(prisma.marketplaceEnquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher is intentionally dynamic in this assertion.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ organizationId: 'org-1' }),
      }),
    );
  });

  it('rejects enquiries for non-public listings', async () => {
    prisma.resource.findFirst.mockResolvedValue(null);
    await expect(
      service.createEnquiry({
        resourceId: 'item-1',
        customerName: 'Sam',
        customerEmail: 'sam@example.com',
        message: 'Hello',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records an audited operator status change', async () => {
    prisma.membership.findFirst.mockResolvedValue({ id: 'membership-1' });
    prisma.marketplaceEnquiry.findFirst.mockResolvedValue({
      id: 'enquiry-1',
      status: 'New',
    });
    prisma.marketplaceEnquiry.update.mockResolvedValue({
      id: 'enquiry-1',
      status: 'Acknowledged',
      updatedAt: new Date(),
    });

    const result = await service.updateEnquiryStatus(
      'user-1',
      'org-1',
      'enquiry-1',
      'Acknowledged',
    );

    expect(result.status).toBe('Acknowledged');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher is intentionally dynamic in this assertion.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          action: 'marketplace.enquiry_status_changed',
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      }),
    );
  });
});

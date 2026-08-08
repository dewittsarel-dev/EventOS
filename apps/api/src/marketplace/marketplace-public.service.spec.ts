import { NotFoundException } from '@nestjs/common';
import { MarketplacePublicService } from './marketplace-public.service';

describe('MarketplacePublicService', () => {
  const prisma = {
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    marketplaceEnquiry: { create: jest.fn() },
  };
  const service = new MarketplacePublicService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns only the explicit public projection', async () => {
    prisma.inventoryItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        marketplaceTitle: 'Gold Chair',
        publicName: null,
        marketplaceDescription: 'Elegant seating',
        shortDescription: null,
        brand: null,
        style: null,
        theme: null,
        colour: 'Gold',
        material: null,
        dimensions: null,
        capacity: null,
        suitableEventTypes: ['Wedding'],
        photoUrls: [],
        primaryPhotoUrl: null,
        rentalPrice: 30,
        sellingPrice: null,
        unitOfMeasure: 'Each',
        category: { name: 'Furniture' },
        organization: {
          tradingName: 'Celebrations',
          name: 'Celebrations Pty',
          logoUrl: null,
        },
      },
    ]);
    prisma.inventoryItem.count.mockResolvedValue(1);

    const result = await service.findListings({ page: 1, limit: 24 });
    expect(result.items[0]).toMatchObject({
      title: 'Gold Chair',
      supplierName: 'Celebrations',
      categoryName: 'Furniture',
    });
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher is intentionally dynamic in this assertion.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          active: true,
          marketplaceVisibility: 'Public',
        }),
      }),
    );
    expect(result.items[0]).not.toHaveProperty('costPrice');
  });

  it('creates an enquiry against the published listing owner', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue({
      id: 'item-1',
      organizationId: 'org-1',
    });
    prisma.marketplaceEnquiry.create.mockResolvedValue({
      id: 'enquiry-1',
      status: 'New',
      createdAt: new Date(),
    });
    await service.createEnquiry({
      inventoryItemId: 'item-1',
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
    prisma.inventoryItem.findFirst.mockResolvedValue(null);
    await expect(
      service.createEnquiry({
        inventoryItemId: 'item-1',
        customerName: 'Sam',
        customerEmail: 'sam@example.com',
        message: 'Hello',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMarketplaceVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketplaceEnquiryDto } from './dto/create-marketplace-enquiry.dto';
import { FindMarketplaceListingsQueryDto } from './dto/find-marketplace-listings-query.dto';

const publicListingSelect = {
  id: true,
  marketplaceTitle: true,
  publicName: true,
  marketplaceDescription: true,
  shortDescription: true,
  brand: true,
  style: true,
  theme: true,
  colour: true,
  material: true,
  dimensions: true,
  capacity: true,
  suitableEventTypes: true,
  photoUrls: true,
  primaryPhotoUrl: true,
  rentalPrice: true,
  sellingPrice: true,
  unitOfMeasure: true,
  category: { select: { name: true } },
  organization: {
    select: { tradingName: true, name: true, logoUrl: true },
  },
} satisfies Prisma.InventoryItemSelect;

@Injectable()
export class MarketplacePublicService {
  constructor(private readonly prisma: PrismaService) {}

  async findListings(query: FindMarketplaceListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const where: Prisma.InventoryItemWhereInput = {
      active: true,
      marketplaceVisibility: InventoryMarketplaceVisibility.Public,
      ...(query.search
        ? {
            OR: [
              {
                marketplaceTitle: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { publicName: { contains: query.search, mode: 'insensitive' } },
              {
                marketplaceDescription: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                category: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              { style: { contains: query.search, mode: 'insensitive' } },
              { colour: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        select: publicListingSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toPublicListing(item)),
      total,
      page,
      limit,
    };
  }

  async findListing(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id,
        active: true,
        marketplaceVisibility: InventoryMarketplaceVisibility.Public,
      },
      select: publicListingSelect,
    });

    if (!item) throw new NotFoundException('Marketplace listing not found');
    return this.toPublicListing(item);
  }

  async createEnquiry(dto: CreateMarketplaceEnquiryDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id: dto.inventoryItemId,
        active: true,
        marketplaceVisibility: InventoryMarketplaceVisibility.Public,
      },
      select: { id: true, organizationId: true },
    });

    if (!item) throw new NotFoundException('Marketplace listing not found');

    const enquiry = await this.prisma.marketplaceEnquiry.create({
      data: { ...dto, organizationId: item.organizationId },
      select: { id: true, status: true, createdAt: true },
    });

    return {
      ...enquiry,
      message: 'Your enquiry has been sent to the supplier.',
    };
  }

  async findOrganizationEnquiries(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organizationId, isDisabled: false },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Organization not found');

    return this.prisma.marketplaceEnquiry.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        eventDate: true,
        eventLocation: true,
        quantity: true,
        message: true,
        createdAt: true,
        inventoryItem: {
          select: { id: true, marketplaceTitle: true, publicName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private toPublicListing(
    item: Prisma.InventoryItemGetPayload<{
      select: typeof publicListingSelect;
    }>,
  ) {
    return {
      ...item,
      title: item.marketplaceTitle || item.publicName,
      description: item.marketplaceDescription || item.shortDescription,
      supplierName: item.organization.tradingName || item.organization.name,
      categoryName: item.category.name,
      organization: undefined,
      category: undefined,
    };
  }
}

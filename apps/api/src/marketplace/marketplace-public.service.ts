import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MarketplaceEnquiryStatus,
  Prisma,
  ResourceQuantityMode,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketplaceEnquiryDto } from './dto/create-marketplace-enquiry.dto';
import { FindMarketplaceListingsQueryDto } from './dto/find-marketplace-listings-query.dto';

const publicListingSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  tags: true,
  imageUrls: true,
  resourceType: true,
  quantityMode: true,
  status: true,
  condition: true,
  totalQuantity: true,
  damagedQuantity: true,
  maintenanceQuantity: true,
  rentalPrice: true,
  unit: true,
  reservations: {
    where: {
      status: { in: ['PENDING', 'RESERVED', 'CONFIRMED', 'DISPATCHED'] },
    },
    select: { quantity: true, startDateTime: true, endDateTime: true },
  },
  organization: {
    select: {
      tradingName: true,
      name: true,
      slug: true,
      logoUrl: true,
      website: true,
    },
  },
} satisfies Prisma.ResourceSelect;

@Injectable()
export class MarketplacePublicService {
  constructor(private readonly prisma: PrismaService) {}

  async findListings(query: FindMarketplaceListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const where: Prisma.ResourceWhereInput = {
      archivedAt: null,
      visibility: ResourceVisibility.MARKETPLACE,
      status: { not: ResourceStatus.RETIRED },
      ...(query.category
        ? { category: { equals: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.resourceType
        ? { resourceType: query.resourceType as ResourceType }
        : {}),
      ...(query.supplier ? { organization: { slug: query.supplier } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search } },
              { keywords: { has: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        select: publicListingSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toPublicListing(item)),
      total,
      page,
      limit,
    };
  }

  async findListing(id: string) {
    const item = await this.prisma.resource.findFirst({
      where: {
        id,
        archivedAt: null,
        visibility: ResourceVisibility.MARKETPLACE,
        status: { not: ResourceStatus.RETIRED },
      },
      select: publicListingSelect,
    });
    if (!item) throw new NotFoundException('Marketplace listing not found');
    return this.toPublicListing(item);
  }

  async createEnquiry(dto: CreateMarketplaceEnquiryDto) {
    const resource = await this.prisma.resource.findFirst({
      where: {
        id: dto.resourceId,
        archivedAt: null,
        visibility: ResourceVisibility.MARKETPLACE,
        status: { not: ResourceStatus.RETIRED },
      },
      select: { id: true, organizationId: true },
    });
    if (!resource) throw new NotFoundException('Marketplace listing not found');

    const enquiry = await this.prisma.marketplaceEnquiry.create({
      data: { ...dto, organizationId: resource.organizationId },
      select: { id: true, status: true, createdAt: true },
    });
    return {
      ...enquiry,
      message: 'Your enquiry has been sent to the supplier.',
    };
  }

  async findOrganizationEnquiries(userId: string, organizationId: string) {
    await this.ensureOrganizationMembership(userId, organizationId);
    const enquiries = await this.prisma.marketplaceEnquiry.findMany({
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
        resource: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enquiries.map((entry) => ({
      id: entry.id,
      status: entry.status,
      customerName: entry.customerName,
      customerEmail: entry.customerEmail,
      customerPhone: entry.customerPhone,
      eventDate: entry.eventDate,
      eventLocation: entry.eventLocation,
      quantity: entry.quantity,
      message: entry.message,
      createdAt: entry.createdAt,
      listing: entry.resource ?? {
        id: entry.inventoryItem?.id ?? '',
        name:
          entry.inventoryItem?.marketplaceTitle ??
          entry.inventoryItem?.publicName ??
          'Legacy Marketplace listing',
      },
    }));
  }

  async updateEnquiryStatus(
    userId: string,
    organizationId: string,
    enquiryId: string,
    status: MarketplaceEnquiryStatus,
  ) {
    await this.ensureOrganizationMembership(userId, organizationId);
    const current = await this.prisma.marketplaceEnquiry.findFirst({
      where: { id: enquiryId, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw new NotFoundException('Marketplace enquiry not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.marketplaceEnquiry.update({
        where: { id: enquiryId },
        data: { status },
        select: { id: true, status: true, updatedAt: true },
      });
      await tx.auditLog.create({
        data: {
          action: 'marketplace.enquiry_status_changed',
          details: JSON.stringify({
            enquiryId,
            fromStatus: current.status,
            toStatus: status,
          }),
          userId,
          organizationId,
        },
      });
      return updated;
    });
  }

  private async ensureOrganizationMembership(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organizationId, isDisabled: false },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Organization not found');
  }

  private toPublicListing(
    item: Prisma.ResourceGetPayload<{ select: typeof publicListingSelect }>,
  ) {
    const now = new Date();
    const reservedNow = item.reservations
      .filter(
        (reservation) =>
          reservation.startDateTime <= now && reservation.endDateTime >= now,
      )
      .reduce((total, reservation) => total + reservation.quantity, 0);
    const availableQuantity =
      item.quantityMode === ResourceQuantityMode.UNLIMITED
        ? null
        : Math.max(
            (item.totalQuantity ?? 0) -
              reservedNow -
              item.damagedQuantity -
              item.maintenanceQuantity,
            0,
          );
    const availabilityStatus =
      item.status === ResourceStatus.MAINTENANCE ||
      item.status === ResourceStatus.DAMAGED
        ? 'Unavailable'
        : availableQuantity === null || availableQuantity > 0
          ? 'Available'
          : 'Fully booked';

    return {
      id: item.id,
      title: item.name,
      description: item.description,
      supplierName: item.organization.tradingName || item.organization.name,
      supplierSlug: item.organization.slug,
      supplierLogoUrl: item.organization.logoUrl,
      supplierWebsite: this.publicWebsite(item.organization.website),
      categoryName: item.category,
      tags: item.tags,
      photoUrls: item.imageUrls,
      primaryPhotoUrl: item.imageUrls[0] ?? null,
      rentalPrice: item.rentalPrice,
      unitOfMeasure: item.unit,
      resourceType: item.resourceType,
      availabilityStatus,
    };
  }

  private publicWebsite(value: string | null) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:'
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
}

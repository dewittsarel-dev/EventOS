import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarketplaceEnquiryType,
  MarketplaceEnquiryStatus,
  MarketplaceMessageAuthorRole,
  Prisma,
  ResourceQuantityMode,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
  SalesOpportunityStatus,
  SupplierProductAvailability,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketplaceEnquiryDto } from './dto/create-marketplace-enquiry.dto';
import { CreateMarketplaceSolutionRequestDto } from './dto/create-marketplace-solution-request.dto';
import { FindMarketplaceListingsQueryDto } from './dto/find-marketplace-listings-query.dto';
import { scoreMarketplaceListing } from './marketplace-listing-search';
import {
  ConvertSalesOpportunityDto,
  UpdateSalesOpportunityDto,
} from './dto/sales-opportunity.dto';

const publicListingSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  tags: true,
  keywords: true,
  searchPhrases: true,
  aiSummary: true,
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
  supplierAvailability: true,
  leadTimeDays: true,
  minimumOrderQuantity: true,
  deliveryAvailable: true,
  pickupAvailable: true,
  deliveryRadiusKm: true,
  deliveryFee: true,
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
    };

    if (query.search) {
      const candidates = await this.prisma.resource.findMany({
        where,
        select: publicListingSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      });
      const ranked = candidates
        .map((item) => ({
          item,
          score: scoreMarketplaceListing(item, query.search!),
        }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score);
      return {
        items: ranked
          .slice((page - 1) * limit, page * limit)
          .map(({ item }) => this.toPublicListing(item)),
        total: ranked.length,
        page,
        limit,
      };
    }

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

  async createSolutionRequest(dto: CreateMarketplaceSolutionRequestDto) {
    const resource = await this.prisma.resource.findFirst({
      where: {
        organization: { slug: dto.supplierSlug },
        archivedAt: null,
        visibility: ResourceVisibility.MARKETPLACE,
        status: { not: ResourceStatus.RETIRED },
      },
      select: { id: true, organizationId: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!resource)
      throw new NotFoundException('Marketplace supplier not found');

    // The supplier slug identifies the public supplier but is not enquiry data.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { supplierSlug: _supplierSlug, eventDate, ...request } = dto;
    const enquiry = await this.prisma.marketplaceEnquiry.create({
      data: {
        ...request,
        enquiryType: MarketplaceEnquiryType.Solution,
        resourceId: resource.id,
        organizationId: resource.organizationId,
        eventDate: eventDate ? new Date(eventDate) : undefined,
      },
      select: { id: true, status: true, createdAt: true },
    });
    return {
      ...enquiry,
      message: 'Your solution request has been sent to the supplier.',
    };
  }

  async findOrganizationEnquiries(userId: string, organizationId: string) {
    await this.ensureOrganizationMembership(userId, organizationId);
    const enquiries = await this.prisma.marketplaceEnquiry.findMany({
      where: { organizationId },
      select: {
        id: true,
        enquiryType: true,
        requestTitle: true,
        serviceCategories: true,
        eventType: true,
        guestCount: true,
        budgetCents: true,
        desiredOutcomes: true,
        scheduleNotes: true,
        accessNotes: true,
        attachmentUrls: true,
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
        salesOpportunity: {
          select: {
            id: true,
            status: true,
            title: true,
            eventType: true,
            eventDate: true,
            venue: true,
            estimatedValueCents: true,
            qualificationNotes: true,
            confirmationEvidenceType: true,
            confirmationReference: true,
            eventId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' as const },
          select: { id: true, authorRole: true, body: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enquiries.map((entry) => ({
      id: entry.id,
      enquiryType: entry.enquiryType,
      requestTitle: entry.requestTitle,
      serviceCategories: entry.serviceCategories,
      eventType: entry.eventType,
      guestCount: entry.guestCount,
      budgetCents: entry.budgetCents,
      desiredOutcomes: entry.desiredOutcomes,
      scheduleNotes: entry.scheduleNotes,
      accessNotes: entry.accessNotes,
      attachmentUrls: entry.attachmentUrls,
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
      opportunity: entry.salesOpportunity,
      messages: entry.messages,
    }));
  }

  async createSalesOpportunity(
    userId: string,
    organizationId: string,
    enquiryId: string,
  ) {
    await this.ensureOrganizationMembership(userId, organizationId);
    const enquiry = await this.prisma.marketplaceEnquiry.findFirst({
      where: { id: enquiryId, organizationId },
      include: { resource: { select: { name: true } }, salesOpportunity: true },
    });
    if (!enquiry) throw new NotFoundException('Marketplace enquiry not found');
    if (enquiry.salesOpportunity) return enquiry.salesOpportunity;

    return this.prisma.$transaction(async (tx) => {
      const qualificationNotes = [
        enquiry.message,
        enquiry.serviceCategories?.length
          ? `Services: ${enquiry.serviceCategories.join(', ')}`
          : null,
        enquiry.guestCount ? `Guests: ${enquiry.guestCount}` : null,
        enquiry.desiredOutcomes?.length
          ? `Desired outcomes: ${enquiry.desiredOutcomes.join('; ')}`
          : null,
        enquiry.scheduleNotes ? `Schedule: ${enquiry.scheduleNotes}` : null,
        enquiry.accessNotes ? `Access: ${enquiry.accessNotes}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      const opportunity = await tx.salesOpportunity.create({
        data: {
          organizationId,
          marketplaceEnquiryId: enquiry.id,
          title:
            enquiry.requestTitle ??
            `${enquiry.customerName} — ${enquiry.resource?.name ?? 'Marketplace enquiry'}`,
          eventType: enquiry.eventType,
          eventDate: enquiry.eventDate,
          venue: enquiry.eventLocation,
          estimatedValueCents: enquiry.budgetCents,
          qualificationNotes,
          createdByUserId: userId,
        },
      });
      await tx.marketplaceEnquiry.update({
        where: { id: enquiry.id },
        data: { status: 'Acknowledged' },
      });
      await tx.auditLog.create({
        data: {
          action: 'marketplace.opportunity_created',
          details: JSON.stringify({ enquiryId, opportunityId: opportunity.id }),
          userId,
          organizationId,
        },
      });
      return opportunity;
    });
  }

  async updateSalesOpportunity(
    userId: string,
    opportunityId: string,
    dto: UpdateSalesOpportunityDto,
  ) {
    await this.ensureOrganizationMembership(userId, dto.organizationId);
    const opportunity = await this.prisma.salesOpportunity.findFirst({
      where: { id: opportunityId, organizationId: dto.organizationId },
    });
    if (!opportunity)
      throw new NotFoundException('Sales opportunity not found');
    if (opportunity.eventId)
      throw new BadRequestException(
        'Converted opportunities cannot be changed',
      );
    if (dto.status === SalesOpportunityStatus.Won)
      throw new BadRequestException(
        'Use the controlled Event conversion action to mark an opportunity Won',
      );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesOpportunity.update({
        where: { id: opportunityId },
        data: {
          status: dto.status,
          title: dto.title,
          eventType: dto.eventType,
          eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
          venue: dto.venue,
          estimatedValueCents: dto.estimatedValueCents,
          qualificationNotes: dto.qualificationNotes,
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'marketplace.opportunity_updated',
          details: JSON.stringify({ opportunityId, status: updated.status }),
          userId,
          organizationId: dto.organizationId,
        },
      });
      return updated;
    });
  }

  async convertSalesOpportunity(
    userId: string,
    opportunityId: string,
    dto: ConvertSalesOpportunityDto,
  ) {
    await this.ensureOrganizationMembership(userId, dto.organizationId);
    const opportunity = await this.prisma.salesOpportunity.findFirst({
      where: { id: opportunityId, organizationId: dto.organizationId },
      include: { marketplaceEnquiry: true },
    });
    if (!opportunity)
      throw new NotFoundException('Sales opportunity not found');
    if (opportunity.eventId)
      throw new BadRequestException(
        'This opportunity has already been converted',
      );
    if (opportunity.status !== SalesOpportunityStatus.Qualified)
      throw new BadRequestException(
        'Opportunity must be Qualified before Event conversion',
      );
    if (dto.assignedUserId) {
      const assignee = await this.prisma.membership.findFirst({
        where: {
          userId: dto.assignedUserId,
          organizationId: dto.organizationId,
          isDisabled: false,
        },
        select: { id: true },
      });
      if (!assignee)
        throw new BadRequestException(
          'Assigned user is not an active organization member',
        );
    }
    const startDateTime = new Date(
      `${dto.eventDate.slice(0, 10)}T${dto.startTime}:00.000Z`,
    );
    const endDateTime = new Date(
      `${dto.eventDate.slice(0, 10)}T${dto.endTime}:00.000Z`,
    );
    if (endDateTime < startDateTime)
      throw new BadRequestException(
        'endTime must be greater than or equal to startTime',
      );

    return this.prisma.$transaction(async (tx) => {
      let contact = await tx.contact.findFirst({
        where: {
          organizationId: dto.organizationId,
          email: {
            equals: opportunity.marketplaceEnquiry.customerEmail,
            mode: 'insensitive',
          },
          archivedAt: null,
        },
      });
      if (!contact) {
        const [firstName, ...lastNameParts] =
          opportunity.marketplaceEnquiry.customerName.trim().split(/\s+/);
        contact = await tx.contact.create({
          data: {
            organizationId: dto.organizationId,
            firstName: firstName || opportunity.marketplaceEnquiry.customerName,
            lastName: lastNameParts.join(' ') || undefined,
            email: opportunity.marketplaceEnquiry.customerEmail,
            phone: opportunity.marketplaceEnquiry.customerPhone,
            contactType: 'Marketplace Lead',
            notes: `Created from Marketplace enquiry ${opportunity.marketplaceEnquiryId}`,
          },
        });
      }
      const event = await tx.event.create({
        data: {
          organizationId: dto.organizationId,
          contactId: contact.id,
          assignedUserId: dto.assignedUserId,
          title: dto.title,
          eventType: dto.eventType,
          eventDate: new Date(dto.eventDate),
          startTime: dto.startTime,
          endTime: dto.endTime,
          venue: dto.venue,
          budgetCents: dto.budgetCents,
          notes: `Converted from Marketplace opportunity ${opportunity.id}. Confirmation: ${dto.confirmationEvidenceType} — ${dto.confirmationReference}`,
          description: opportunity.qualificationNotes,
          startDateTime,
          endDateTime,
          location: dto.venue,
          status: 'Draft',
        },
      });
      const updated = await tx.salesOpportunity.update({
        where: { id: opportunity.id },
        data: {
          contactId: contact.id,
          eventId: event.id,
          status: 'Won',
          confirmationEvidenceType: dto.confirmationEvidenceType,
          confirmationReference: dto.confirmationReference,
          confirmationRecordedAt: new Date(),
          convertedByUserId: userId,
          convertedAt: new Date(),
        },
      });
      await tx.marketplaceEnquiry.update({
        where: { id: opportunity.marketplaceEnquiryId },
        data: { status: 'Converted' },
      });
      await tx.auditLog.create({
        data: {
          action: 'marketplace.opportunity_converted_to_event',
          details: JSON.stringify({
            opportunityId,
            eventId: event.id,
            evidenceType: dto.confirmationEvidenceType,
          }),
          userId,
          organizationId: dto.organizationId,
        },
      });
      return {
        opportunity: updated,
        event: { id: event.id, title: event.title, status: event.status },
        contact: {
          id: contact.id,
          name: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
        },
      };
    });
  }

  async updateEnquiryStatus(
    userId: string,
    organizationId: string,
    enquiryId: string,
    status: MarketplaceEnquiryStatus,
  ) {
    await this.ensureOrganizationMembership(userId, organizationId);
    if (status === MarketplaceEnquiryStatus.Converted) {
      throw new BadRequestException(
        'Use the qualified sales opportunity conversion workflow to convert an enquiry',
      );
    }
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

  async sendOrganizationMessage(
    userId: string,
    organizationId: string,
    enquiryId: string,
    body: string,
  ) {
    await this.ensureOrganizationMembership(userId, organizationId);
    const enquiry = await this.prisma.marketplaceEnquiry.findFirst({
      where: { id: enquiryId, organizationId },
      select: { id: true },
    });
    if (!enquiry) throw new NotFoundException('Marketplace enquiry not found');
    return this.prisma.marketplaceEnquiryMessage.create({
      data: {
        organizationId,
        enquiryId,
        authorRole: MarketplaceMessageAuthorRole.Supplier,
        authorUserId: userId,
        body,
      },
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
    const stockAvailability =
      item.status === ResourceStatus.MAINTENANCE ||
      item.status === ResourceStatus.DAMAGED
        ? 'Unavailable'
        : availableQuantity === null || availableQuantity > 0
          ? 'Available'
          : 'Fully booked';
    const availabilityStatus =
      stockAvailability === 'Unavailable' ||
      stockAvailability === 'Fully booked'
        ? stockAvailability
        : item.supplierAvailability === SupplierProductAvailability.Unavailable
          ? 'Unavailable'
          : item.supplierAvailability === SupplierProductAvailability.Limited
            ? 'Limited availability'
            : item.supplierAvailability ===
                SupplierProductAvailability.MadeToOrder
              ? 'Made to order'
              : 'Available';

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
      availableQuantity,
      leadTimeDays: item.leadTimeDays,
      minimumOrderQuantity: item.minimumOrderQuantity,
      deliveryAvailable: item.deliveryAvailable,
      pickupAvailable: item.pickupAvailable,
      deliveryRadiusKm: item.deliveryRadiusKm,
      deliveryFee: item.deliveryFee,
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

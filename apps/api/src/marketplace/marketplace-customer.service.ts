import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  MarketplaceMessageAuthorRole,
  MarketplacePreliminaryQuoteStatus,
  ResourceStatus,
  ResourceVisibility,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarketplaceCustomerEnquiryDto,
  MarketplaceEventConceptCreateDto,
  MarketplaceCustomerRegisterDto,
  MarketplaceEventConceptSelectionDto,
  MarketplaceEventConceptUpdateDto,
  ReplaceMarketplaceEventConceptSelectionDto,
  UpdateMarketplaceEventConceptSelectionDto,
} from './dto/marketplace-customer.dto';
import { MarketplacePublicService } from './marketplace-public.service';

@Injectable()
export class MarketplaceCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly marketplace: MarketplacePublicService,
  ) {}

  async register(dto: MarketplaceCustomerRegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.marketplaceCustomer.findUnique({ where: { email } }))
      throw new ConflictException('Email already in use');
    const customer = await this.prisma.marketplaceCustomer.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        name: dto.name,
        phone: dto.phone,
      },
      select: { id: true, email: true, name: true, phone: true },
    });
    return this.session(customer);
  }

  async login(emailInput: string, password: string) {
    const customer = await this.prisma.marketplaceCustomer.findUnique({
      where: { email: emailInput.toLowerCase() },
    });
    if (!customer || !(await bcrypt.compare(password, customer.passwordHash)))
      throw new UnauthorizedException('Invalid credentials');
    return this.session(customer);
  }

  async createEnquiry(customerId: string, dto: MarketplaceCustomerEnquiryDto) {
    const [customer, resource] = await Promise.all([
      this.prisma.marketplaceCustomer.findUnique({ where: { id: customerId } }),
      this.prisma.resource.findFirst({
        where: {
          id: dto.resourceId,
          archivedAt: null,
          visibility: ResourceVisibility.MARKETPLACE,
          status: { not: ResourceStatus.RETIRED },
        },
        select: { id: true, organizationId: true },
      }),
    ]);
    if (!customer) throw new UnauthorizedException();
    if (!resource) throw new NotFoundException('Marketplace listing not found');
    return this.prisma.marketplaceEnquiry.create({
      data: {
        ...dto,
        customerId,
        organizationId: resource.organizationId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      },
      select: { id: true, status: true, createdAt: true },
    });
  }

  async enquiries(customerId: string) {
    return this.prisma.marketplaceEnquiry.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        eventDate: true,
        eventLocation: true,
        quantity: true,
        message: true,
        createdAt: true,
        resource: { select: { id: true, name: true } },
        salesOpportunity: { select: { status: true, eventId: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, authorRole: true, body: true, createdAt: true },
        },
        preliminaryQuotes: {
          where: {
            status: {
              in: [
                MarketplacePreliminaryQuoteStatus.Sent,
                MarketplacePreliminaryQuoteStatus.Superseded,
              ],
            },
          },
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            status: true,
            currency: true,
            subtotalCents: true,
            discountCents: true,
            deliveryFeeCents: true,
            taxCents: true,
            totalCents: true,
            paymentTerms: true,
            validUntil: true,
            notes: true,
            sentAt: true,
            createdAt: true,
            updatedAt: true,
            lines: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                description: true,
                quantity: true,
                unit: true,
                unitPriceCents: true,
                lineTotalCents: true,
                notes: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });
  }

  async addShortlist(customerId: string, resourceId: string) {
    await this.marketplace.findListing(resourceId);
    return this.prisma.marketplaceCustomerShortlistItem.upsert({
      where: { customerId_resourceId: { customerId, resourceId } },
      create: { customerId, resourceId },
      update: {},
    });
  }

  async removeShortlist(customerId: string, resourceId: string) {
    await this.prisma.marketplaceCustomerShortlistItem.deleteMany({
      where: { customerId, resourceId },
    });
    return { removed: true };
  }

  async shortlist(customerId: string) {
    const rows = await this.prisma.marketplaceCustomerShortlistItem.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: { resourceId: true, createdAt: true },
    });
    const listings = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        listing: await this.marketplace.findListing(row.resourceId),
      })),
    );
    return listings;
  }

  async eventConcepts(customerId: string) {
    const concepts = await this.prisma.marketplaceEventConcept.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      include: { selections: { orderBy: { createdAt: 'asc' } } },
    });
    return Promise.all(concepts.map((concept) => this.hydrateConcept(concept)));
  }

  async createEventConcept(
    customerId: string,
    dto: MarketplaceEventConceptCreateDto,
  ) {
    const concept = await this.prisma.marketplaceEventConcept.create({
      data: { customerId, title: dto.title },
      include: { selections: true },
    });
    return this.hydrateConcept(concept);
  }

  async eventConcept(customerId: string, id: string) {
    const concept = await this.findOwnedConcept(customerId, id);
    return this.hydrateConcept(concept);
  }

  async updateEventConcept(
    customerId: string,
    id: string,
    dto: MarketplaceEventConceptUpdateDto,
  ) {
    await this.findOwnedConcept(customerId, id);
    const concept = await this.prisma.marketplaceEventConcept.update({
      where: { id },
      data: dto,
      include: { selections: { orderBy: { createdAt: 'asc' } } },
    });
    return this.hydrateConcept(concept);
  }

  async addEventConceptSelection(
    customerId: string,
    id: string,
    dto: MarketplaceEventConceptSelectionDto,
  ) {
    await Promise.all([
      this.findOwnedConcept(customerId, id),
      this.marketplace.findListing(dto.resourceId),
    ]);
    await this.prisma.marketplaceEventConceptSelection.upsert({
      where: {
        conceptId_resourceId: { conceptId: id, resourceId: dto.resourceId },
      },
      create: { conceptId: id, ...dto },
      update: {
        discoveryPath: dto.discoveryPath,
        quantity: dto.quantity,
        notes: dto.notes,
      },
    });
    await this.prisma.marketplaceEventConcept.update({
      where: { id },
      data: { lastDiscoveryPath: dto.discoveryPath },
    });
    return this.eventConcept(customerId, id);
  }

  async removeEventConceptSelection(
    customerId: string,
    id: string,
    resourceId: string,
  ) {
    await this.findOwnedConcept(customerId, id);
    await this.prisma.marketplaceEventConceptSelection.deleteMany({
      where: { conceptId: id, resourceId },
    });
    return this.eventConcept(customerId, id);
  }

  async updateEventConceptSelection(
    customerId: string,
    id: string,
    resourceId: string,
    dto: UpdateMarketplaceEventConceptSelectionDto,
  ) {
    await this.findOwnedConcept(customerId, id);
    const result =
      await this.prisma.marketplaceEventConceptSelection.updateMany({
        where: { conceptId: id, resourceId },
        data: {
          ...(dto.discoveryPath ? { discoveryPath: dto.discoveryPath } : {}),
          ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
        },
      });
    if (result.count === 0)
      throw new NotFoundException('Event concept selection not found');
    if (dto.discoveryPath) {
      await this.prisma.marketplaceEventConcept.update({
        where: { id },
        data: { lastDiscoveryPath: dto.discoveryPath },
      });
    }
    return this.eventConcept(customerId, id);
  }

  async replaceEventConceptSelection(
    customerId: string,
    id: string,
    resourceId: string,
    dto: ReplaceMarketplaceEventConceptSelectionDto,
  ) {
    await this.findOwnedConcept(customerId, id);
    const selection =
      await this.prisma.marketplaceEventConceptSelection.findUnique({
        where: { conceptId_resourceId: { conceptId: id, resourceId } },
      });
    if (!selection)
      throw new NotFoundException('Event concept selection not found');
    await this.marketplace.findListing(dto.replacementResourceId);

    await this.prisma.marketplaceEventConceptSelection.upsert({
      where: {
        conceptId_resourceId: {
          conceptId: id,
          resourceId: dto.replacementResourceId,
        },
      },
      create: {
        conceptId: id,
        resourceId: dto.replacementResourceId,
        discoveryPath: dto.discoveryPath,
        quantity: dto.quantity ?? selection.quantity,
        notes: dto.notes ?? selection.notes,
      },
      update: {
        discoveryPath: dto.discoveryPath,
        quantity: dto.quantity ?? selection.quantity,
        notes: dto.notes ?? selection.notes,
      },
    });
    if (resourceId !== dto.replacementResourceId) {
      await this.prisma.marketplaceEventConceptSelection.deleteMany({
        where: { conceptId: id, resourceId },
      });
    }
    await this.prisma.marketplaceEventConcept.update({
      where: { id },
      data: { lastDiscoveryPath: dto.discoveryPath },
    });
    return this.eventConcept(customerId, id);
  }

  async sendMessage(customerId: string, enquiryId: string, body: string) {
    const enquiry = await this.prisma.marketplaceEnquiry.findFirst({
      where: { id: enquiryId, customerId },
      select: { id: true, organizationId: true },
    });
    if (!enquiry) throw new NotFoundException('Marketplace enquiry not found');
    return this.prisma.marketplaceEnquiryMessage.create({
      data: {
        organizationId: enquiry.organizationId,
        enquiryId,
        authorRole: MarketplaceMessageAuthorRole.Customer,
        authorCustomerId: customerId,
        body,
      },
    });
  }

  private async findOwnedConcept(customerId: string, id: string) {
    const concept = await this.prisma.marketplaceEventConcept.findFirst({
      where: { id, customerId },
      include: { selections: { orderBy: { createdAt: 'asc' } } },
    });
    if (!concept) throw new NotFoundException('Marketplace event not found');
    return concept;
  }

  private async hydrateConcept<
    T extends { selections: Array<{ resourceId: string }> },
  >(concept: T) {
    return {
      ...concept,
      selections: await Promise.all(
        concept.selections.map(async (selection) => ({
          ...selection,
          listing: await this.marketplace.findListing(selection.resourceId),
        })),
      ),
    };
  }

  private session(customer: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
  }) {
    return {
      accessToken: this.jwt.sign({
        sub: customer.id,
        email: customer.email,
        audience: 'marketplace-customer',
      }),
      tokenType: 'Bearer',
      customer,
    };
  }
}

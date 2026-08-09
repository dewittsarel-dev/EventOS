import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  MarketplaceMessageAuthorRole,
  ResourceStatus,
  ResourceVisibility,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarketplaceCustomerEnquiryDto,
  MarketplaceCustomerRegisterDto,
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

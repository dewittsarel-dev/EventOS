import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { FindQuotationsQueryDto } from './dto/find-quotations-query.dto';
import { QuotationSortBy, QuotationSortOrder } from './dto/quotation-sort.enum';
import { QuotationStatus } from './dto/quotation-status.enum';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateQuotationDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);
    await this.ensureContactOwnership(data.contactId, data.organizationId);
    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, data.organizationId);
    }

    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    const expiryDate = data.expiryDate
      ? new Date(data.expiryDate)
      : data.validUntil
        ? new Date(data.validUntil)
        : null;
    this.ensureDateRange(issueDate, expiryDate);

    const status = data.status ?? QuotationStatus.Draft;
    if (status !== QuotationStatus.Draft && status !== QuotationStatus.Sent) {
      throw new BadRequestException(
        'New quotations can only start in Draft or Sent status',
      );
    }

    const totals = this.calculateTotals(
      data.items,
      data.discountCents ?? 0,
      data.taxRatePercent ?? 0,
    );

    const created = await this.prisma.quotation.create({
      data: {
        quoteNumber: this.generateQuoteNumber(),
        organizationId: data.organizationId,
        contactId: data.contactId,
        eventId: data.eventId,
        title: data.title,
        notes: data.notes,
        status,
        issueDate,
        expiryDate,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxRatePercent: totals.taxRatePercent,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        items: {
          create: data.items.map((item, index) => {
            const pricing = this.calculateLineItemPricing(item, index);

            return {
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              discountPercent: pricing.discountPercent,
              discountCents: pricing.discountCents,
              lineTotalCents: pricing.lineTotalCents,
              sortOrder: index,
            };
          }),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.mapQuotationResponse(created);
  }

  async findAll(userId: string, query: FindQuotationsQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const includeArchived = query.includeArchived ?? false;

    const where = {
      organizationId: query.organizationId,
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.eventId ? { eventId: query.eventId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(includeArchived ? {} : { archivedAt: null }),
      ...(query.search
        ? {
            OR: [
              {
                quoteNumber: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                notes: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = query.sortBy ?? QuotationSortBy.CreatedAt;
    const sort = query.sort ?? QuotationSortOrder.Desc;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        where,
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: {
          [sortBy]: sort,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data: data.map((quotation) => this.mapQuotationResponse(quotation)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, quotation.organizationId);

    return this.mapQuotationResponse(quotation);
  }

  async update(userId: string, id: string, data: UpdateQuotationDto) {
    const quotation = await this.findOne(userId, id);
    this.ensureNotArchived(quotation.archivedAt);

    if (data.contactId) {
      await this.ensureContactOwnership(
        data.contactId,
        quotation.organizationId,
      );
    }

    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, quotation.organizationId);
    }

    const issueDate = data.issueDate
      ? new Date(data.issueDate)
      : quotation.issueDate;
    const expiryDate =
      data.expiryDate === null || data.validUntil === null
        ? null
        : data.expiryDate || data.validUntil
          ? new Date(data.expiryDate ?? data.validUntil ?? '')
          : quotation.expiryDate;

    this.ensureDateRange(issueDate, expiryDate);

    const sourceItems = data.items
      ? data.items
      : quotation.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountPercent: item.discountPercent,
          discountCents: item.discountCents,
        }));

    const discountCents = data.discountCents ?? quotation.discountCents;
    const taxRatePercent = data.taxRatePercent ?? quotation.taxRatePercent;
    const totals = this.calculateTotals(
      sourceItems,
      discountCents,
      taxRatePercent,
    );

    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.quotationItem.deleteMany({
          where: { quotationId: quotation.id },
        });

        await tx.quotationItem.createMany({
          data: data.items.map((item, index) => {
            const pricing = this.calculateLineItemPricing(item, index);

            return {
              quotationId: quotation.id,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              discountPercent: pricing.discountPercent,
              discountCents: pricing.discountCents,
              lineTotalCents: pricing.lineTotalCents,
              sortOrder: index,
            };
          }),
        });
      }

      const updated = await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          contactId: data.contactId,
          eventId: data.eventId,
          title: data.title,
          notes: data.notes,
          issueDate,
          expiryDate,
          discountCents: totals.discountCents,
          taxRatePercent: totals.taxRatePercent,
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return this.mapQuotationResponse(updated);
    });
  }

  async updateStatus(
    userId: string,
    id: string,
    data: UpdateQuotationStatusDto,
  ) {
    const quotation = await this.findOne(userId, id);
    this.ensureNotArchived(quotation.archivedAt);

    this.ensureValidStatusTransition(
      quotation.status as QuotationStatus,
      data.status,
    );

    const updated = await this.prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        status: data.status,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.mapQuotationResponse(updated);
  }

  async archive(userId: string, id: string) {
    const quotation = await this.findOne(userId, id);

    await this.prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  async remove(userId: string, id: string) {
    const quotation = await this.findOne(userId, id);

    await this.prisma.quotation.delete({
      where: { id: quotation.id },
    });
  }

  private calculateTotals(
    items: Array<{
      quantity: number;
      unitPriceCents: number;
      discountPercent?: number;
      discountCents?: number;
    }>,
    discountCents: number,
    taxRatePercent: number,
  ) {
    if (taxRatePercent > 100) {
      throw new BadRequestException('taxRatePercent must be between 0 and 100');
    }

    const subtotalCents = items.reduce((sum, item, index) => {
      const pricing = this.calculateLineItemPricing(item, index);

      return sum + pricing.lineTotalCents;
    }, 0);

    if (discountCents > subtotalCents) {
      throw new BadRequestException(
        'discountCents cannot be greater than subtotalCents',
      );
    }

    const taxableAmount = subtotalCents - discountCents;
    const taxCents = Math.round((taxableAmount * taxRatePercent) / 100);
    const totalCents = taxableAmount + taxCents;

    return {
      subtotalCents,
      discountCents,
      taxRatePercent,
      taxCents,
      totalCents,
    };
  }

  private ensureDateRange(issueDate: Date, expiryDate: Date | null) {
    if (expiryDate && expiryDate.getTime() < issueDate.getTime()) {
      throw new BadRequestException(
        'expiryDate must be greater than or equal to issueDate',
      );
    }
  }

  private ensureValidStatusTransition(
    currentStatus: QuotationStatus,
    nextStatus: QuotationStatus,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    const transitions: Record<QuotationStatus, QuotationStatus[]> = {
      [QuotationStatus.Draft]: [
        QuotationStatus.Sent,
        QuotationStatus.Expired,
        QuotationStatus.Cancelled,
      ],
      [QuotationStatus.Sent]: [
        QuotationStatus.Accepted,
        QuotationStatus.Rejected,
        QuotationStatus.Expired,
        QuotationStatus.Cancelled,
      ],
      [QuotationStatus.Accepted]: [QuotationStatus.Cancelled],
      [QuotationStatus.Rejected]: [],
      [QuotationStatus.Expired]: [],
      [QuotationStatus.Cancelled]: [],
    };

    if (!transitions[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private ensureNotArchived(archivedAt: Date | null) {
    if (archivedAt) {
      throw new BadRequestException('Archived quotations cannot be updated');
    }
  }

  private mapQuotationResponse<
    T extends {
      quoteNumber: string;
      expiryDate: Date | null;
      subtotalCents: number;
      taxCents: number;
      totalCents: number;
      items?: Array<{
        unitPriceCents: number;
        discountPercent: number;
        discountCents: number;
        lineTotalCents: number;
      }>;
    },
  >(quotation: T) {
    return {
      ...quotation,
      quotationNumber: quotation.quoteNumber,
      validUntil: quotation.expiryDate,
      subtotal: quotation.subtotalCents,
      vat: quotation.taxCents,
      total: quotation.totalCents,
      grandTotalCents: quotation.totalCents,
      grandTotal: quotation.totalCents,
      items: quotation.items?.map((item) => ({
        ...item,
        unitPrice: item.unitPriceCents,
        discount: item.discountCents,
        discountPercentage: item.discountPercent,
        total: item.lineTotalCents,
      })),
    };
  }

  private calculateLineItemPricing(
    item: {
      quantity: number;
      unitPriceCents: number;
      discountPercent?: number;
      discountCents?: number;
    },
    index: number,
  ) {
    const baseLineTotal = item.quantity * item.unitPriceCents;
    const discountPercent = item.discountPercent ?? 0;

    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException(
        `items[${index}].discountPercent must be between 0 and 100`,
      );
    }

    const derivedDiscountCents = Math.round(
      (baseLineTotal * discountPercent) / 100,
    );
    const discountCents =
      item.discountPercent !== undefined
        ? derivedDiscountCents
        : (item.discountCents ?? 0);

    if (discountCents > baseLineTotal) {
      throw new BadRequestException(
        `items[${index}].discount cannot be greater than quantity * unitPriceCents`,
      );
    }

    return {
      discountPercent:
        item.discountPercent ??
        (baseLineTotal > 0
          ? Math.round((discountCents / baseLineTotal) * 100)
          : 0),
      discountCents,
      lineTotalCents: baseLineTotal - discountCents,
    };
  }

  private generateQuoteNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `QUO-${timestamp}-${randomPart}`;
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }

  private async ensureContactOwnership(
    contactId: string,
    organizationId: string,
  ) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || contact.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Contact does not belong to this organization',
      );
    }
  }

  private async ensureEventOwnership(eventId: string, organizationId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Event does not belong to this organization',
      );
    }
  }
}

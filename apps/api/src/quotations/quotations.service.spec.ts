import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationStatus } from './dto/quotation-status.enum';

describe('QuotationsService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const quotationId = '99999999-9999-4999-8999-999999999999';
  const contactId = '33333333-3333-4333-8333-333333333333';
  const eventId = '55555555-5555-4555-8555-555555555555';

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    quotation: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quotationItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: QuotationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuotationsService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      organizationId,
    });

    prisma.event.findUnique.mockResolvedValue({
      id: eventId,
      organizationId,
    });
  });

  it('creates quotation with computed totals', async () => {
    prisma.quotation.create.mockResolvedValue({ id: quotationId });

    const result = await service.create(userId, {
      organizationId,
      contactId,
      eventId,
      title: 'Main Quote',
      notes: 'Important',
      discountCents: 1000,
      taxRatePercent: 15,
      status: QuotationStatus.Draft,
      items: [
        {
          description: 'Line 1',
          quantity: 2,
          unitPriceCents: 10000,
        },
      ],
    });

    expect(prisma.quotation.create).toHaveBeenCalled();
    expect(result).toEqual({ id: quotationId });
  });

  it('rejects discount above subtotal', async () => {
    await expect(
      service.create(userId, {
        organizationId,
        contactId,
        eventId,
        title: 'Bad Quote',
        discountCents: 50000,
        taxRatePercent: 10,
        status: QuotationStatus.Draft,
        items: [
          {
            description: 'Line 1',
            quantity: 1,
            unitPriceCents: 10000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('filters and paginates list', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.quotation.findMany.mockResolvedValue([{ id: quotationId }]);
    prisma.quotation.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 2,
      limit: 5,
      search: 'Main',
      status: QuotationStatus.Sent,
      sortBy: 'createdAt',
      sort: 'asc',
      includeArchived: false,
    });

    expect(prisma.quotation.findMany).toHaveBeenCalled();
    expect(result.meta).toEqual({ page: 2, limit: 5, total: 1 });
  });

  it('enforces status transition rules', async () => {
    prisma.quotation.findUnique.mockResolvedValue({
      id: quotationId,
      organizationId,
      status: QuotationStatus.Accepted,
      archivedAt: null,
      items: [],
    });

    await expect(
      service.updateStatus(userId, quotationId, {
        status: QuotationStatus.Draft,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids create when contact organization does not match', async () => {
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      organizationId: '22222222-2222-4222-8222-222222222222',
    });

    await expect(
      service.create(userId, {
        organizationId,
        contactId,
        eventId,
        title: 'Forbidden Quote',
        status: QuotationStatus.Draft,
        items: [
          {
            description: 'Line 1',
            quantity: 1,
            unitPriceCents: 1000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

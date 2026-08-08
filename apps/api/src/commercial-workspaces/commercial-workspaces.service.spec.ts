/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import {
  CommercialMessageAuthorRole,
  CommercialMessageType,
  CommercialRfqStatus,
  CommercialWorkspaceStatus,
  CommercialQuoteStatus,
  CommercialSubstitutionReviewStatus,
  ProcurementPackageStatus,
} from '@prisma/client';
import { CommercialWorkspacesService } from './commercial-workspaces.service';

describe('CommercialWorkspacesService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const packageId = '77777777-7777-7777-7777-777777777777';
  const workspaceId = '88888888-8888-8888-8888-888888888888';
  const rfqId = '99999999-9999-9999-9999-999999999999';
  const itemId = '66666666-6666-6666-6666-666666666666';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    procurementPackage: { findUnique: jest.fn() },
    procurementPackageItem: { findMany: jest.fn() },
    commercialWorkspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    commercialRfq: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    commercialRfqLine: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    commercialMessage: { create: jest.fn() },
    commercialQuote: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    commercialQuoteLine: { findMany: jest.fn() },
    commercialSubstitutionImpact: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    commercialAward: { create: jest.fn(), findMany: jest.fn() },
    commercialPurchaseOrderDraft: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: CommercialWorkspacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommercialWorkspacesService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('generates supplier-specific structured RFQ drafts without sending', async () => {
    prisma.procurementPackage.findUnique.mockResolvedValue({
      id: packageId,
      eventId,
      name: 'Furniture Package',
      status: ProcurementPackageStatus.QuotationRequested,
      event: {
        title: 'Annual Dinner',
        eventType: 'Corporate',
        startDateTime: new Date('2027-09-05T08:00:00.000Z'),
        endDateTime: new Date('2027-09-06T18:00:00.000Z'),
        location: 'Sandton Convention Centre',
        venue: 'Sandton Convention Centre',
      },
      solutions: [
        {
          id: 'solution-1',
          allocations: [
            {
              supplierId: 'supplier-1',
              supplierName: 'Premium Furniture Hire',
              requirementItemId: itemId,
              quantity: 600,
              requirementItem: {
                id: itemId,
                name: 'Gold Tiffany Chairs',
                unit: 'Each',
                deliveryDate: null,
                collectionDate: null,
              },
            },
          ],
        },
      ],
    });
    prisma.commercialWorkspace.create.mockResolvedValue({ id: workspaceId });
    prisma.commercialRfq.create.mockResolvedValue({ id: rfqId });
    prisma.commercialRfqLine.create.mockResolvedValue({ id: 'line-1' });
    prisma.commercialMessage.create.mockResolvedValue({ id: 'message-1' });
    prisma.commercialWorkspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      status: CommercialWorkspaceStatus.Draft,
    });

    await service.generate(userId, eventId, packageId, {
      submissionDeadline: '2099-09-01T12:00:00.000Z',
      specialNotes: 'Black Tie Corporate Dinner',
    });

    expect(prisma.commercialRfq.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        supplierId: 'supplier-1',
        eventSummary: 'Annual Dinner — Corporate',
      }),
    });
    expect(prisma.commercialRfqLine.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requirementItemId: itemId,
        quantity: 600,
      }),
    });
    expect(prisma.commercialMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        body: expect.stringContaining('Nothing sent'),
        type: CommercialMessageType.SystemEvent,
      }),
    });
  });

  it('does not generate RFQs before M007 quotation handoff', async () => {
    prisma.procurementPackage.findUnique.mockResolvedValue({
      id: packageId,
      eventId,
      status: ProcurementPackageStatus.SolutionSelected,
      solutions: [{ id: 'solution-1', allocations: [] }],
    });

    await expect(
      service.generate(userId, eventId, packageId, {
        submissionDeadline: '2099-09-01T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves an RFQ without sending it', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [],
    });
    prisma.commercialRfq.findUnique.mockResolvedValue({
      id: rfqId,
      commercialWorkspaceId: workspaceId,
      status: CommercialRfqStatus.Draft,
    });
    prisma.commercialRfq.update.mockResolvedValue({
      id: rfqId,
      status: CommercialRfqStatus.Approved,
    });

    await service.approveRfq(userId, eventId, workspaceId, rfqId);

    expect(prisma.commercialRfq.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CommercialRfqStatus.Approved,
          approvedByUserId: userId,
        }),
      }),
    );
    expect(prisma.commercialMessage.create).not.toHaveBeenCalled();
  });

  it('delivers only an approved RFQ and activates the conversation', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [],
    });
    prisma.commercialRfq.findUnique.mockResolvedValue({
      id: rfqId,
      commercialWorkspaceId: workspaceId,
      supplierId: 'supplier-1',
      supplierName: 'Premium Furniture Hire',
      status: CommercialRfqStatus.Approved,
    });
    prisma.commercialRfq.update.mockResolvedValue({
      id: rfqId,
      status: CommercialRfqStatus.Sent,
    });

    await service.sendRfq(userId, eventId, workspaceId, rfqId);

    expect(prisma.commercialMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorRole: CommercialMessageAuthorRole.Planner,
        type: CommercialMessageType.Rfq,
        metadata: {
          rfqId,
          deliveryChannel: 'SupplierWorkspace',
        },
        sentAt: expect.any(Date),
      }),
    });
    expect(prisma.commercialWorkspace.update).toHaveBeenCalledWith({
      where: { id: workspaceId },
      data: { status: CommercialWorkspaceStatus.Active },
    });
  });

  it('stores AI negotiation assistance as an unsent draft', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [{ supplierId: 'supplier-1' }],
    });
    prisma.commercialMessage.create.mockResolvedValue({ id: 'message-1' });

    await service.addMessage(userId, eventId, workspaceId, {
      supplierId: 'supplier-1',
      type: CommercialMessageType.AiComment,
      body: 'Would you be willing to reconsider the chair rate?',
    });

    expect(prisma.commercialMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorRole: CommercialMessageAuthorRole.Ai,
        sentAt: null,
        metadata: { draftOnly: true, operatorApprovalRequired: true },
      }),
    });
  });

  it('stores quote revisions as immutable versions and supersedes the prior current quote', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [],
    });
    prisma.commercialRfq.findUnique.mockResolvedValue({
      id: rfqId,
      commercialWorkspaceId: workspaceId,
      supplierId: 'supplier-1',
      supplierName: 'Premium Furniture Hire',
      status: CommercialRfqStatus.Sent,
      lines: [
        { requirementItemId: itemId, description: 'Gold Tiffany Chairs' },
      ],
      quotes: [{ version: 1 }],
    });
    prisma.commercialQuote.create.mockResolvedValue({
      id: 'quote-2',
      version: 2,
      lines: [],
    });

    await service.submitQuote(userId, eventId, workspaceId, rfqId, {
      currency: 'ZAR',
      lines: [
        {
          requirementItemId: itemId,
          offeredDescription: 'Gold Tiffany Chairs',
          quantityOffered: 600,
          unitPrice: 90,
        },
      ],
    });

    expect(prisma.commercialQuote.updateMany).toHaveBeenCalledWith({
      where: {
        commercialRfqId: rfqId,
        status: CommercialQuoteStatus.Submitted,
      },
      data: { status: CommercialQuoteStatus.Superseded },
    });
    expect(prisma.commercialQuote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 2,
          subtotal: 54000,
          totalAmount: 54000,
        }),
      }),
    );
  });

  it('blocks awards for substitutions until the planner approves cross-module impact', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [],
    });
    prisma.commercialQuoteLine.findMany.mockResolvedValue([
      {
        id: '55555555-5555-5555-5555-555555555555',
        requirementItemId: itemId,
        quantityOffered: 600,
        unitPrice: 90,
        included: false,
        commercialQuote: {
          commercialWorkspaceId: workspaceId,
          status: CommercialQuoteStatus.Submitted,
          supplierId: 'supplier-1',
        },
        substitutionImpact: {
          status: CommercialSubstitutionReviewStatus.PendingReview,
        },
      },
    ]);

    await expect(
      service.award(userId, eventId, workspaceId, {
        lines: [
          {
            quoteLineId: '55555555-5555-5555-5555-555555555555',
            quantity: 600,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prepares Purchase Order drafts only from planner awards', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      rfqs: [],
    });
    prisma.commercialAward.findMany.mockResolvedValue([
      {
        id: 'award-1',
        supplierId: 'supplier-1',
        requirementItemId: itemId,
        quantity: 600,
        unitPrice: 90,
        lineTotal: 54000,
        commercialQuoteLine: {
          offeredDescription: 'Gold Tiffany Chairs',
          commercialQuote: {
            supplierName: 'Premium Furniture Hire',
            currency: 'ZAR',
            paymentTerms: '30 days',
          },
        },
      },
    ]);
    prisma.commercialPurchaseOrderDraft.upsert.mockResolvedValue({
      id: 'po-draft-1',
      lines: [],
    });

    await service.preparePurchaseOrderDrafts(userId, eventId, workspaceId);

    expect(prisma.commercialPurchaseOrderDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          supplierId: 'supplier-1',
          subtotal: 54000,
          totalAmount: 54000,
        }),
      }),
    );
  });
});

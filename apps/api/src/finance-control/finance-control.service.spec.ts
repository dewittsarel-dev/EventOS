/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import {
  FinanceInvoiceStatus,
  FinancePaymentDirection,
  FinancePaymentStatus,
  FinanceVersionStatus,
  FinanceWorkspaceStatus,
} from '@prisma/client';
import { FinanceControlService } from './finance-control.service';

describe('FinanceControlService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = '22222222-2222-2222-2222-222222222222';
  const workspaceId = '33333333-3333-3333-3333-333333333333';
  const workspace = {
    id: workspaceId,
    organizationId,
    eventId,
    currency: 'ZAR',
    status: FinanceWorkspaceStatus.Active,
  };
  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    eventFinanceWorkspace: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    eventFinanceOwner: { updateMany: jest.fn(), create: jest.fn() },
    financeWbsNode: { findUnique: jest.fn(), create: jest.fn() },
    eventFinancialLine: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    eventBudgetVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    eventFinancialChange: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    eventFinanceCommitment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    eventClientInvoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    eventFinancePayment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    eventFinanceReconciliation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    eventFinanceCloseItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    eventFinanceAudit: { create: jest.fn() },
    eventExecution: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: FinanceControlService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinanceControlService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValue(workspace);
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('creates one operational finance workspace without replacing statutory accounting', async () => {
    prisma.eventFinanceWorkspace.findUnique.mockResolvedValueOnce(null);
    prisma.eventFinanceWorkspace.create.mockResolvedValue(workspace);
    prisma.eventFinanceAudit.create.mockResolvedValue({ id: 'audit-1' });

    await service.createWorkspace(userId, organizationId, eventId, {
      statutorySystemName: 'External ERP',
    });

    expect(prisma.eventFinanceWorkspace.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId,
        eventId,
        statutorySystemName: 'External ERP',
        createdByUserId: userId,
        owners: {
          create: expect.objectContaining({ role: 'Event Financial Owner' }),
        },
        closeItems: {
          create: expect.arrayContaining([
            expect.objectContaining({ closeType: 'Reconciliation' }),
          ]),
        },
      }),
    });
  });

  it('keeps approved budget versions immutable', async () => {
    prisma.eventBudgetVersion.findUnique.mockResolvedValue({
      id: 'budget-1',
      financeWorkspaceId: workspaceId,
      status: FinanceVersionStatus.Approved,
    });
    await expect(
      service.changeBudgetStatus(userId, organizationId, eventId, 'budget-1', {
        status: FinanceVersionStatus.Locked,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calculates invoice totals on the server and creates only a draft', async () => {
    prisma.eventClientInvoice.create.mockResolvedValue({ id: 'invoice-1' });
    await service.createInvoice(userId, organizationId, eventId, {
      contactId: '44444444-4444-4444-4444-444444444444',
      invoiceNumber: 'INV-001',
      currency: 'ZAR',
      lines: [
        {
          description: 'Event service',
          quantity: 2,
          unitPrice: 500,
          taxAmount: 150,
          sourceType: 'Contract',
          sourceId: 'contract-1',
        },
      ],
    });
    expect(prisma.eventClientInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtotal: 1000,
        taxAmount: 150,
        totalAmount: 1150,
        balanceAmount: 1150,
        createdByUserId: userId,
      }),
      include: { lines: true },
    });
  });

  it('does not issue a client invoice before approval', async () => {
    prisma.eventClientInvoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      financeWorkspaceId: workspaceId,
      status: FinanceInvoiceStatus.Draft,
    });
    await expect(
      service.changeInvoiceStatus(
        userId,
        organizationId,
        eventId,
        'invoice-1',
        { status: FinanceInvoiceStatus.Issued },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates receivables only after externally evidenced payment clearing', async () => {
    prisma.eventFinancePayment.findUnique.mockResolvedValue({
      id: 'payment-1',
      financeWorkspaceId: workspaceId,
      invoiceId: 'invoice-1',
      status: FinancePaymentStatus.Submitted,
      amount: 400,
      direction: FinancePaymentDirection.Receipt,
    });
    prisma.eventFinancePayment.update.mockResolvedValue({
      id: 'payment-1',
      status: FinancePaymentStatus.Cleared,
    });
    prisma.eventClientInvoice.findUniqueOrThrow.mockResolvedValue({
      id: 'invoice-1',
      paidAmount: 0,
      totalAmount: 1000,
    });
    await service.changePaymentStatus(
      userId,
      organizationId,
      eventId,
      'payment-1',
      { status: FinancePaymentStatus.Cleared },
    );
    expect(prisma.eventClientInvoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: {
        paidAmount: 400,
        balanceAmount: 600,
        status: FinanceInvoiceStatus.PartiallyPaid,
      },
    });
  });

  it('blocks Financial Close while any controlled source remains unresolved', async () => {
    prisma.eventFinanceCloseItem.count.mockResolvedValue(1);
    prisma.eventFinanceReconciliation.count.mockResolvedValue(0);
    prisma.eventFinanceCommitment.count.mockResolvedValue(0);
    prisma.eventFinancialLine.count.mockResolvedValue(0);
    prisma.eventExecution.findUnique.mockResolvedValue({ status: 'Completed' });
    await expect(
      service.closeWorkspace(userId, organizationId, eventId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

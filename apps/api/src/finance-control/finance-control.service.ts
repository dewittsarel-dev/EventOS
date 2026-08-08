import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FinanceCloseStatus,
  FinanceCommitmentStatus,
  FinanceInvoiceStatus,
  FinancePaymentStatus,
  FinanceReconciliationStatus,
  FinanceValueStage,
  FinanceVersionStatus,
  FinanceWorkspaceStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignFinanceOwnerDto,
  ChangeBudgetStatusDto,
  ChangeCommitmentStatusDto,
  ChangeFinanceCloseStatusDto,
  ChangeInvoiceStatusDto,
  ChangePaymentStatusDto,
  ChangeReconciliationStatusDto,
  CreateBudgetVersionDto,
  CreateClientInvoiceDto,
  CreateCommitmentDto,
  CreateFinanceCloseItemDto,
  CreateFinancePaymentDto,
  CreateFinanceWbsDto,
  CreateFinanceWorkspaceDto,
  CreateFinancialChangeDto,
  CreateReconciliationDto,
  FinancialLineDto,
} from './dto/finance-control.dto';

@Injectable()
export class FinanceControlService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateFinanceWorkspaceDto,
  ) {
    await this.requireEventAccess(userId, organizationId, eventId);
    const existing = await this.prisma.eventFinanceWorkspace.findUnique({
      where: { eventId },
    });
    if (existing) return existing;
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.eventFinanceWorkspace.create({
        data: {
          organizationId,
          eventId,
          currency: dto.currency ?? 'ZAR',
          profitabilityPolicy: dto.profitabilityPolicy as Prisma.InputJsonValue,
          statutorySystemName: dto.statutorySystemName,
          status: FinanceWorkspaceStatus.Active,
          createdByUserId: userId,
          owners: {
            create: {
              role: 'Event Financial Owner',
              ownerUserId: userId,
              assignedByUserId: userId,
            },
          },
          wbsNodes: {
            create: [
              { code: 'REV', name: 'Revenue', sequence: 0 },
              { code: 'DIRECT', name: 'Direct Event Costs', sequence: 1 },
              { code: 'LABOUR', name: 'Labour', sequence: 2 },
              {
                code: 'ASSETS',
                name: 'Asset Utilisation and Loss',
                sequence: 3,
              },
              { code: 'LOGISTICS', name: 'Logistics', sequence: 4 },
              { code: 'OVERHEAD', name: 'Allocated Overheads', sequence: 5 },
              { code: 'RECOVERY', name: 'Recoveries', sequence: 6 },
            ],
          },
          closeItems: {
            create: [
              {
                closeType: 'SupplierCommitments',
                criteria:
                  'All supplier commitments are invoiced, accrued, cancelled or settled.',
              },
              {
                closeType: 'ClientBilling',
                criteria:
                  'All contract and approved change revenue is billed or formally deferred.',
              },
              {
                closeType: 'Cash',
                criteria:
                  'Payments and receipts are reconciled to external evidence.',
              },
              {
                closeType: 'Assets',
                criteria:
                  'Asset damage, loss and recovery values are reconciled.',
              },
              {
                closeType: 'Execution',
                criteria:
                  'Event Execution is complete with approved closeout evidence.',
              },
              {
                closeType: 'Reconciliation',
                criteria:
                  'All material financial variances are resolved and approved.',
              },
            ],
          },
        },
      });
      await this.audit(
        tx,
        workspace.id,
        'EventFinanceWorkspace',
        workspace.id,
        'Created',
        userId,
        undefined,
        workspace,
      );
      return workspace;
    });
  }

  async getWorkspace(userId: string, organizationId: string, eventId: string) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    return this.prisma.eventFinanceWorkspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: {
        owners: { where: { effectiveTo: null } },
        wbsNodes: { orderBy: { sequence: 'asc' } },
        budgetVersions: {
          orderBy: [{ versionType: 'asc' }, { version: 'desc' }],
          include: { lines: true },
        },
        changes: { orderBy: { requestedAt: 'desc' } },
        commitments: true,
        invoices: { include: { lines: true, payments: true } },
        payments: true,
        reconciliations: true,
        closeItems: true,
      },
    });
  }

  async assignOwner(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: AssignFinanceOwnerDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: dto.ownerUserId, organizationId },
      },
    });
    if (!membership)
      throw new BadRequestException(
        'Finance owner must belong to the organization',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.eventFinanceOwner.updateMany({
        where: {
          financeWorkspaceId: workspace.id,
          role: dto.role,
          effectiveTo: null,
        },
        data: { effectiveTo: new Date() },
      });
      return tx.eventFinanceOwner.create({
        data: {
          financeWorkspaceId: workspace.id,
          role: dto.role,
          ownerUserId: dto.ownerUserId,
          assignedByUserId: userId,
        },
      });
    });
  }

  async createWbsNode(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateFinanceWbsDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    if (dto.parentId) {
      const parent = await this.prisma.financeWbsNode.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.financeWorkspaceId !== workspace.id)
        throw new BadRequestException('Parent WBS node is outside this event');
    }
    return this.prisma.financeWbsNode.create({
      data: { ...dto, financeWorkspaceId: workspace.id },
    });
  }

  async createFinancialLine(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: FinancialLineDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    await this.requireWbs(workspace.id, dto.wbsNodeId);
    const quantity = dto.quantity ?? 1;
    const amountExcludingTax = quantity * dto.unitAmount;
    return this.prisma.eventFinancialLine.create({
      data: {
        ...dto,
        financeWorkspaceId: workspace.id,
        quantity,
        amountExcludingTax,
        taxAmount: dto.taxAmount ?? 0,
        totalAmount: amountExcludingTax + (dto.taxAmount ?? 0),
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        createdByUserId: userId,
      },
    });
  }

  async approveFinancialLine(
    userId: string,
    organizationId: string,
    eventId: string,
    lineId: string,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const line = await this.prisma.eventFinancialLine.findUnique({
      where: { id: lineId },
    });
    if (!line || line.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Financial Line not found');
    if (line.approvedAt)
      throw new ConflictException('Financial Line is already approved');
    return this.prisma.eventFinancialLine.update({
      where: { id: lineId },
      data: { approvedByUserId: userId, approvedAt: new Date() },
    });
  }

  async createBudgetVersion(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateBudgetVersionDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    for (const line of dto.lines)
      await this.requireWbs(workspace.id, line.wbsNodeId);
    const latest = await this.prisma.eventBudgetVersion.findFirst({
      where: { financeWorkspaceId: workspace.id, versionType: dto.versionType },
      orderBy: { version: 'desc' },
    });
    return this.prisma.eventBudgetVersion.create({
      data: {
        financeWorkspaceId: workspace.id,
        version: (latest?.version ?? 0) + 1,
        versionType: dto.versionType,
        description: dto.description,
        createdByUserId: userId,
        lines: { create: dto.lines },
      },
      include: { lines: true },
    });
  }

  async changeBudgetStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    versionId: string,
    dto: ChangeBudgetStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const version = await this.prisma.eventBudgetVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Budget Version not found');
    if (
      version.status === FinanceVersionStatus.Approved ||
      version.status === FinanceVersionStatus.Locked
    )
      throw new ConflictException(
        'Approved or locked financial versions are immutable',
      );
    return this.prisma.$transaction(async (tx) => {
      if (
        dto.status === FinanceVersionStatus.Approved ||
        dto.status === FinanceVersionStatus.Locked
      ) {
        await tx.eventBudgetVersion.updateMany({
          where: {
            financeWorkspaceId: workspace.id,
            versionType: version.versionType,
            id: { not: version.id },
            status: {
              in: [FinanceVersionStatus.Approved, FinanceVersionStatus.Locked],
            },
          },
          data: { status: FinanceVersionStatus.Superseded },
        });
      }
      return tx.eventBudgetVersion.update({
        where: { id: version.id },
        data: {
          status: dto.status,
          submittedByUserId:
            dto.status === FinanceVersionStatus.Submitted ? userId : undefined,
          submittedAt:
            dto.status === FinanceVersionStatus.Submitted
              ? new Date()
              : undefined,
          approvedByUserId:
            dto.status === FinanceVersionStatus.Approved ? userId : undefined,
          approvedAt:
            dto.status === FinanceVersionStatus.Approved
              ? new Date()
              : undefined,
          lockedByUserId:
            dto.status === FinanceVersionStatus.Locked ? userId : undefined,
          lockedAt:
            dto.status === FinanceVersionStatus.Locked ? new Date() : undefined,
          effectiveAt:
            dto.status === FinanceVersionStatus.Approved ||
            dto.status === FinanceVersionStatus.Locked
              ? new Date()
              : undefined,
        },
      });
    });
  }

  async createChange(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateFinancialChangeDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const revenue = dto.revenueImpact ?? 0;
    const cost = dto.costImpact ?? 0;
    return this.prisma.eventFinancialChange.create({
      data: {
        ...dto,
        financeWorkspaceId: workspace.id,
        revenueImpact: revenue,
        costImpact: cost,
        marginImpact: revenue - cost,
        forecastImpact: dto.forecastImpact ?? revenue - cost,
        requestedByUserId: userId,
      },
    });
  }

  async approveChange(
    userId: string,
    organizationId: string,
    eventId: string,
    changeId: string,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const change = await this.prisma.eventFinancialChange.findUnique({
      where: { id: changeId },
    });
    if (!change || change.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Financial Change not found');
    return this.prisma.eventFinancialChange.update({
      where: { id: changeId },
      data: {
        status: FinanceVersionStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });
  }

  async createCommitment(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateCommitmentDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    if (!dto.commercialAwardId && !dto.purchaseOrderId)
      throw new BadRequestException(
        'Commitment requires a Commercial Award or Purchase Order source',
      );
    return this.prisma.eventFinanceCommitment.create({
      data: {
        ...dto,
        financeWorkspaceId: workspace.id,
        taxAmount: dto.taxAmount ?? 0,
        totalAmount: dto.amountExcludingTax + (dto.taxAmount ?? 0),
        createdByUserId: userId,
      },
    });
  }

  async changeCommitmentStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    id: string,
    dto: ChangeCommitmentStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const commitment = await this.prisma.eventFinanceCommitment.findUnique({
      where: { id },
    });
    if (!commitment || commitment.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Commitment not found');
    return this.prisma.eventFinanceCommitment.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId:
          dto.status === FinanceCommitmentStatus.Approved ? userId : undefined,
        approvedAt:
          dto.status === FinanceCommitmentStatus.Approved
            ? new Date()
            : undefined,
        committedAt:
          dto.status === FinanceCommitmentStatus.Ordered
            ? new Date()
            : undefined,
        cancelledAt:
          dto.status === FinanceCommitmentStatus.Cancelled
            ? new Date()
            : undefined,
        cancellationReason: dto.reason,
      },
    });
  }

  async createInvoice(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateClientInvoiceDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const subtotal = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    const tax = dto.lines.reduce((sum, line) => sum + (line.taxAmount ?? 0), 0);
    return this.prisma.eventClientInvoice.create({
      data: {
        financeWorkspaceId: workspace.id,
        contactId: dto.contactId,
        invoiceNumber: dto.invoiceNumber,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        currency: dto.currency,
        contractReference: dto.contractReference,
        subtotal,
        taxAmount: tax,
        totalAmount: subtotal + tax,
        balanceAmount: subtotal + tax,
        createdByUserId: userId,
        lines: {
          create: dto.lines.map((line) => ({
            ...line,
            taxAmount: line.taxAmount ?? 0,
            totalAmount: line.quantity * line.unitPrice + (line.taxAmount ?? 0),
          })),
        },
      },
      include: { lines: true },
    });
  }

  async changeInvoiceStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    id: string,
    dto: ChangeInvoiceStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const invoice = await this.prisma.eventClientInvoice.findUnique({
      where: { id },
    });
    if (!invoice || invoice.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Client Invoice not found');
    if (
      dto.status === FinanceInvoiceStatus.Issued &&
      invoice.status !== FinanceInvoiceStatus.Approved
    )
      throw new ConflictException('Invoice must be approved before issue');
    return this.prisma.eventClientInvoice.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId:
          dto.status === FinanceInvoiceStatus.Approved ? userId : undefined,
        approvedAt:
          dto.status === FinanceInvoiceStatus.Approved ? new Date() : undefined,
        issuedAt:
          dto.status === FinanceInvoiceStatus.Issued ? new Date() : undefined,
        issueDate:
          dto.status === FinanceInvoiceStatus.Issued ? new Date() : undefined,
      },
    });
  }

  async createPayment(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateFinancePaymentDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    if (!dto.invoiceId && !dto.commitmentId)
      throw new BadRequestException(
        'Payment requires an invoice or commitment reference',
      );
    return this.prisma.eventFinancePayment.create({
      data: {
        ...dto,
        financeWorkspaceId: workspace.id,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        createdByUserId: userId,
      },
    });
  }

  async changePaymentStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    id: string,
    dto: ChangePaymentStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const payment = await this.prisma.eventFinancePayment.findUnique({
      where: { id },
    });
    if (!payment || payment.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Payment not found');
    if (
      dto.status === FinancePaymentStatus.Cleared &&
      payment.status !== FinancePaymentStatus.Submitted
    )
      throw new ConflictException(
        'Only submitted payments may be marked cleared',
      );
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.eventFinancePayment.update({
        where: { id },
        data: {
          status: dto.status,
          approvedByUserId:
            dto.status === FinancePaymentStatus.Approved ? userId : undefined,
          approvedAt:
            dto.status === FinancePaymentStatus.Approved
              ? new Date()
              : undefined,
          submittedAt:
            dto.status === FinancePaymentStatus.Submitted
              ? new Date()
              : undefined,
          clearedAt:
            dto.status === FinancePaymentStatus.Cleared
              ? new Date()
              : undefined,
        },
      });
      if (dto.status === FinancePaymentStatus.Cleared && payment.invoiceId) {
        const invoice = await tx.eventClientInvoice.findUniqueOrThrow({
          where: { id: payment.invoiceId },
        });
        const paidAmount = invoice.paidAmount + payment.amount;
        const balanceAmount = Math.max(0, invoice.totalAmount - paidAmount);
        await tx.eventClientInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount,
            balanceAmount,
            status:
              balanceAmount === 0
                ? FinanceInvoiceStatus.Paid
                : FinanceInvoiceStatus.PartiallyPaid,
          },
        });
      }
      return updated;
    });
  }

  async createReconciliation(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateReconciliationDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    return this.prisma.eventFinanceReconciliation.create({
      data: {
        ...dto,
        financeWorkspaceId: workspace.id,
        varianceAmount: dto.recordedAmount - dto.expectedAmount,
        evidence: dto.evidence as Prisma.InputJsonValue,
      },
    });
  }

  async changeReconciliationStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    id: string,
    dto: ChangeReconciliationStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const row = await this.prisma.eventFinanceReconciliation.findUnique({
      where: { id },
    });
    if (!row || row.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Reconciliation not found');
    return this.prisma.eventFinanceReconciliation.update({
      where: { id },
      data: {
        status: dto.status,
        explanation: dto.explanation,
        resolvedByUserId:
          dto.status === FinanceReconciliationStatus.Resolved
            ? userId
            : undefined,
        resolvedAt:
          dto.status === FinanceReconciliationStatus.Resolved
            ? new Date()
            : undefined,
        approvedByUserId:
          dto.status === FinanceReconciliationStatus.Approved
            ? userId
            : undefined,
        approvedAt:
          dto.status === FinanceReconciliationStatus.Approved
            ? new Date()
            : undefined,
      },
    });
  }

  async createCloseItem(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateFinanceCloseItemDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    return this.prisma.eventFinanceCloseItem.create({
      data: { ...dto, financeWorkspaceId: workspace.id },
    });
  }

  async changeCloseItem(
    userId: string,
    organizationId: string,
    eventId: string,
    id: string,
    dto: ChangeFinanceCloseStatusDto,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const item = await this.prisma.eventFinanceCloseItem.findUnique({
      where: { id },
    });
    if (!item || item.financeWorkspaceId !== workspace.id)
      throw new NotFoundException('Financial Close Item not found');
    if (
      (dto.status === FinanceCloseStatus.ReadyForReview ||
        dto.status === FinanceCloseStatus.Approved) &&
      !dto.evidence
    )
      throw new BadRequestException(
        'Financial Close controls require evidence',
      );
    if (dto.status === FinanceCloseStatus.Reopened && !dto.reason)
      throw new BadRequestException(
        'Reopening Financial Close requires a reason',
      );
    return this.prisma.eventFinanceCloseItem.update({
      where: { id },
      data: {
        status: dto.status,
        evidence: dto.evidence as Prisma.InputJsonValue,
        completedByUserId:
          dto.status === FinanceCloseStatus.ReadyForReview ? userId : undefined,
        completedAt:
          dto.status === FinanceCloseStatus.ReadyForReview
            ? new Date()
            : undefined,
        approvedByUserId:
          dto.status === FinanceCloseStatus.Approved ? userId : undefined,
        approvedAt:
          dto.status === FinanceCloseStatus.Approved ? new Date() : undefined,
        reopenedByUserId:
          dto.status === FinanceCloseStatus.Reopened ? userId : undefined,
        reopenedAt:
          dto.status === FinanceCloseStatus.Reopened ? new Date() : undefined,
        reopenReason: dto.reason,
      },
    });
  }

  async closeWorkspace(
    userId: string,
    organizationId: string,
    eventId: string,
  ) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const [
      openCloseItems,
      openReconciliations,
      openCommitments,
      unapprovedActuals,
      execution,
    ] = await Promise.all([
      this.prisma.eventFinanceCloseItem.count({
        where: {
          financeWorkspaceId: workspace.id,
          status: { not: FinanceCloseStatus.Approved },
        },
      }),
      this.prisma.eventFinanceReconciliation.count({
        where: {
          financeWorkspaceId: workspace.id,
          status: { not: FinanceReconciliationStatus.Approved },
        },
      }),
      this.prisma.eventFinanceCommitment.count({
        where: {
          financeWorkspaceId: workspace.id,
          status: {
            notIn: [
              FinanceCommitmentStatus.Settled,
              FinanceCommitmentStatus.Cancelled,
            ],
          },
        },
      }),
      this.prisma.eventFinancialLine.count({
        where: {
          financeWorkspaceId: workspace.id,
          stage: { in: [FinanceValueStage.Actual, FinanceValueStage.Accrual] },
          approvedAt: null,
        },
      }),
      this.prisma.eventExecution.findUnique({
        where: { eventId },
        select: { status: true },
      }),
    ]);
    if (
      openCloseItems ||
      openReconciliations ||
      openCommitments ||
      unapprovedActuals ||
      !execution ||
      !['Completed', 'Closed', 'Archived'].includes(execution.status)
    ) {
      throw new ConflictException({
        message: 'Event is not financially ready to close',
        openCloseItems,
        openReconciliations,
        openCommitments,
        unapprovedActuals,
        executionStatus: execution?.status ?? null,
      });
    }
    return this.prisma.eventFinanceWorkspace.update({
      where: { id: workspace.id },
      data: { status: FinanceWorkspaceStatus.Closed, closedAt: new Date() },
    });
  }

  async summary(userId: string, organizationId: string, eventId: string) {
    const workspace = await this.requireWorkspace(
      userId,
      organizationId,
      eventId,
    );
    const [versions, lines, commitments, invoices, payments, changes] =
      await Promise.all([
        this.prisma.eventBudgetVersion.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            status: {
              in: [FinanceVersionStatus.Approved, FinanceVersionStatus.Locked],
            },
          },
          include: { lines: true },
        }),
        this.prisma.eventFinancialLine.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            approvedAt: { not: null },
          },
        }),
        this.prisma.eventFinanceCommitment.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            status: { not: FinanceCommitmentStatus.Cancelled },
          },
        }),
        this.prisma.eventClientInvoice.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            status: {
              notIn: [
                FinanceInvoiceStatus.Draft,
                FinanceInvoiceStatus.Cancelled,
              ],
            },
          },
        }),
        this.prisma.eventFinancePayment.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            status: FinancePaymentStatus.Cleared,
          },
        }),
        this.prisma.eventFinancialChange.findMany({
          where: {
            financeWorkspaceId: workspace.id,
            status: FinanceVersionStatus.Approved,
          },
        }),
      ]);
    const latestByType = new Map<string, (typeof versions)[number]>();
    for (const version of versions.sort((a, b) => b.version - a.version))
      if (!latestByType.has(version.versionType))
        latestByType.set(version.versionType, version);
    const budget = [...latestByType.values()].flatMap(
      (version) => version.lines,
    );
    const budgetRevenue = this.sum(
      budget
        .filter((line) => line.lineType === 'Revenue')
        .map((line) => line.amount),
    );
    const budgetCost = this.sum(
      budget
        .filter(
          (line) => line.lineType !== 'Revenue' && line.lineType !== 'Recovery',
        )
        .map((line) => line.amount),
    );
    const actualRevenue = this.sum(
      lines
        .filter(
          (line) =>
            line.lineType === 'Revenue' &&
            (line.stage === FinanceValueStage.Actual ||
              line.stage === FinanceValueStage.Billing),
        )
        .map((line) => line.totalAmount),
    );
    const actualCost = this.sum(
      lines
        .filter(
          (line) =>
            line.lineType !== 'Revenue' &&
            (line.stage === FinanceValueStage.Actual ||
              line.stage === FinanceValueStage.Accrual),
        )
        .map((line) => line.totalAmount),
    );
    const committedCost = this.sum(commitments.map((row) => row.totalAmount));
    const approvedChangeMargin = this.sum(
      changes.map((row) => row.marginImpact),
    );
    const forecastRevenue =
      actualRevenue ||
      budgetRevenue + this.sum(changes.map((row) => row.revenueImpact));
    const forecastCost = Math.max(
      actualCost + committedCost,
      budgetCost + this.sum(changes.map((row) => row.costImpact)),
    );
    return {
      readOnly: true,
      sourceOfTruth: {
        operationalFinancialControl: 'EventOS',
        statutoryAccounting:
          workspace.statutorySystemName ?? 'ExternalAccountingSystem',
      },
      budgetRevenue,
      budgetCost,
      budgetMargin: budgetRevenue - budgetCost,
      committedCost,
      actualRevenue,
      actualCost,
      forecastRevenue,
      forecastCost,
      forecastMargin: forecastRevenue - forecastCost,
      approvedChangeMargin,
      invoicedRevenue: this.sum(invoices.map((row) => row.totalAmount)),
      accountsReceivable: this.sum(invoices.map((row) => row.balanceAmount)),
      clearedReceipts: this.sum(
        payments
          .filter((row) => row.direction === 'Receipt')
          .map((row) => row.amount),
      ),
      clearedDisbursements: this.sum(
        payments
          .filter((row) => row.direction !== 'Receipt')
          .map((row) => row.amount),
      ),
    };
  }

  private async requireWorkspace(
    userId: string,
    organizationId: string,
    eventId: string,
  ) {
    await this.requireEventAccess(userId, organizationId, eventId);
    const workspace = await this.prisma.eventFinanceWorkspace.findUnique({
      where: { eventId },
    });
    if (!workspace || workspace.organizationId !== organizationId)
      throw new NotFoundException('Finance Workspace not found');
    return workspace;
  }

  private async requireEventAccess(
    userId: string,
    organizationId: string,
    eventId: string,
  ) {
    const [event, membership] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        select: { organizationId: true },
      }),
      this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
        select: { id: true },
      }),
    ]);
    if (!event || event.organizationId !== organizationId)
      throw new NotFoundException('Event not found');
    if (!membership)
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
  }

  private async requireWbs(financeWorkspaceId: string, wbsNodeId: string) {
    const node = await this.prisma.financeWbsNode.findUnique({
      where: { id: wbsNodeId },
    });
    if (!node || node.financeWorkspaceId !== financeWorkspaceId)
      throw new BadRequestException(
        'WBS node is outside this Finance Workspace',
      );
  }

  private audit(
    tx: Prisma.TransactionClient,
    financeWorkspaceId: string,
    entityType: string,
    entityId: string,
    action: string,
    userId: string,
    previousValue?: unknown,
    newValue?: unknown,
  ) {
    return tx.eventFinanceAudit.create({
      data: {
        financeWorkspaceId,
        entityType,
        entityId,
        action,
        userId,
        sourceModule: 'FinanceControl',
        previousValue: previousValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
      },
    });
  }

  private sum(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0);
  }
}

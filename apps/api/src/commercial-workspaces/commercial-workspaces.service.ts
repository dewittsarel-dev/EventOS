import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommercialMessageAuthorRole,
  CommercialMessageType,
  CommercialRfqStatus,
  CommercialQuoteStatus,
  CommercialSubstitutionReviewStatus,
  CommercialPurchaseOrderDraftStatus,
  CommercialAward,
  CommercialPurchaseOrderDraft,
  CommercialPurchaseOrderDraftLine,
  CommercialWorkspaceStatus,
  ProcurementPackageStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommercialMessageDto,
  CreateCommercialAwardsDto,
  GenerateCommercialWorkspaceDto,
  ReviewCommercialSubstitutionDto,
  ReviseCommercialRfqDto,
  SubmitCommercialQuoteDto,
} from './dto/commercial-workspace.dto';

const FULL_WORKSPACE_INCLUDE = {
  procurementPackage: true,
  procurementSolution: { include: { allocations: true } },
  rfqs: {
    orderBy: { supplierName: 'asc' as const },
    include: { lines: { orderBy: { sortOrder: 'asc' as const } } },
  },
  messages: { orderBy: { createdAt: 'asc' as const } },
  quotes: {
    orderBy: { submittedAt: 'asc' as const },
    include: { lines: { include: { substitutionImpact: true, awards: true } } },
  },
  awards: { orderBy: { awardedAt: 'asc' as const } },
  purchaseOrderDrafts: {
    orderBy: { createdAt: 'asc' as const },
    include: { lines: true },
  },
} as const;

@Injectable()
export class CommercialWorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    userId: string,
    eventId: string,
    packageId: string,
    dto: GenerateCommercialWorkspaceDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const procurementPackage = await this.prisma.procurementPackage.findUnique({
      where: { id: packageId },
      include: {
        event: true,
        solutions: {
          where: { selectedAt: { not: null } },
          include: {
            allocations: { include: { requirementItem: true } },
          },
        },
      },
    });
    if (!procurementPackage || procurementPackage.eventId !== eventId) {
      throw new NotFoundException('Procurement Package not found');
    }
    if (
      procurementPackage.status !==
        ProcurementPackageStatus.QuotationRequested ||
      procurementPackage.solutions.length !== 1
    ) {
      throw new ConflictException(
        'A selected Procurement Solution must request quotation generation first',
      );
    }
    const submissionDeadline = new Date(dto.submissionDeadline);
    if (submissionDeadline <= new Date()) {
      throw new BadRequestException('submissionDeadline must be in the future');
    }
    const selectedSolution = procurementPackage.solutions[0];
    const allocationsBySupplier = new Map<
      string,
      typeof selectedSolution.allocations
    >();
    for (const allocation of selectedSolution.allocations) {
      const rows = allocationsBySupplier.get(allocation.supplierId) ?? [];
      rows.push(allocation);
      allocationsBySupplier.set(allocation.supplierId, rows);
    }

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.commercialWorkspace.create({
        data: {
          organizationId: event.organizationId,
          eventId,
          procurementPackageId: procurementPackage.id,
          procurementSolutionId: selectedSolution.id,
          createdByUserId: userId,
        },
      });
      for (const [supplierId, allocations] of allocationsBySupplier) {
        const supplierName = allocations[0].supplierName;
        const deliveryDates = allocations
          .map((row) => row.requirementItem.deliveryDate)
          .filter((date): date is Date => Boolean(date));
        const collectionDates = allocations
          .map((row) => row.requirementItem.collectionDate)
          .filter((date): date is Date => Boolean(date));
        const rfq = await tx.commercialRfq.create({
          data: {
            commercialWorkspaceId: workspace.id,
            supplierId,
            supplierName,
            title: procurementPackage.name,
            eventSummary: `${procurementPackage.event.title} — ${procurementPackage.event.eventType}`,
            deliveryDate:
              deliveryDates.length > 0
                ? new Date(
                    Math.min(...deliveryDates.map((date) => date.getTime())),
                  )
                : procurementPackage.event.startDateTime,
            collectionDate:
              collectionDates.length > 0
                ? new Date(
                    Math.max(...collectionDates.map((date) => date.getTime())),
                  )
                : procurementPackage.event.endDateTime,
            venue:
              procurementPackage.event.location ??
              procurementPackage.event.venue,
            specialNotes: dto.specialNotes,
            submissionDeadline,
          },
        });
        for (let index = 0; index < allocations.length; index += 1) {
          const allocation = allocations[index];
          await tx.commercialRfqLine.create({
            data: {
              commercialRfqId: rfq.id,
              requirementItemId: allocation.requirementItemId,
              description: allocation.requirementItem.name,
              quantity: allocation.quantity,
              unit: allocation.requirementItem.unit,
              sortOrder: index,
            },
          });
        }
        await tx.commercialMessage.create({
          data: {
            commercialWorkspaceId: workspace.id,
            supplierId,
            authorUserId: userId,
            authorRole: CommercialMessageAuthorRole.System,
            type: CommercialMessageType.SystemEvent,
            body: `RFQ draft created for ${supplierName}. Nothing sent.`,
            metadata: { rfqId: rfq.id, status: CommercialRfqStatus.Draft },
          },
        });
      }
      return tx.commercialWorkspace.findUniqueOrThrow({
        where: { id: workspace.id },
        include: FULL_WORKSPACE_INCLUDE,
      });
    });
  }

  async list(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.commercialWorkspace.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: FULL_WORKSPACE_INCLUDE,
    });
  }

  async reviseRfq(
    userId: string,
    eventId: string,
    workspaceId: string,
    rfqId: string,
    dto: ReviseCommercialRfqDto,
  ) {
    const workspace = await this.requireWorkspaceAccess(
      userId,
      eventId,
      workspaceId,
    );
    const rfq = await this.prisma.commercialRfq.findUnique({
      where: { id: rfqId },
      include: { lines: true },
    });
    if (!rfq || rfq.commercialWorkspaceId !== workspace.id) {
      throw new NotFoundException('RFQ not found');
    }
    if (rfq.status !== CommercialRfqStatus.Draft) {
      throw new ConflictException('Only draft RFQs can be revised');
    }
    if (
      dto.submissionDeadline &&
      new Date(dto.submissionDeadline) <= new Date()
    ) {
      throw new BadRequestException('submissionDeadline must be in the future');
    }
    const packageItems = await this.prisma.procurementPackageItem.findMany({
      where: { procurementPackageId: workspace.procurementPackageId },
      include: { requirementItem: true },
    });
    const itemById = new Map(
      packageItems.map((row) => [row.requirementItemId, row.requirementItem]),
    );
    const uniqueIds = new Set(dto.lines.map((line) => line.requirementItemId));
    if (
      uniqueIds.size !== dto.lines.length ||
      dto.lines.some((line) => !itemById.has(line.requirementItemId))
    ) {
      throw new BadRequestException(
        'RFQ lines must be unique Requirement Items from the package',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          supplierId: rfq.supplierId,
          authorUserId: userId,
          authorRole: CommercialMessageAuthorRole.System,
          type: CommercialMessageType.SystemEvent,
          body: `RFQ draft revised for ${rfq.supplierName}.`,
          metadata: {
            rfqId,
            previousLines: rfq.lines.map((line) => ({
              requirementItemId: line.requirementItemId,
              quantity: line.quantity,
              notes: line.notes,
            })),
            nextLines: dto.lines.map((line) => ({
              requirementItemId: line.requirementItemId,
              quantity: line.quantity,
              notes: line.notes ?? null,
            })),
          },
        },
      });
      await tx.commercialRfqLine.deleteMany({
        where: { commercialRfqId: rfqId },
      });
      for (let index = 0; index < dto.lines.length; index += 1) {
        const line = dto.lines[index];
        const item = itemById.get(line.requirementItemId)!;
        await tx.commercialRfqLine.create({
          data: {
            commercialRfqId: rfqId,
            requirementItemId: item.id,
            description: item.name,
            quantity: line.quantity,
            unit: item.unit,
            notes: line.notes,
            sortOrder: index,
          },
        });
      }
      return tx.commercialRfq.update({
        where: { id: rfqId },
        data: {
          specialNotes: dto.specialNotes,
          submissionDeadline: dto.submissionDeadline
            ? new Date(dto.submissionDeadline)
            : undefined,
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async approveRfq(
    userId: string,
    eventId: string,
    workspaceId: string,
    rfqId: string,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const rfq = await this.requireRfq(workspaceId, rfqId);
    if (rfq.status !== CommercialRfqStatus.Draft) {
      throw new ConflictException('Only draft RFQs can be approved');
    }
    return this.prisma.commercialRfq.update({
      where: { id: rfqId },
      data: {
        status: CommercialRfqStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
      include: { lines: true },
    });
  }

  async sendRfq(
    userId: string,
    eventId: string,
    workspaceId: string,
    rfqId: string,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const rfq = await this.requireRfq(workspaceId, rfqId);
    if (rfq.status !== CommercialRfqStatus.Approved) {
      throw new ConflictException(
        'Planner approval is required before sending',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const sentAt = new Date();
      const updated = await tx.commercialRfq.update({
        where: { id: rfqId },
        data: { status: CommercialRfqStatus.Sent, sentAt },
        include: { lines: true },
      });
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          supplierId: rfq.supplierId,
          authorUserId: userId,
          authorRole: CommercialMessageAuthorRole.Planner,
          type: CommercialMessageType.Rfq,
          body: `Structured RFQ sent to ${rfq.supplierName} supplier workspace.`,
          metadata: { rfqId, deliveryChannel: 'SupplierWorkspace' },
          sentAt,
        },
      });
      await tx.commercialWorkspace.update({
        where: { id: workspaceId },
        data: { status: CommercialWorkspaceStatus.Active },
      });
      return updated;
    });
  }

  async addMessage(
    userId: string,
    eventId: string,
    workspaceId: string,
    dto: CreateCommercialMessageDto,
  ) {
    const workspace = await this.requireWorkspaceAccess(
      userId,
      eventId,
      workspaceId,
    );
    if (dto.supplierId) {
      const supplierExists = workspace.rfqs.some(
        (rfq) => rfq.supplierId === dto.supplierId,
      );
      if (!supplierExists) {
        throw new BadRequestException('Supplier is not part of this workspace');
      }
    }
    const isAiDraft = dto.type === CommercialMessageType.AiComment;
    return this.prisma.commercialMessage.create({
      data: {
        commercialWorkspaceId: workspaceId,
        supplierId: dto.supplierId,
        authorUserId: userId,
        authorRole: isAiDraft
          ? CommercialMessageAuthorRole.Ai
          : CommercialMessageAuthorRole.Planner,
        type: dto.type,
        body: dto.body,
        sentAt: isAiDraft ? null : new Date(),
        metadata: isAiDraft
          ? { draftOnly: true, operatorApprovalRequired: true }
          : undefined,
      },
    });
  }

  async submitQuote(
    userId: string,
    eventId: string,
    workspaceId: string,
    rfqId: string,
    dto: SubmitCommercialQuoteDto,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const rfq = await this.prisma.commercialRfq.findUnique({
      where: { id: rfqId },
      include: { lines: true, quotes: { orderBy: { version: 'desc' } } },
    });
    if (!rfq || rfq.commercialWorkspaceId !== workspaceId) {
      throw new NotFoundException('RFQ not found');
    }
    if (rfq.status !== CommercialRfqStatus.Sent) {
      throw new ConflictException('Quotes can only respond to a sent RFQ');
    }
    const rfqLines = new Map(
      rfq.lines.map((line) => [line.requirementItemId, line]),
    );
    if (
      new Set(dto.lines.map((line) => line.requirementItemId)).size !==
        dto.lines.length ||
      dto.lines.some((line) => !rfqLines.has(line.requirementItemId))
    ) {
      throw new BadRequestException(
        'Quote lines must uniquely reference Requirement Items in the RFQ',
      );
    }
    const subtotal = dto.lines.reduce(
      (sum, line) =>
        sum + (line.included ? 0 : line.quantityOffered * line.unitPrice),
      0,
    );
    const version = (rfq.quotes[0]?.version ?? 0) + 1;
    return this.prisma.$transaction(async (tx) => {
      await tx.commercialQuote.updateMany({
        where: {
          commercialRfqId: rfqId,
          status: CommercialQuoteStatus.Submitted,
        },
        data: { status: CommercialQuoteStatus.Superseded },
      });
      const quote = await tx.commercialQuote.create({
        data: {
          commercialWorkspaceId: workspaceId,
          commercialRfqId: rfqId,
          supplierId: rfq.supplierId,
          supplierName: rfq.supplierName,
          version,
          currency: dto.currency ?? 'ZAR',
          deliveryFee: dto.deliveryFee ?? 0,
          taxAmount: dto.taxAmount ?? 0,
          subtotal,
          totalAmount: subtotal + (dto.deliveryFee ?? 0) + (dto.taxAmount ?? 0),
          paymentTerms: dto.paymentTerms,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          lines: {
            create: dto.lines.map((line) => ({
              requirementItemId: line.requirementItemId,
              description: rfqLines.get(line.requirementItemId)!.description,
              offeredDescription: line.offeredDescription,
              quantityOffered: line.quantityOffered,
              unitPrice: line.unitPrice,
              lineTotal: line.included
                ? 0
                : line.quantityOffered * line.unitPrice,
              included: line.included ?? false,
              qualificationNotes: line.qualificationNotes,
              availabilityNotes: line.availabilityNotes,
              expectedDeliveryDate: line.expectedDeliveryDate
                ? new Date(line.expectedDeliveryDate)
                : undefined,
              isSubstitution: line.isSubstitution ?? false,
              substitutionImpact: line.isSubstitution
                ? { create: { requirementItemId: line.requirementItemId } }
                : undefined,
            })),
          },
        },
        include: { lines: { include: { substitutionImpact: true } } },
      });
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          supplierId: rfq.supplierId,
          authorRole: CommercialMessageAuthorRole.Supplier,
          type: CommercialMessageType.SystemEvent,
          body: `Quote V${version} submitted by ${rfq.supplierName}.`,
          metadata: {
            quoteId: quote.id,
            version,
            supersedesVersion: version > 1 ? version - 1 : null,
          },
          sentAt: new Date(),
        },
      });
      return quote;
    });
  }

  async compareQuotes(userId: string, eventId: string, workspaceId: string) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const quotes = await this.prisma.commercialQuote.findMany({
      where: {
        commercialWorkspaceId: workspaceId,
        status: CommercialQuoteStatus.Submitted,
      },
      include: { lines: { include: { substitutionImpact: true } } },
      orderBy: { totalAmount: 'asc' },
    });
    const requirements = new Map<string, Array<Record<string, unknown>>>();
    for (const quote of quotes) {
      for (const line of quote.lines) {
        const alternatives = requirements.get(line.requirementItemId) ?? [];
        alternatives.push({
          quoteId: quote.id,
          quoteLineId: line.id,
          supplierId: quote.supplierId,
          supplierName: quote.supplierName,
          offeredDescription: line.offeredDescription,
          quantityOffered: line.quantityOffered,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          included: line.included,
          qualificationNotes: line.qualificationNotes,
          availabilityNotes: line.availabilityNotes,
          expectedDeliveryDate: line.expectedDeliveryDate,
          substitutionImpact: line.substitutionImpact,
        });
        requirements.set(line.requirementItemId, alternatives);
      }
    }
    const rows = [...requirements.entries()].map(
      ([requirementItemId, alternatives]) => ({
        requirementItemId,
        alternatives,
        lowestCostQuoteLineId: [...alternatives].sort(
          (a, b) => Number(a.lineTotal) - Number(b.lineTotal),
        )[0]?.quoteLineId,
      }),
    );
    const completeQuotes = quotes.filter(
      (quote) => quote.lines.length === rows.length,
    );
    return {
      workspaceId,
      rows,
      highlights: {
        missingItems: rows
          .filter((row) => row.alternatives.length < quotes.length)
          .map((row) => row.requirementItemId),
        substitutionsPendingReview: rows
          .flatMap((row) => row.alternatives)
          .filter(
            (line) =>
              (line.substitutionImpact as { status?: string } | null)
                ?.status === CommercialSubstitutionReviewStatus.PendingReview,
          )
          .map((line) => line.quoteLineId),
      },
      recommendations: [
        {
          strategy: 'LowestCostByRequirement',
          explanation:
            'Selects the lowest priced eligible line per Requirement Item; may increase supplier count.',
          quoteLineIds: rows
            .map((row) => row.lowestCostQuoteLineId)
            .filter(Boolean),
        },
        ...(completeQuotes[0]
          ? [
              {
                strategy: 'FewestSuppliers',
                explanation:
                  'Uses one supplier with complete Requirement Item coverage; planner must review qualifications and delivery.',
                quoteIds: [completeQuotes[0].id],
                totalAmount: completeQuotes[0].totalAmount,
              },
            ]
          : []),
      ],
      decisionRequired: true,
    };
  }

  async reviewSubstitution(
    userId: string,
    eventId: string,
    workspaceId: string,
    impactId: string,
    dto: ReviewCommercialSubstitutionDto,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const impact = await this.prisma.commercialSubstitutionImpact.findUnique({
      where: { id: impactId },
      include: { commercialQuoteLine: { include: { commercialQuote: true } } },
    });
    if (
      !impact ||
      impact.commercialQuoteLine.commercialQuote.commercialWorkspaceId !==
        workspaceId
    ) {
      throw new NotFoundException('Substitution impact not found');
    }
    return this.prisma.commercialSubstitutionImpact.update({
      where: { id: impactId },
      data: {
        status: dto.status,
        reviewNotes: dto.notes,
        reviewedByUserId: userId,
        reviewedAt: new Date(),
      },
    });
  }

  async award(
    userId: string,
    eventId: string,
    workspaceId: string,
    dto: CreateCommercialAwardsDto,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    if (
      new Set(dto.lines.map((line) => line.quoteLineId)).size !==
      dto.lines.length
    ) {
      throw new BadRequestException('Award lines must be unique');
    }
    const quoteLines = await this.prisma.commercialQuoteLine.findMany({
      where: { id: { in: dto.lines.map((line) => line.quoteLineId) } },
      include: { commercialQuote: true, substitutionImpact: true },
    });
    if (
      quoteLines.length !== dto.lines.length ||
      quoteLines.some(
        (line) =>
          line.commercialQuote.commercialWorkspaceId !== workspaceId ||
          line.commercialQuote.status !== CommercialQuoteStatus.Submitted,
      )
    ) {
      throw new BadRequestException(
        'Awards require current quotes from this workspace',
      );
    }
    if (
      quoteLines.some(
        (line) =>
          line.substitutionImpact &&
          line.substitutionImpact.status !==
            CommercialSubstitutionReviewStatus.Approved,
      )
    ) {
      throw new ConflictException(
        'Substitution impacts require planner approval before award',
      );
    }
    const requested = new Map(
      dto.lines.map((line) => [line.quoteLineId, line.quantity]),
    );
    return this.prisma.$transaction(async (tx) => {
      const awards: CommercialAward[] = [];
      for (const line of quoteLines) {
        const quantity = requested.get(line.id)!;
        if (quantity > line.quantityOffered) {
          throw new BadRequestException(
            'Award quantity exceeds quoted quantity',
          );
        }
        awards.push(
          await tx.commercialAward.create({
            data: {
              commercialWorkspaceId: workspaceId,
              commercialQuoteLineId: line.id,
              requirementItemId: line.requirementItemId,
              supplierId: line.commercialQuote.supplierId,
              quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.included ? 0 : quantity * line.unitPrice,
              awardedByUserId: userId,
            },
          }),
        );
      }
      await tx.commercialWorkspace.update({
        where: { id: workspaceId },
        data: { status: CommercialWorkspaceStatus.Awarded },
      });
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          authorUserId: userId,
          authorRole: CommercialMessageAuthorRole.Planner,
          type: CommercialMessageType.SystemEvent,
          body: `${awards.length} Requirement Item award(s) approved by planner.`,
          metadata: { awardIds: awards.map((award) => award.id) },
          sentAt: new Date(),
        },
      });
      return awards;
    });
  }

  async preparePurchaseOrderDrafts(
    userId: string,
    eventId: string,
    workspaceId: string,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const awards = await this.prisma.commercialAward.findMany({
      where: { commercialWorkspaceId: workspaceId },
      include: { commercialQuoteLine: { include: { commercialQuote: true } } },
    });
    if (awards.length === 0)
      throw new ConflictException(
        'Awards are required before Purchase Order preparation',
      );
    const bySupplier = new Map<string, typeof awards>();
    for (const award of awards) {
      const rows = bySupplier.get(award.supplierId) ?? [];
      rows.push(award);
      bySupplier.set(award.supplierId, rows);
    }
    return this.prisma.$transaction(async (tx) => {
      const drafts: Array<
        CommercialPurchaseOrderDraft & {
          lines: CommercialPurchaseOrderDraftLine[];
        }
      > = [];
      for (const [supplierId, rows] of bySupplier) {
        const quote = rows[0].commercialQuoteLine.commercialQuote;
        const subtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0);
        drafts.push(
          await tx.commercialPurchaseOrderDraft.upsert({
            where: {
              commercialWorkspaceId_supplierId: {
                commercialWorkspaceId: workspaceId,
                supplierId,
              },
            },
            create: {
              commercialWorkspaceId: workspaceId,
              supplierId,
              supplierName: quote.supplierName,
              currency: quote.currency,
              subtotal,
              totalAmount: subtotal,
              paymentTerms: quote.paymentTerms,
              lines: {
                create: rows.map((row) => ({
                  commercialAwardId: row.id,
                  requirementItemId: row.requirementItemId,
                  description: row.commercialQuoteLine.offeredDescription,
                  quantity: row.quantity,
                  unitPrice: row.unitPrice,
                  lineTotal: row.lineTotal,
                })),
              },
            },
            update: {},
            include: { lines: true },
          }),
        );
      }
      return drafts;
    });
  }

  async approvePurchaseOrderDraft(
    userId: string,
    eventId: string,
    workspaceId: string,
    draftId: string,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const draft = await this.prisma.commercialPurchaseOrderDraft.findUnique({
      where: { id: draftId },
    });
    if (!draft || draft.commercialWorkspaceId !== workspaceId)
      throw new NotFoundException('Purchase Order draft not found');
    if (draft.status !== CommercialPurchaseOrderDraftStatus.Draft)
      throw new ConflictException('Only draft Purchase Orders can be approved');
    return this.prisma.commercialPurchaseOrderDraft.update({
      where: { id: draftId },
      data: {
        status: CommercialPurchaseOrderDraftStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });
  }

  private async requireRfq(workspaceId: string, rfqId: string) {
    const rfq = await this.prisma.commercialRfq.findUnique({
      where: { id: rfqId },
    });
    if (!rfq || rfq.commercialWorkspaceId !== workspaceId) {
      throw new NotFoundException('RFQ not found');
    }
    return rfq;
  }

  private async requireWorkspaceAccess(
    userId: string,
    eventId: string,
    workspaceId: string,
  ) {
    await this.requireEventAccess(userId, eventId);
    const workspace = await this.prisma.commercialWorkspace.findUnique({
      where: { id: workspaceId },
      include: { rfqs: true },
    });
    if (!workspace || workspace.eventId !== eventId) {
      throw new NotFoundException('Commercial Workspace not found');
    }
    return workspace;
  }

  private async requireEventAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: event.organizationId },
      },
      select: { id: true },
    });
    if (!membership)
      throw new ForbiddenException('You do not have access to this event');
    return event;
  }
}

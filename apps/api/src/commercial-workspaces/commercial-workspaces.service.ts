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
  CommercialWorkspaceStatus,
  ProcurementPackageStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommercialMessageDto,
  GenerateCommercialWorkspaceDto,
  ReviseCommercialRfqDto,
} from './dto/commercial-workspace.dto';

const FULL_WORKSPACE_INCLUDE = {
  procurementPackage: true,
  procurementSolution: { include: { allocations: true } },
  rfqs: {
    orderBy: { supplierName: 'asc' as const },
    include: { lines: { orderBy: { sortOrder: 'asc' as const } } },
  },
  messages: { orderBy: { createdAt: 'asc' as const } },
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

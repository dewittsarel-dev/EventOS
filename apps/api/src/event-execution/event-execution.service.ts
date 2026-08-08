import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExecutionControlStatus,
  ExecutionStatus,
  Prisma,
  ResourceReservationSourceType,
  ResourceReservationStatus,
  TaskPriority,
  ExecutionGateDecision,
  ExecutionIncidentStatus,
} from '@prisma/client';
import type { CapabilityActionDefinition } from '../capabilities/capability.types';
import { PrismaService } from '../prisma/prisma.service';
import { eventExecutionCapabilityActions } from './event-execution-capability.actions';
import type { EventExecutionPort } from './event-execution.port';
import type {
  ArchiveEventExecutionInput,
  AssignEventTasksInput,
  BuildEventExecutionPlanInput,
  CancelEventExecutionInput,
  CollectEventExecutionInput,
  CompleteEventExecutionInput,
  CreateEventExecutionInput,
  DispatchEventExecutionInput,
  EventExecutionAvailabilityEffect,
  EventExecutionRecord,
  GenerateEventPurchaseOrdersInput,
  GenerateSupplierBookingsInput,
  ReleaseEventResourcesInput,
  ReserveEventResourcesInput,
} from './event-execution.types';
import {
  AssessExecutionGateDto,
  ChangeExecutionIncidentStatusDto,
  ChangeExecutionTaskStatusDto,
  CompleteCloseoutItemDto,
  CreateCloseoutItemDto,
  CreateExecutionIncidentDto,
  CreateExecutionTaskDto,
  CreateSiteControlDto,
  RecordCommandLogDto,
  RecordCommissioningCheckDto,
  RecordExecutionAcceptanceDto,
  SetRunOfShowDto,
} from './dto/event-execution.dto';

const EXECUTION_INCLUDE = {
  milestones: { orderBy: { dueAt: 'asc' as const } },
} as const;

@Injectable()
export class EventExecutionService implements EventExecutionPort {
  constructor(private readonly prisma: PrismaService) {}

  listSupportedActions(): CapabilityActionDefinition[] {
    return eventExecutionCapabilityActions.map((action) => ({ ...action }));
  }

  async createExecution(
    input: CreateEventExecutionInput,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    await this.requireEvent(input.organizationId, input.eventId, actorId);
    const existing = await this.prisma.eventExecution.findUnique({
      where: { eventId: input.eventId },
      include: EXECUTION_INCLUDE,
    });
    if (existing) return this.mapExecution(existing);
    const execution = await this.prisma.eventExecution.create({
      data: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        summary: input.summary,
        createdByUserId: actorId,
        milestones: {
          create: [
            { key: 'plan-approved', label: 'Execution plan approved' },
            { key: 'resources-ready', label: 'Resources ready' },
            { key: 'venue-access', label: 'Venue access confirmed' },
            { key: 'technical-ready', label: 'Technical commissioning passed' },
            { key: 'client-accepted', label: 'Client walkthrough accepted' },
            { key: 'go-live', label: 'Event go-live approved' },
            { key: 'asset-recovery', label: 'Asset recovery completed' },
            { key: 'venue-handover', label: 'Venue handover completed' },
          ],
        },
      },
      include: EXECUTION_INCLUDE,
    });
    return this.mapExecution(execution);
  }

  async buildExecutionPlan(
    input: BuildEventExecutionPlanInput,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const requirements = await this.prisma.requirementItem.findMany({
      where: { requirementSet: { eventId: input.eventId, status: 'Approved' } },
      orderBy: { requirementCode: 'asc' },
    });
    return this.prisma.$transaction(async (tx) => {
      const version = execution.executionPlanVersion + 1;
      const standard = [
        ['venue', 'Venue and Site'],
        ['assets', 'Assets and Logistics'],
        ['suppliers', 'Suppliers'],
        ['technical', 'Technical'],
        ['guest', 'Guest Operations'],
        ['safety', 'Safety and Security'],
        ['closeout', 'Breakdown and Closeout'],
      ];
      for (let sequence = 0; sequence < standard.length; sequence += 1) {
        const [key, name] = standard[sequence];
        await tx.executionWorkstream.upsert({
          where: {
            eventExecutionId_key: { eventExecutionId: execution.id, key },
          },
          create: { eventExecutionId: execution.id, key, name, sequence },
          update: { name, sequence },
        });
      }
      for (let sequence = 0; sequence < requirements.length; sequence += 1) {
        const requirement = requirements[sequence];
        await tx.executionTask.upsert({
          where: { id: `execution-requirement-${requirement.id}` },
          create: {
            id: `execution-requirement-${requirement.id}`,
            eventExecutionId: execution.id,
            requirementItemId: requirement.id,
            title: `Deliver ${requirement.name}`,
            description: requirement.description,
            completionCriteria: `Requirement ${requirement.requirementCode} is deployed, verified and evidenced.`,
            sequence,
          },
          update: {
            title: `Deliver ${requirement.name}`,
            description: requirement.description,
            completionCriteria: `Requirement ${requirement.requirementCode} is deployed, verified and evidenced.`,
            sequence,
          },
        });
      }
      const updated = await tx.eventExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.Planning,
          executionPlanVersion: version,
          summary: input.planningContext
            ? JSON.stringify(input.planningContext)
            : execution.summary,
        },
        include: EXECUTION_INCLUDE,
      });
      return this.mapExecution(updated);
    });
  }

  async reserveResources(
    input: ReserveEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const requests = input.resourceRequests ?? [];
    const ids: string[] = [];
    for (const request of requests) {
      if (
        !request.resourceId ||
        !request.from ||
        !request.to ||
        !request.quantity
      )
        throw new BadRequestException(
          'Resource reservation requires resourceId, quantity, from and to',
        );
      const resource = await this.prisma.resource.findUnique({
        where: { id: request.resourceId },
      });
      if (!resource || resource.organizationId !== input.organizationId)
        throw new NotFoundException('Resource not found');
      const reservation = await this.prisma.resourceReservation.create({
        data: {
          organizationId: input.organizationId,
          resourceId: request.resourceId,
          sourceType: ResourceReservationSourceType.EVENT,
          sourceId: input.eventId,
          quantity: request.quantity,
          startDateTime: new Date(request.from),
          endDateTime: new Date(request.to),
          status: ResourceReservationStatus.RESERVED,
          notes: `Execution ${execution.id}`,
        },
      });
      ids.push(reservation.id);
    }
    await this.prisma.eventExecution.update({
      where: { id: execution.id },
      data: { status: ExecutionStatus.ResourcesReserved },
    });
    return this.effect(input.eventId, { reservedResourceIds: ids });
  }

  async releaseResources(
    input: ReleaseEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    const actorId = this.requireActor(input.actorId);
    await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const ids = input.reservationIds ?? [];
    await this.prisma.resourceReservation.updateMany({
      where: {
        id: { in: ids },
        organizationId: input.organizationId,
        sourceType: ResourceReservationSourceType.EVENT,
        sourceId: input.eventId,
      },
      data: { status: ResourceReservationStatus.RELEASED },
    });
    return this.effect(input.eventId, { releasedResourceIds: ids });
  }

  async generatePurchaseOrders(
    input: GenerateEventPurchaseOrdersInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const drafts = await this.prisma.commercialPurchaseOrderDraft.findMany({
      where: {
        commercialWorkspace: { eventId: input.eventId },
        status: 'Approved',
      },
      select: { id: true },
    });
    await this.prisma.eventExecution.update({
      where: { id: execution.id },
      data: { status: ExecutionStatus.ProcurementPrepared },
    });
    return this.effect(input.eventId, {
      generatedPurchaseOrderIds: drafts.map((row) => row.id),
    });
  }

  async generateSupplierBookings(
    input: GenerateSupplierBookingsInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    const actorId = this.requireActor(input.actorId);
    await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const rfqs = await this.prisma.commercialRfq.findMany({
      where: {
        commercialWorkspace: { eventId: input.eventId, status: 'Awarded' },
        ...(input.supplierIds?.length
          ? { supplierId: { in: input.supplierIds } }
          : {}),
      },
      select: { id: true },
    });
    return this.effect(input.eventId, {
      generatedSupplierBookingIds: rfqs.map((row) => row.id),
    });
  }

  async assignTasks(
    input: AssignEventTasksInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const assigned: string[] = [];
    for (
      let index = 0;
      index < (input.taskTemplates ?? []).length;
      index += 1
    ) {
      const title = input.taskTemplates![index];
      const task = await this.prisma.executionTask.create({
        data: {
          eventExecutionId: execution.id,
          title,
          completionCriteria: `${title} is completed with objective evidence.`,
          assignedUserId:
            input.assignedUserIds?.[index] ?? input.assignedUserIds?.[0],
          priority: TaskPriority.Medium,
          sequence: index,
        },
      });
      assigned.push(task.id);
    }
    await this.prisma.eventExecution.update({
      where: { id: execution.id },
      data: { status: ExecutionStatus.StaffAssigned },
    });
    return this.effect(input.eventId, { assignedTaskIds: assigned });
  }

  dispatch(input: DispatchEventExecutionInput) {
    return this.transition(input, ExecutionStatus.DispatchScheduled);
  }
  collect(input: CollectEventExecutionInput) {
    return this.transition(input, ExecutionStatus.CollectionScheduled);
  }

  async complete(
    input: CompleteEventExecutionInput,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    const blockers = await this.prisma.executionCloseoutItem.count({
      where: {
        eventExecutionId: execution.id,
        status: {
          notIn: [
            ExecutionControlStatus.Completed,
            ExecutionControlStatus.Waived,
            ExecutionControlStatus.Cancelled,
          ],
        },
      },
    });
    if (blockers > 0)
      throw new ConflictException(
        'Execution closeout has incomplete controlled items',
      );
    return this.updateAndMap(execution.id, {
      status: ExecutionStatus.Completed,
      completedAt: new Date(),
      summary: input.completionNotes ?? execution.summary,
    });
  }

  async cancel(
    input: CancelEventExecutionInput,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    if (!input.reason)
      throw new BadRequestException('Cancellation reason is required');
    return this.updateAndMap(execution.id, {
      status: ExecutionStatus.Cancelled,
      cancelledAt: new Date(),
      cancellationReason: input.reason,
    });
  }

  async archive(
    input: ArchiveEventExecutionInput,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    if (
      execution.status !== ExecutionStatus.Completed &&
      execution.status !== ExecutionStatus.Closed &&
      execution.status !== ExecutionStatus.Cancelled
    )
      throw new ConflictException(
        'Only completed, closed or cancelled execution can be archived',
      );
    return this.updateAndMap(execution.id, {
      status: ExecutionStatus.Archived,
      archivedAt: new Date(),
    });
  }

  async getWorkspace(userId: string, organizationId: string, eventId: string) {
    await this.requireEvent(organizationId, eventId, userId);
    const execution = await this.prisma.eventExecution.findUnique({
      where: { eventId },
      include: {
        workstreams: { orderBy: { sequence: 'asc' } },
        milestones: { orderBy: { dueAt: 'asc' } },
        tasks: { orderBy: { sequence: 'asc' } },
        gates: true,
        siteControls: true,
        commissioningChecks: true,
        acceptances: true,
        runOfShowItems: { orderBy: { sequence: 'asc' } },
        commandLogs: { orderBy: { occurredAt: 'asc' } },
        incidents: { orderBy: { reportedAt: 'desc' } },
        closeoutItems: true,
      },
    });
    if (!execution) throw new NotFoundException('Event Execution not found');
    return execution;
  }

  async createTask(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateExecutionTaskDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionTask.create({
      data: {
        eventExecutionId: execution.id,
        workstreamId: dto.workstreamId,
        requirementItemId: dto.requirementItemId,
        title: dto.title,
        description: dto.description,
        completionCriteria: dto.completionCriteria,
        assignedUserId: dto.assignedUserId,
        assignedSupplierId: dto.assignedSupplierId,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
      },
    });
  }

  async changeTaskStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    taskId: string,
    dto: ChangeExecutionTaskStatusDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    const task = await this.prisma.executionTask.findUnique({
      where: { id: taskId },
    });
    if (!task || task.eventExecutionId !== execution.id)
      throw new NotFoundException('Execution Task not found');
    if (
      dto.status === ExecutionControlStatus.Completed &&
      !dto.completionEvidence
    ) {
      throw new BadRequestException(
        'Completion evidence is required against objective criteria',
      );
    }
    if (dto.status === ExecutionControlStatus.Blocked && !dto.blockedReason) {
      throw new BadRequestException('Blocked tasks require a reason');
    }
    return this.prisma.executionTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        completionEvidence: dto.completionEvidence as Prisma.InputJsonValue,
        blockedReason: dto.blockedReason,
        actualStart:
          dto.status === ExecutionControlStatus.InProgress
            ? new Date()
            : undefined,
        actualEnd:
          dto.status === ExecutionControlStatus.Completed
            ? new Date()
            : undefined,
      },
    });
  }

  async assessGate(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: AssessExecutionGateDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    if (dto.decision === ExecutionGateDecision.Waived && !dto.waiverReason) {
      throw new BadRequestException(
        'A readiness gate waiver requires a recorded reason',
      );
    }
    return this.prisma.executionReadinessGate.upsert({
      where: {
        eventExecutionId_key: { eventExecutionId: execution.id, key: dto.key },
      },
      create: {
        eventExecutionId: execution.id,
        key: dto.key,
        name: dto.name,
        category: dto.category,
        decision: dto.decision,
        criteria: dto.criteria as Prisma.InputJsonValue,
        evidence: dto.evidence as Prisma.InputJsonValue,
        blockerSummary: dto.blockerSummary,
        assessedByUserId: userId,
        assessedAt: new Date(),
        waivedByUserId:
          dto.decision === ExecutionGateDecision.Waived ? userId : undefined,
        waivedAt:
          dto.decision === ExecutionGateDecision.Waived
            ? new Date()
            : undefined,
        waiverReason: dto.waiverReason,
      },
      update: {
        name: dto.name,
        category: dto.category,
        decision: dto.decision,
        criteria: dto.criteria as Prisma.InputJsonValue,
        evidence: dto.evidence as Prisma.InputJsonValue,
        blockerSummary: dto.blockerSummary,
        assessedByUserId: userId,
        assessedAt: new Date(),
        waivedByUserId:
          dto.decision === ExecutionGateDecision.Waived ? userId : null,
        waivedAt:
          dto.decision === ExecutionGateDecision.Waived ? new Date() : null,
        waiverReason: dto.waiverReason,
      },
    });
  }

  async createSiteControl(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateSiteControlDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionSiteControl.create({
      data: {
        ...dto,
        eventExecutionId: execution.id,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async recordCommissioning(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: RecordCommissioningCheckDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionCommissioningCheck.create({
      data: {
        ...dto,
        eventExecutionId: execution.id,
        evidence: dto.evidence as Prisma.InputJsonValue,
        testedByUserId: userId,
        testedAt: new Date(),
      },
    });
  }

  async recordAcceptance(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: RecordExecutionAcceptanceDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionAcceptance.create({
      data: {
        ...dto,
        eventExecutionId: execution.id,
        evidence: dto.evidence as Prisma.InputJsonValue,
        acceptedByUserId: userId,
        acceptedAt: new Date(),
      },
    });
  }

  async approveGoLive(userId: string, organizationId: string, eventId: string) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    const [failedGates, failedChecks, acceptances] = await Promise.all([
      this.prisma.executionReadinessGate.count({
        where: {
          eventExecutionId: execution.id,
          required: true,
          decision: {
            notIn: [ExecutionGateDecision.Passed, ExecutionGateDecision.Waived],
          },
        },
      }),
      this.prisma.executionCommissioningCheck.count({
        where: {
          eventExecutionId: execution.id,
          status: {
            notIn: [
              ExecutionControlStatus.Completed,
              ExecutionControlStatus.Waived,
            ],
          },
        },
      }),
      this.prisma.executionAcceptance.count({
        where: {
          eventExecutionId: execution.id,
          decision: ExecutionGateDecision.Passed,
        },
      }),
    ]);
    if (failedGates || failedChecks || acceptances === 0) {
      throw new ConflictException({
        message: 'Go-live readiness controls are incomplete',
        failedGates,
        failedChecks,
        acceptedWalkthroughs: acceptances,
      });
    }
    return this.prisma.eventExecution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.InProgress,
        commandCenterActive: true,
        goLiveApprovedByUserId: userId,
        goLiveApprovedAt: new Date(),
      },
    });
  }

  async setRunOfShow(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: SetRunOfShowDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    if (
      new Set(dto.items.map((item) => item.sequence)).size !== dto.items.length
    )
      throw new BadRequestException(
        'Run-of-show sequence values must be unique',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.executionRunOfShowItem.deleteMany({
        where: {
          eventExecutionId: execution.id,
          status: ExecutionControlStatus.Pending,
        },
      });
      for (const item of dto.items) {
        await tx.executionRunOfShowItem.create({
          data: {
            ...item,
            eventExecutionId: execution.id,
            scheduledAt: new Date(item.scheduledAt),
          },
        });
      }
      return tx.executionRunOfShowItem.findMany({
        where: { eventExecutionId: execution.id },
        orderBy: { sequence: 'asc' },
      });
    });
  }

  async recordCommandLog(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: RecordCommandLogDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionCommandLog.create({
      data: {
        ...dto,
        eventExecutionId: execution.id,
        metadata: dto.metadata as Prisma.InputJsonValue,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId: userId,
      },
    });
  }

  async createIncident(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateExecutionIncidentDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionIncident.create({
      data: {
        ...dto,
        eventExecutionId: execution.id,
        immediateActions: dto.immediateActions as Prisma.InputJsonValue,
        evidence: dto.evidence as Prisma.InputJsonValue,
        reportedByUserId: userId,
        escalatedAt: ['Critical', 'Emergency'].includes(dto.severity)
          ? new Date()
          : undefined,
      },
    });
  }

  async changeIncidentStatus(
    userId: string,
    organizationId: string,
    eventId: string,
    incidentId: string,
    dto: ChangeExecutionIncidentStatusDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    const incident = await this.prisma.executionIncident.findUnique({
      where: { id: incidentId },
    });
    if (!incident || incident.eventExecutionId !== execution.id)
      throw new NotFoundException('Execution Incident not found');
    return this.prisma.executionIncident.update({
      where: { id: incidentId },
      data: {
        status: dto.status,
        evidence: dto.evidence as Prisma.InputJsonValue,
        containedAt:
          dto.status === ExecutionIncidentStatus.Contained
            ? new Date()
            : undefined,
        resolvedAt:
          dto.status === ExecutionIncidentStatus.Resolved
            ? new Date()
            : undefined,
        closedAt:
          dto.status === ExecutionIncidentStatus.Closed
            ? new Date()
            : undefined,
      },
    });
  }

  async createCloseoutItem(
    userId: string,
    organizationId: string,
    eventId: string,
    dto: CreateCloseoutItemDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    return this.prisma.executionCloseoutItem.create({
      data: { ...dto, eventExecutionId: execution.id },
    });
  }

  async completeCloseoutItem(
    userId: string,
    organizationId: string,
    eventId: string,
    itemId: string,
    dto: CompleteCloseoutItemDto,
  ) {
    const execution = await this.requireExecution(
      organizationId,
      eventId,
      undefined,
      userId,
    );
    const item = await this.prisma.executionCloseoutItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.eventExecutionId !== execution.id)
      throw new NotFoundException('Closeout Item not found');
    if (dto.status === ExecutionControlStatus.Completed && !dto.evidence)
      throw new BadRequestException('Closeout completion requires evidence');
    return this.prisma.executionCloseoutItem.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        evidence: dto.evidence as Prisma.InputJsonValue,
        completedByUserId: userId,
        completedAt:
          dto.status === ExecutionControlStatus.Completed
            ? new Date()
            : undefined,
      },
    });
  }

  private async transition(
    input: DispatchEventExecutionInput | CollectEventExecutionInput,
    status: ExecutionStatus,
  ): Promise<EventExecutionRecord> {
    const actorId = this.requireActor(input.actorId);
    const execution = await this.requireExecution(
      input.organizationId,
      input.eventId,
      input.executionId,
      actorId,
    );
    return this.updateAndMap(execution.id, { status });
  }

  private async requireExecution(
    organizationId: string,
    eventId: string,
    executionId: string | undefined,
    actorId: string,
  ) {
    await this.requireEvent(organizationId, eventId, actorId);
    const execution = executionId
      ? await this.prisma.eventExecution.findUnique({
          where: { id: executionId },
          include: EXECUTION_INCLUDE,
        })
      : await this.prisma.eventExecution.findUnique({
          where: { eventId },
          include: EXECUTION_INCLUDE,
        });
    if (
      !execution ||
      execution.organizationId !== organizationId ||
      execution.eventId !== eventId
    )
      throw new NotFoundException('Event Execution not found');
    return execution;
  }

  private async requireEvent(
    organizationId: string,
    eventId: string,
    actorId: string,
  ) {
    const [event, membership] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        select: { organizationId: true },
      }),
      this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId: actorId, organizationId } },
        select: { id: true },
      }),
    ]);
    if (!event || event.organizationId !== organizationId)
      throw new NotFoundException('Event not found');
    if (!membership)
      throw new NotFoundException('Actor has no access to the organization');
  }

  private requireActor(actorId?: string) {
    if (!actorId)
      throw new BadRequestException(
        'actorId is required for controlled execution actions',
      );
    return actorId;
  }

  private async updateAndMap(
    id: string,
    data: Prisma.EventExecutionUpdateInput,
  ) {
    const updated = await this.prisma.eventExecution.update({
      where: { id },
      data,
      include: EXECUTION_INCLUDE,
    });
    return this.mapExecution(updated);
  }

  private mapExecution(row: {
    id: string;
    eventId: string;
    organizationId: string;
    status: ExecutionStatus;
    executionPlanVersion: number;
    summary: string | null;
    milestones: Array<{
      key: string;
      label: string;
      status: ExecutionControlStatus;
      dueAt: Date | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
  }): EventExecutionRecord {
    const statuses: Record<ExecutionStatus, EventExecutionRecord['status']> = {
      Created: 'created',
      Planning: 'planning',
      ResourcesReserved: 'resources-reserved',
      ProcurementPrepared: 'procurement-prepared',
      StaffAssigned: 'staff-assigned',
      DispatchScheduled: 'dispatch-scheduled',
      InProgress: 'in-progress',
      CollectionScheduled: 'collection-scheduled',
      Completed: 'completed',
      Closed: 'closed',
      Cancelled: 'cancelled',
      Archived: 'archived',
    };
    return {
      executionId: row.id,
      eventId: row.eventId,
      organizationId: row.organizationId,
      status: statuses[row.status],
      executionPlanVersion: row.executionPlanVersion,
      summary: row.summary,
      milestones: row.milestones.map((item) => ({
        key: item.key,
        label: item.label,
        status:
          item.status === ExecutionControlStatus.Completed
            ? 'completed'
            : item.status === ExecutionControlStatus.Blocked
              ? 'blocked'
              : item.status === ExecutionControlStatus.Ready
                ? 'ready'
                : 'pending',
        dueAt: item.dueAt?.toISOString() ?? null,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      archivedAt: row.archivedAt?.toISOString() ?? null,
    };
  }

  private effect(
    eventId: string,
    values: Partial<EventExecutionAvailabilityEffect>,
  ): EventExecutionAvailabilityEffect {
    return {
      eventId,
      reservedResourceIds: [],
      releasedResourceIds: [],
      generatedPurchaseOrderIds: [],
      generatedSupplierBookingIds: [],
      assignedTaskIds: [],
      ...values,
    };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinanceVersionStatus } from '@prisma/client';
import { EventExecutionService } from '../event-execution/event-execution.service';
import { FinanceControlService } from '../finance-control/finance-control.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly execution: EventExecutionService,
    private readonly finance: FinanceControlService,
  ) {}

  async continuity(userId: string, organizationId: string, eventId: string) {
    await this.requireAccess(userId, organizationId, eventId);
    const [
      brief,
      design,
      requirementSet,
      moodBoard,
      packages,
      commercial,
      assets,
      execution,
      finance,
    ] = await Promise.all([
      this.prisma.clientBriefVersion.findFirst({
        where: { eventId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true },
      }),
      this.prisma.eventDesignVersion.findFirst({
        where: { eventId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, status: true },
      }),
      this.prisma.requirementSet.findFirst({
        where: { eventId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, status: true },
      }),
      this.prisma.moodBoard.findFirst({
        where: { eventId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, status: true },
      }),
      this.prisma.procurementPackage.findMany({
        where: { eventId },
        select: {
          id: true,
          status: true,
          solutions: {
            where: { selectedAt: { not: null } },
            select: { id: true },
          },
        },
      }),
      this.prisma.commercialWorkspace.findMany({
        where: { eventId },
        select: { id: true, status: true, awards: { select: { id: true } } },
      }),
      this.prisma.assetReservation.count({ where: { eventId } }),
      this.prisma.eventExecution.findUnique({
        where: { eventId },
        select: { id: true, status: true, executionPlanVersion: true },
      }),
      this.prisma.eventFinanceWorkspace.findUnique({
        where: { eventId },
        select: { id: true, status: true },
      }),
    ]);
    const blockers: string[] = [];
    if (!brief) blockers.push('Client Brief missing');
    if (!design || design.status !== 'Approved')
      blockers.push('Approved Event Design missing');
    if (!requirementSet || requirementSet.status !== 'Approved')
      blockers.push('Approved Requirement Set missing');
    if (!moodBoard || moodBoard.status !== 'Approved')
      blockers.push('Approved Mood Board missing');
    if (packages.some((row) => row.solutions.length === 0))
      blockers.push('Procurement Package without selected solution');
    if (
      commercial.some(
        (row) => row.status !== 'Awarded' && row.status !== 'Closed',
      )
    )
      blockers.push('Commercial Workspace not awarded');
    const currentStage = this.currentStage({
      brief,
      design,
      requirementSet,
      moodBoard,
      packages,
      commercial,
      assets,
      execution,
      finance,
    });
    const lifecycleComplete = finance?.status === 'Closed';
    return {
      eventId,
      health: blockers.length === 0 ? 'OnTrack' : 'NeedsAttention',
      currentStage,
      nextAction: lifecycleComplete
        ? {
            label: 'Lifecycle complete',
            reason: 'Operational execution and event finance are closed.',
            actionType: 'LifecycleComplete',
          }
        : blockers.length
          ? this.blockerAction(blockers[0])
          : {
              label: 'Synchronize approved work',
              reason:
                'The approved upstream chain is ready for controlled synchronization.',
              actionType: 'SynchronizeLifecycle',
            },
      chain: {
        brief,
        design,
        requirementSet,
        moodBoard,
        procurementPackages: packages,
        commercialWorkspaces: commercial,
        assetReservations: assets,
        execution,
        finance,
      },
      blockers,
      executionReady: blockers.length === 0 && !lifecycleComplete,
      lifecycleComplete,
      sourceOwnership: {
        design: 'EventDesign',
        requirements: 'RequirementEngine',
        visualApproval: 'MoodBoard',
        supplierDecision: 'ProcurementAndCommercial',
        assets: 'AssetManagement',
        execution: 'EventExecution',
        operationalFinance: 'FinanceControl',
        statutoryAccounting: 'ExternalAccountingSystem',
      },
    };
  }

  private blockerAction(reason: string) {
    if (reason === 'Approved Mood Board missing') {
      return { label: 'Open Mood Board', reason, actionType: 'OpenMoodBoard' };
    }
    if (reason === 'Procurement Package without selected solution') {
      return {
        label: 'Open Procurement',
        reason,
        actionType: 'OpenProcurement',
      };
    }
    if (reason === 'Commercial Workspace not awarded') {
      return { label: 'Open Commercial', reason, actionType: 'OpenCommercial' };
    }
    return {
      label: 'Continue planning',
      reason,
      actionType: 'OpenPlanningWorkspace',
    };
  }

  private currentStage(input: {
    brief: { id: string } | null;
    design: { status: string } | null;
    requirementSet: { status: string } | null;
    moodBoard: { status: string } | null;
    packages: Array<{ solutions: Array<{ id: string }> }>;
    commercial: Array<{ status: string }>;
    assets: number;
    execution: { id: string } | null;
    finance: { id: string; status: string } | null;
  }) {
    if (input.finance?.status === 'Closed') return 'Closed';
    if (!input.brief) return 'Definition';
    if (
      input.design?.status !== 'Approved' ||
      input.requirementSet?.status !== 'Approved' ||
      input.moodBoard?.status !== 'Approved'
    )
      return 'Design';
    if (
      input.packages.some((row) => row.solutions.length === 0) ||
      input.commercial.some(
        (row) => row.status !== 'Awarded' && row.status !== 'Closed',
      )
    )
      return 'Procurement';
    if (input.assets === 0) return 'ResourcePlanning';
    if (!input.execution) return 'Readiness';
    if (!input.finance) return 'Execution';
    return 'FinancialControl';
  }

  async synchronize(userId: string, organizationId: string, eventId: string) {
    const continuity = await this.continuity(userId, organizationId, eventId);
    if (continuity.lifecycleComplete)
      throw new ConflictException('Event lifecycle is already closed');
    if (continuity.blockers.length > 0)
      throw new ConflictException({
        message: 'Approved upstream architecture is incomplete',
        blockers: continuity.blockers,
      });

    let execution = await this.prisma.eventExecution.findUnique({
      where: { eventId },
    });
    if (!execution) {
      await this.execution.createExecution({
        organizationId,
        eventId,
        actorId: userId,
        summary: 'Created by controlled lifecycle synchronization.',
      });
      await this.execution.buildExecutionPlan({
        organizationId,
        eventId,
        actorId: userId,
        planningContext: { source: 'ApprovedRequirementSet' },
      });
      execution = await this.prisma.eventExecution.findUniqueOrThrow({
        where: { eventId },
      });
    }

    let finance = await this.prisma.eventFinanceWorkspace.findUnique({
      where: { eventId },
    });
    if (!finance) {
      await this.finance.createWorkspace(userId, organizationId, eventId, {
        currency: 'ZAR',
      });
      finance = await this.prisma.eventFinanceWorkspace.findUniqueOrThrow({
        where: { eventId },
      });
    }

    const directWbs = await this.prisma.financeWbsNode.findFirst({
      where: { financeWorkspaceId: finance.id, code: 'DIRECT' },
    });
    const assetWbs = await this.prisma.financeWbsNode.findFirst({
      where: { financeWorkspaceId: finance.id, code: 'ASSETS' },
    });
    const awards = await this.prisma.commercialAward.findMany({
      where: { commercialWorkspace: { eventId } },
      include: { commercialQuoteLine: { include: { commercialQuote: true } } },
    });
    let commitmentsCreated = 0;
    for (const award of awards) {
      const exists = await this.prisma.eventFinanceCommitment.findFirst({
        where: { financeWorkspaceId: finance.id, commercialAwardId: award.id },
      });
      if (!exists) {
        await this.prisma.eventFinanceCommitment.create({
          data: {
            financeWorkspaceId: finance.id,
            requirementItemId: award.requirementItemId,
            supplierId: award.supplierId,
            commercialAwardId: award.id,
            description: award.commercialQuoteLine.offeredDescription,
            amountExcludingTax: award.lineTotal,
            totalAmount: award.lineTotal,
            currency: award.commercialQuoteLine.commercialQuote.currency,
            createdByUserId: userId,
          },
        });
        commitmentsCreated += 1;
      }
    }

    const incidents = await this.prisma.assetIncident.findMany({
      where: { eventId },
    });
    let assetChangesCreated = 0;
    for (const incident of incidents.filter(
      (row) => (row.estimatedLoss ?? 0) > 0,
    )) {
      const exists = await this.prisma.eventFinancialChange.findFirst({
        where: {
          financeWorkspaceId: finance.id,
          sourceModule: 'AssetManagement',
          sourceType: 'AssetIncident',
          sourceId: incident.id,
        },
      });
      if (!exists) {
        await this.prisma.eventFinancialChange.create({
          data: {
            financeWorkspaceId: finance.id,
            changeType: 'AssetIncidentExposure',
            sourceModule: 'AssetManagement',
            sourceType: 'AssetIncident',
            sourceId: incident.id,
            description: incident.description,
            costImpact: incident.estimatedLoss ?? 0,
            marginImpact: -(incident.estimatedLoss ?? 0),
            forecastImpact: -(incident.estimatedLoss ?? 0),
            status: FinanceVersionStatus.Draft,
            requestedByUserId: userId,
          },
        });
        assetChangesCreated += 1;
      }
    }

    if (directWbs && assetWbs) {
      const existingCloseout = await this.prisma.executionCloseoutItem.findMany(
        {
          where: { eventExecutionId: execution.id },
          select: { closeoutType: true },
        },
      );
      const types = new Set(existingCloseout.map((row) => row.closeoutType));
      if (!types.has('AssetRecovery'))
        await this.prisma.executionCloseoutItem.create({
          data: {
            eventExecutionId: execution.id,
            closeoutType: 'AssetRecovery',
            criteria:
              'All deployed assets are returned, inspected, reconciled and financially evidenced.',
          },
        });
      if (!types.has('FinancialEvidence'))
        await this.prisma.executionCloseoutItem.create({
          data: {
            eventExecutionId: execution.id,
            closeoutType: 'FinancialEvidence',
            criteria:
              'Execution variances and cost-generating activity are handed to Finance Control.',
          },
        });
    }

    return {
      eventId,
      executionId: execution.id,
      financeWorkspaceId: finance.id,
      commitmentsCreated,
      assetChangesCreated,
      automaticApprovalsPerformed: false,
    };
  }

  private async requireAccess(
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
      throw new NotFoundException('User has no access to this organization');
  }
}

import type { AssetGovernanceSummary } from './asset-management-types';
import type { CommercialWorkspace } from './commercial-types';
import type { EventExecutionWorkspace } from './event-execution-workspace-types';
import type { FinanceWorkspace } from './finance-control-types';
import type { ProcurementPackage } from './procurement-types';

export type WorkspaceGuidance = { stage: string; attention: number; nextAction: string; explanation: string };

export function procurementGuidance(packages: ProcurementPackage[]): WorkspaceGuidance {
  const draft = packages.filter((row) => row.status === 'Draft').length;
  const analysed = packages.filter((row) => row.status === 'Analysed').length;
  const selected = packages.filter((row) => row.status === 'SolutionSelected').length;
  if (!packages.length) return { stage: 'Requirements ready', attention: 0, nextAction: 'Create the first sourcing package', explanation: 'Group related approved requirements and record the buyer policy that Marketplace analysis must follow.' };
  if (draft) return { stage: 'Sourcing preparation', attention: draft, nextAction: 'Analyse draft sourcing packages', explanation: 'Generate transparent supplier solutions; this does not contact or reserve any supplier.' };
  if (analysed) return { stage: 'Solution review', attention: analysed, nextAction: 'Compare and select a sourcing strategy', explanation: 'Review cost, confidence, risk and supplier trade-offs before making the explicit selection.' };
  if (selected) return { stage: 'Commercial handoff', attention: selected, nextAction: 'Request quotation handoff', explanation: 'Create governed RFQ drafts in Commercial Workspace; nothing will be sent automatically.' };
  return { stage: 'Quotation requested', attention: 0, nextAction: 'Continue in Commercial Workspace', explanation: 'Procurement strategy is preserved while supplier communication and awards remain separately governed.' };
}

export function commercialGuidance(workspaces: CommercialWorkspace[], readyPackages: number): WorkspaceGuidance {
  const rfqs = workspaces.flatMap((row) => row.rfqs);
  const pendingSubstitutions = workspaces.flatMap((row) => row.quotes.flatMap((quote) => quote.lines)).filter((line) => line.substitutionImpact?.status === 'PendingReview').length;
  if (readyPackages) return { stage: 'RFQ preparation', attention: readyPackages, nextAction: 'Generate supplier-specific RFQ drafts', explanation: 'Each draft remains unsent until an operator approves and sends it separately.' };
  const drafts = rfqs.filter((row) => row.status === 'Draft').length;
  if (drafts) return { stage: 'RFQ review', attention: drafts, nextAction: 'Review and approve RFQ drafts', explanation: 'Check quantities, deadlines and event instructions before any supplier receives the request.' };
  const approved = rfqs.filter((row) => row.status === 'Approved').length;
  if (approved) return { stage: 'RFQ dispatch', attention: approved, nextAction: 'Send approved RFQs', explanation: 'Sending is explicit and creates the governed supplier conversation.' };
  if (pendingSubstitutions) return { stage: 'Substitution review', attention: pendingSubstitutions, nextAction: 'Resolve substitution impacts', explanation: 'Requirement, Mood Board and budget effects must be accepted or rejected before award.' };
  const quoteCount = workspaces.reduce((sum, row) => sum + row.quotes.length, 0);
  const awardCount = workspaces.reduce((sum, row) => sum + row.awards.length, 0);
  if (quoteCount && !awardCount) return { stage: 'Quote comparison', attention: quoteCount, nextAction: 'Compare offers and award lines', explanation: 'AI may explain trade-offs, but every commercial award remains a planner decision.' };
  return { stage: workspaces.length ? 'Commercial control' : 'Awaiting procurement', attention: 0, nextAction: workspaces.length ? 'Continue the governed supplier conversation' : 'Select a Procurement solution first', explanation: 'Purchase orders remain drafts until their own approval workflow is completed.' };
}

export function assetGuidance(summary: AssetGovernanceSummary | null, requirementCount: number): WorkspaceGuidance {
  if (!requirementCount) return { stage: 'Awaiting requirements', attention: 1, nextAction: 'Approve event requirements', explanation: 'Assets cannot be reserved or deployed without a linked authoritative requirement.' };
  if (summary?.unresolvedGovernanceExceptions) return { stage: 'Exception control', attention: summary.unresolvedGovernanceExceptions, nextAction: 'Resolve asset governance exceptions', explanation: 'Availability, condition, custody or lifecycle exceptions require operator attention before further deployment.' };
  const openIncidents = summary?.incidents.filter((row) => !['Resolved', 'Closed'].includes(row.status)).reduce((sum, row) => sum + row._count, 0) ?? 0;
  if (openIncidents) return { stage: 'Incident control', attention: openIncidents, nextAction: 'Resolve open asset incidents', explanation: 'Damaged, missing or failed assets remain governed separately from normal returns.' };
  return { stage: 'Allocation and lifecycle', attention: 0, nextAction: 'Reserve or progress requirement-linked assets', explanation: 'Follow reservation, preparation, deployment, inspection and return controls in sequence.' };
}

export function executionGuidance(workspace: EventExecutionWorkspace): WorkspaceGuidance {
  const incidents = workspace.incidents.filter((row) => !['Resolved', 'Closed'].includes(row.status)).length;
  if (incidents) return { stage: 'Incident response', attention: incidents, nextAction: 'Contain and resolve active incidents', explanation: 'Live operational exceptions take priority and remain recorded separately from routine tasks.' };
  const failedGates = workspace.gates.filter((row) => row.decision === 'Failed').length;
  const blockedTasks = workspace.tasks.filter((row) => row.status === 'Blocked').length;
  if (failedGates || blockedTasks) return { stage: 'Readiness blocked', attention: failedGates + blockedTasks, nextAction: 'Clear blockers before go-live', explanation: 'Go-live remains an explicit operator authority and cannot bypass failed readiness evidence.' };
  const pendingGates = workspace.gates.filter((row) => row.decision === 'Pending').length;
  if (pendingGates) return { stage: 'Readiness assessment', attention: pendingGates, nextAction: 'Assess pending readiness gates', explanation: 'Record evidence, failure or an authorised waiver for every gate.' };
  return { stage: workspace.status, attention: 0, nextAction: workspace.status === 'Planning' ? 'Build or refresh the execution plan' : 'Progress the controlled execution phase', explanation: 'Tasks, cues, command logs and closeout evidence remain in the operational source of truth.' };
}

export function financeGuidance(workspace: FinanceWorkspace): WorkspaceGuidance {
  if (!workspace.budgetVersions.some((row) => row.status === 'Approved')) return { stage: 'Budget baseline', attention: 1, nextAction: 'Create and approve the event budget baseline', explanation: 'Commitments, forecasts and margin decisions need an approved operational baseline.' };
  const pendingChanges = workspace.changes.filter((row) => ['Draft', 'Submitted'].includes(row.status)).length;
  if (pendingChanges) return { stage: 'Change control', attention: pendingChanges, nextAction: 'Review pending financial changes', explanation: 'Revenue, cost and margin effects remain separate until explicitly approved.' };
  const openReconciliations = workspace.reconciliations.filter((row) => row.status === 'Open').length;
  if (openReconciliations) return { stage: 'Reconciliation', attention: openReconciliations, nextAction: 'Resolve reconciliation differences', explanation: 'Explain and resolve variances against source records before financial close.' };
  const openClose = workspace.closeItems.filter((row) => row.status !== 'Completed').length;
  return { stage: workspace.status, attention: openClose, nextAction: openClose ? 'Complete financial close controls' : 'Maintain forecast and cash control', explanation: 'EventOS remains the operational financial authority while the external accounting platform remains statutory.' };
}

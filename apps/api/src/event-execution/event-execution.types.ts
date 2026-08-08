export const EVENT_EXECUTION_STATUSES = [
  'created',
  'planning',
  'resources-reserved',
  'procurement-prepared',
  'staff-assigned',
  'dispatch-scheduled',
  'in-progress',
  'collection-scheduled',
  'completed',
  'closed',
  'cancelled',
  'archived',
] as const;

export type EventExecutionStatus = (typeof EVENT_EXECUTION_STATUSES)[number];

export type EventExecutionRecord = {
  executionId: string;
  eventId: string;
  organizationId: string;
  status: EventExecutionStatus;
  executionPlanVersion?: number;
  summary?: string | null;
  milestones: Array<{
    key: string;
    label: string;
    status: 'pending' | 'ready' | 'blocked' | 'completed';
    dueAt?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type CreateEventExecutionInput = {
  organizationId: string;
  eventId: string;
  actorId?: string;
  summary?: string | null;
};

export type BuildEventExecutionPlanInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  planningContext?: Record<string, unknown>;
};

export type ReserveEventResourcesInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  resourceRequests?: Array<{
    resourceId?: string;
    category?: string;
    quantity?: number;
    from?: string;
    to?: string;
  }>;
};

export type ReleaseEventResourcesInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  reservationIds?: string[];
};

export type GenerateEventPurchaseOrdersInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  strategy?: 'missing-resources' | 'supplier-fulfillment' | 'manual-review';
};

export type GenerateSupplierBookingsInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  supplierIds?: string[];
};

export type AssignEventTasksInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  taskTemplates?: string[];
  assignedUserIds?: string[];
};

export type DispatchEventExecutionInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  dispatchAt?: string;
};

export type CollectEventExecutionInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  collectionAt?: string;
};

export type CompleteEventExecutionInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  completionNotes?: string;
};

export type CancelEventExecutionInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  reason?: string;
};

export type ArchiveEventExecutionInput = {
  organizationId: string;
  eventId: string;
  executionId?: string;
  actorId?: string;
  reason?: string;
};

export type EventExecutionAvailabilityEffect = {
  eventId: string;
  reservedResourceIds: string[];
  releasedResourceIds: string[];
  generatedPurchaseOrderIds: string[];
  generatedSupplierBookingIds: string[];
  assignedTaskIds: string[];
};

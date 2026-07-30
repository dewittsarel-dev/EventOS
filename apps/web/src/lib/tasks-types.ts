export type TaskStatus =
  | 'Todo'
  | 'InProgress'
  | 'Waiting'
  | 'Completed'
  | 'Cancelled';

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type TaskSortBy = 'dueDate' | 'createdAt' | 'updatedAt' | 'priority';
export type TaskSortOrder = 'asc' | 'desc';

export type TaskRecord = {
  id: string;
  organizationId: string;
  eventId: string;
  assignedContactId: string | null;
  quotationId: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListResponse = {
  data: TaskRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type TaskPayload = {
  organizationId: string;
  eventId: string;
  assignedContactId?: string;
  quotationId?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type TaskUpdatePayload = {
  eventId?: string;
  assignedContactId?: string | null;
  quotationId?: string | null;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type ContactOption = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
};

export type EventOption = {
  id: string;
  organizationId: string;
  title: string;
};

export type QuotationOption = {
  id: string;
  organizationId: string;
  quoteNumber: string;
  title: string;
};

export type ContactListResponse = {
  data: ContactOption[];
};

export type EventListResponse = {
  data: EventOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type QuotationListResponse = {
  data: QuotationOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export const TASK_STATUSES: TaskStatus[] = [
  'Todo',
  'InProgress',
  'Waiting',
  'Completed',
  'Cancelled',
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'Low',
  'Normal',
  'High',
  'Urgent',
];

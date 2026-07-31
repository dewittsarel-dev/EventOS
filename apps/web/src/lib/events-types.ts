export type EventStatus =
  | 'Draft'
  | 'Planned'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';

export type EventRecord = {
  id: string;
  organizationId: string;
  contactId: string;
  contactName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  budgetCents: number | null;
  notes: string | null;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  location: string | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
};

export type EventListResponse = {
  data: EventRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ContactRecord = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactListResponse = {
  data: ContactRecord[];
};

export type EventPayload = {
  organizationId: string;
  contactId: string;
  assignedUserId?: string;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  budgetCents?: number;
  notes?: string;
  status: EventStatus;
};

export type OrganizationUserRecord = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationUserListResponse = {
  data: OrganizationUserRecord[];
};

export const EVENT_STATUSES: EventStatus[] = [
  'Draft',
  'Planned',
  'Confirmed',
  'Completed',
  'Cancelled',
];

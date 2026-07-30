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
  title: string;
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
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  status: EventStatus;
};

export const EVENT_STATUSES: EventStatus[] = [
  'Draft',
  'Planned',
  'Confirmed',
  'Completed',
  'Cancelled',
];

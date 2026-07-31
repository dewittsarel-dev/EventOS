import { EventStatus } from './dto/event-status.enum';

export interface Event {
  id: string;
  organizationId: string;
  contactId: string;
  assignedUserId: string | null;
  title: string;
  eventType: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  venue: string | null;
  budgetCents: number | null;
  notes: string | null;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

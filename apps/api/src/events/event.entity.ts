import { EventStatus } from './dto/event-status.enum';

export interface Event {
  id: string;
  organizationId: string;
  contactId: string;
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

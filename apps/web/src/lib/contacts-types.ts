export type ContactRecord = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  companyName: string | null;
  contactType: string | null;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LinkedContactEvent = {
  id: string;
  title: string;
  eventDate: string;
  status: string;
};

export type LinkedContactQuotation = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  totalCents: number;
  eventId: string | null;
};

export type LinkedContactMeetingNote = {
  id: string;
  title: string;
  meetingDate: string;
  meetingType: string;
  eventId: string;
};

export type LinkedContactTask = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  eventId: string | null;
  quotationId: string | null;
};

export type ContactDetailsRecord = ContactRecord & {
  organizationName: string;
  events: LinkedContactEvent[];
  quotations: LinkedContactQuotation[];
  meetingNotes: LinkedContactMeetingNote[];
  tasks: LinkedContactTask[];
};

export type ContactListResponse = {
  data: ContactRecord[];
};

export type CreateContactPayload = {
  organizationId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  companyName?: string;
  contactType?: string;
  address?: string;
  notes?: string;
};

export type UpdateContactPayload = {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  companyName?: string | null;
  contactType?: string | null;
  address?: string | null;
  notes?: string | null;
};

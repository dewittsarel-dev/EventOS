export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export type QuotationItemPayload = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type QuotationItemRecord = {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QuotationRecord = {
  id: string;
  quoteNumber: string;
  organizationId: string;
  contactId: string;
  eventId: string;
  title: string;
  notes: string | null;
  status: QuotationStatus;
  issueDate: string;
  expiryDate: string | null;
  subtotalCents: number;
  discountCents: number;
  taxRatePercent: number;
  taxCents: number;
  totalCents: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuotationItemRecord[];
};

export type QuotationListResponse = {
  data: QuotationRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
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

export type CreateQuotationPayload = {
  organizationId: string;
  contactId: string;
  eventId: string;
  title: string;
  notes?: string;
  issueDate?: string;
  expiryDate?: string;
  discountCents?: number;
  taxRatePercent?: number;
  status?: QuotationStatus;
  items: QuotationItemPayload[];
};

export type UpdateQuotationPayload = Partial<CreateQuotationPayload>;

export const QUOTATION_STATUSES: QuotationStatus[] = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
];

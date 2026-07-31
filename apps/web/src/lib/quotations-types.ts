export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Cancelled';

export type QuotationItemPayload = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent?: number;
  discountCents?: number;
};

export type QuotationItemRecord = {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent: number;
  discountCents: number;
  lineTotalCents: number;
  unitPrice: number;
  discount: number;
  discountPercentage: number;
  total: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QuotationRecord = {
  id: string;
  quoteNumber: string;
  quotationNumber: string;
  organizationId: string;
  contactId: string;
  eventId: string | null;
  title: string;
  notes: string | null;
  status: QuotationStatus;
  issueDate: string;
  expiryDate: string | null;
  validUntil: string | null;
  subtotalCents: number;
  subtotal: number;
  discountCents: number;
  taxRatePercent: number;
  taxCents: number;
  vat: number;
  totalCents: number;
  total: number;
  grandTotalCents: number;
  grandTotal: number;
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
  eventId?: string;
  title: string;
  notes?: string;
  issueDate?: string;
  expiryDate?: string;
  validUntil?: string;
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
  'Cancelled',
];

import { QuotationStatus } from './dto/quotation-status.enum';

export interface QuotationLineItem {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent: number;
  discountCents: number;
  lineTotalCents: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  organizationId: string;
  contactId: string;
  eventId: string | null;
  title: string;
  notes: string | null;
  status: QuotationStatus;
  issueDate: Date;
  expiryDate: Date | null;
  subtotalCents: number;
  discountCents: number;
  taxRatePercent: number;
  taxCents: number;
  totalCents: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: QuotationLineItem[];
}

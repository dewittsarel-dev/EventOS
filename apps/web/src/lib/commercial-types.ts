import type { ProcurementPackage, ProcurementSolution } from './procurement-types';

export type CommercialRfqStatus = 'Draft' | 'Approved' | 'Sent' | 'Closed';
export type CommercialWorkspaceStatus = 'Draft' | 'Active' | 'Awarded' | 'Closed';

export type CommercialRfqLine = {
  id: string;
  requirementItemId: string;
  description: string;
  quantity: number;
  unit: string;
  notes: string | null;
};

export type CommercialRfq = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: CommercialRfqStatus;
  title: string;
  eventSummary: string;
  deliveryDate: string | null;
  collectionDate: string | null;
  venue: string | null;
  specialNotes: string | null;
  submissionDeadline: string;
  approvedAt: string | null;
  sentAt: string | null;
  lines: CommercialRfqLine[];
};

export type CommercialSubstitutionImpact = {
  id: string;
  affectsRequirement: boolean;
  affectsMoodBoard: boolean;
  affectsBudget: boolean;
  status: 'PendingReview' | 'Approved' | 'Rejected';
  reviewNotes: string | null;
};

export type CommercialQuoteLine = {
  id: string;
  requirementItemId: string;
  description: string;
  offeredDescription: string;
  quantityOffered: number;
  unitPrice: number;
  lineTotal: number;
  included: boolean;
  qualificationNotes: string | null;
  availabilityNotes: string | null;
  expectedDeliveryDate: string | null;
  isSubstitution: boolean;
  substitutionImpact: CommercialSubstitutionImpact | null;
  awards: Array<{ id: string; quantity: number }>;
};

export type CommercialQuote = {
  id: string;
  commercialRfqId: string;
  supplierId: string;
  supplierName: string;
  version: number;
  status: 'Submitted' | 'Superseded';
  currency: string;
  deliveryFee: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  paymentTerms: string | null;
  validUntil: string | null;
  submittedAt: string;
  lines: CommercialQuoteLine[];
};

export type CommercialMessage = {
  id: string;
  supplierId: string | null;
  authorRole: string;
  type: string;
  body: string;
  sentAt: string | null;
  createdAt: string;
};

export type CommercialPurchaseOrderDraft = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'Draft' | 'Approved' | 'Converted';
  currency: string;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentTerms: string | null;
  approvedAt: string | null;
  lines: Array<{
    id: string;
    requirementItemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type CommercialWorkspace = {
  id: string;
  status: CommercialWorkspaceStatus;
  procurementPackageId: string;
  procurementPackage: ProcurementPackage;
  procurementSolution: ProcurementSolution;
  rfqs: CommercialRfq[];
  messages: CommercialMessage[];
  quotes: CommercialQuote[];
  awards: Array<{ id: string; commercialQuoteLineId: string; quantity: number }>;
  purchaseOrderDrafts: CommercialPurchaseOrderDraft[];
  createdAt: string;
};

export type CommercialComparisonAlternative = {
  quoteId: string;
  quoteLineId: string;
  supplierId: string;
  supplierName: string;
  offeredDescription: string;
  quantityOffered: number;
  unitPrice: number;
  lineTotal: number;
  included: boolean;
  qualificationNotes: string | null;
  availabilityNotes: string | null;
  expectedDeliveryDate: string | null;
  substitutionImpact: CommercialSubstitutionImpact | null;
};

export type CommercialComparison = {
  workspaceId: string;
  rows: Array<{
    requirementItemId: string;
    alternatives: CommercialComparisonAlternative[];
    lowestCostQuoteLineId: string | null;
  }>;
  highlights: { missingItems: string[]; substitutionsPendingReview: string[] };
  recommendations: Array<{ strategy: string; explanation: string }>;
  decisionRequired: true;
};


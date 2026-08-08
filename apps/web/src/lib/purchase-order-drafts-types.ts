export type PurchaseOrderDraftFieldDecision =
  | 'Suggested'
  | 'Accepted'
  | 'Edited'
  | 'Ignored'
  | 'Manual';

export type PurchaseOrderDraftWarning = {
  code: string;
  message: string;
  fieldPath?: string;
};

export type PurchaseOrderDraftSourceDocument = {
  id: string;
  inputType: 'Pdf' | 'Image' | 'Text';
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  hasStoredBinary: boolean;
  hasStoredText: boolean;
};

export type PurchaseOrderDraftFieldRecord = {
  id: string;
  fieldPath: string;
  label: string;
  suggestedValue: unknown;
  finalValue: unknown;
  confidenceScore: number | null;
  sourceReference: string | null;
  decision: PurchaseOrderDraftFieldDecision;
  isRequired: boolean;
  lowConfidence: boolean;
};

export type PurchaseOrderDraftHeader = {
  purchaseOrderNumber: string | null;
  orderDate: string | null;
  quotationDate: string | null;
  validUntilDate: string | null;
  expectedDeliveryDate: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierReference: string | null;
  internalReference: string | null;
  deliveryLocationId: string | null;
  currency: string;
  deliveryFee: number;
  deliveryAddress: string | null;
  paymentTerms: string | null;
  eventReference: string | null;
  notes: string | null;
  extractedTotal: number | null;
};

export type PurchaseOrderDraftLineItem = {
  id: string;
  description: string;
  unit: string | null;
  supplierProductId: string | null;
  inventoryItemId: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatPercent: number;
  notes: string | null;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
  matched: boolean;
};

export type PurchaseOrderDraftPayload = {
  header: PurchaseOrderDraftHeader;
  lineItems: PurchaseOrderDraftLineItem[];
  summary: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    deliveryFee: number;
    totalAmount: number;
  };
  issues: {
    missingRequiredFields: string[];
    lowConfidenceFields: string[];
    conflictingFields: string[];
  };
};

export type PurchaseOrderDraftRecord = {
  id: string;
  capability: 'PurchaseOrder';
  status: 'ReviewPending' | 'ReviewSaved' | 'Committed' | 'Discarded';
  extractionAdapter: string;
  committedTargetId: string | null;
  createdAt: string;
  updatedAt: string;
  sourceDocuments: PurchaseOrderDraftSourceDocument[];
  payload: PurchaseOrderDraftPayload;
  fields: PurchaseOrderDraftFieldRecord[];
  warnings: PurchaseOrderDraftWarning[];
  missingRequiredFields: string[];
  lowConfidenceFields: string[];
  conflictingFields: string[];
  manualWorkflowPath: string;
};

export type PurchaseOrderDraftReviewPayload = {
  header: PurchaseOrderDraftHeader;
  lineItems: Array<{
    id: string;
    description: string;
    unit: string | null;
    supplierProductId: string | null;
    inventoryItemId: string | null;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    vatPercent: number;
    notes: string | null;
  }>;
  fields: Array<{
    fieldPath: string;
    decision: PurchaseOrderDraftFieldDecision;
    finalValue: unknown;
  }>;
};
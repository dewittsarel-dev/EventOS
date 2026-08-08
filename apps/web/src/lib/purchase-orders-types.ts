export type PurchaseOrderStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Sent'
  | 'PartiallyReceived'
  | 'FullyReceived'
  | 'Cancelled';

export type PurchaseOrderSortBy =
  | 'newest'
  | 'oldest'
  | 'number'
  | 'supplier'
  | 'expectedDelivery';

export type PurchaseOrderLineItemRecord = {
  id: string;
  purchaseOrderId: string;
  supplierProductId: string;
  supplierProductName: string;
  supplierProductSku: string | null;
  supplierProductBrand: string | null;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  inventoryItemSku: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  quantityOutstanding: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderRecord = {
  id: string;
  organizationId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  quotationDate?: string | null;
  validUntilDate?: string | null;
  expectedDeliveryDate: string | null;
  deliveryLocationId: string;
  deliveryLocationName: string;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee?: number;
  totalAmount: number;
  supplierReference: string | null;
  internalReference: string | null;
  paymentTerms?: string | null;
  deliveryAddress?: string | null;
  eventReference?: string | null;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  approvedByUserId: string | null;
  approvedByUserName: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  cancelledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  receivedPercent: number;
  lineItems: PurchaseOrderLineItemRecord[];
};

export type GoodsReceiptLineRecord = {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityDamaged: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoodsReceiptRecord = {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  receiptNumber: string;
  receivedDate: string;
  storageLocationId: string;
  storageLocationName: string;
  supplierDeliveryNote: string | null;
  receivedByUserId: string;
  receivedByUserName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lines: GoodsReceiptLineRecord[];
};

export type PagedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type SupplierPurchaseHistory = {
  supplierId: string;
  supplierName: string | null;
  totalOrderValue: number;
  openPurchaseOrders: number;
  outstandingDeliveries: number;
  purchaseOrders: PurchaseOrderRecord[];
  recentReceipts: GoodsReceiptRecord[];
};

export type CreatePurchaseOrderLineItemPayload = {
  supplierProductId: string;
  quantity: number;
  unitCost: number;
  vatPercent?: number;
  discountPercent?: number;
  notes?: string;
};

export type CreatePurchaseOrderPayload = {
  organizationId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  orderDate: string;
  quotationDate?: string;
  validUntilDate?: string;
  expectedDeliveryDate?: string;
  deliveryLocationId: string;
  currency?: string;
  supplierReference?: string;
  internalReference?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  eventReference?: string;
  deliveryFee?: number;
  notes?: string;
  lineItems: CreatePurchaseOrderLineItemPayload[];
};

export type UpdatePurchaseOrderPayload = Partial<CreatePurchaseOrderPayload>;

export type CreateGoodsReceiptLinePayload = {
  purchaseOrderLineItemId: string;
  inventoryItemId: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityDamaged: number;
  notes?: string;
};

export type CreateGoodsReceiptPayload = {
  organizationId: string;
  purchaseOrderId: string;
  receiptNumber?: string;
  receivedDate: string;
  storageLocationId: string;
  supplierDeliveryNote?: string;
  notes?: string;
  lines: CreateGoodsReceiptLinePayload[];
};

export const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  'Draft',
  'PendingApproval',
  'Approved',
  'Sent',
  'PartiallyReceived',
  'FullyReceived',
  'Cancelled',
];

export type CreatePurchaseOrderDraftPayload = {
  organizationId: string;
  sourceText?: string;
  sourceFile?: File;
};

export type CreateAIPurchaseOrderUploadDraftPayload = {
  organizationId: string;
  sourceFile: File;
};

export type CreateAIPurchaseOrderUploadDraftResponse = {
  draftId: string;
  documentId: string;
};

export type AIPurchaseOrderUploadDraftRecord = {
  id: string;
  status: 'ReviewPending' | 'ReviewSaved' | 'Committed' | 'Discarded';
  sourceDocument: {
    id: string;
    fileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
  } | null;
};

export type {
  PurchaseOrderDraftRecord,
  PurchaseOrderDraftReviewPayload,
} from './purchase-order-drafts-types';

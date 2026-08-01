import { PurchaseOrderStatus } from './purchase-order-status.enum';

export class PurchaseOrderLineItemResponseDto {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku: string;
  description: string;
  supplierSku: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  quantityOutstanding: number;
  unitPrice: number;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseOrderResponseDto {
  id: string;
  organizationId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: Date;
  expectedDeliveryDate: Date | null;
  deliveryLocationId: string;
  deliveryLocationName: string;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  supplierReference: string | null;
  internalReference: string | null;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  approvedByUserId: string | null;
  approvedByUserName: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  receivedPercent: number;
  lineItems: PurchaseOrderLineItemResponseDto[];
}

export class GoodsReceiptLineResponseDto {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityDamaged: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GoodsReceiptResponseDto {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  receiptNumber: string;
  receivedDate: Date;
  storageLocationId: string;
  storageLocationName: string;
  supplierDeliveryNote: string | null;
  receivedByUserId: string;
  receivedByUserName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: GoodsReceiptLineResponseDto[];
}

export class PurchaseOrderListResponseDto {
  data: PurchaseOrderResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export class GoodsReceiptListResponseDto {
  data: GoodsReceiptResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

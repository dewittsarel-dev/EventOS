import type {
  CreatePurchaseOrderLineItemPayload,
  PurchaseOrderRecord,
} from '../../purchase-orders-types';
import type { SupplierProductRecord } from '../../supplier-products-types';

export type PurchaseOrderLineForm = CreatePurchaseOrderLineItemPayload & {
  key: string;
  received?: number;
};

export function createPurchaseOrderLine(
  products: SupplierProductRecord[],
): PurchaseOrderLineForm {
  const first = products[0];

  return {
    key: crypto.randomUUID(),
    supplierProductId: first?.id ?? '',
    quantity: 1,
    unitCost: first?.costPrice ?? 0,
    vatPercent: first?.vatPercent ?? 0,
    discountPercent: 0,
    notes: '',
  };
}

export function applySupplierProductDefaults(
  line: PurchaseOrderLineForm,
  product: SupplierProductRecord | undefined,
): PurchaseOrderLineForm {
  if (!product) {
    return line;
  }

  return {
    ...line,
    supplierProductId: product.id,
    unitCost: product.costPrice,
    vatPercent: product.vatPercent ?? line.vatPercent,
  };
}

export function calculatePurchaseOrderLineTotals(line: PurchaseOrderLineForm) {
  const subtotal = line.quantity * line.unitCost;
  const discount = subtotal * ((line.discountPercent ?? 0) / 100);
  const taxable = subtotal - discount;
  const vat = taxable * ((line.vatPercent ?? 0) / 100);

  return {
    subtotal,
    discount,
    vat,
    total: taxable + vat,
  };
}

export function calculatePurchaseOrderTotals(lines: PurchaseOrderLineForm[]) {
  return lines.reduce(
    (acc, line) => {
      const computed = calculatePurchaseOrderLineTotals(line);
      return {
        subtotal: acc.subtotal + computed.subtotal,
        discount: acc.discount + computed.discount,
        vat: acc.vat + computed.vat,
        total: acc.total + computed.total,
      };
    },
    { subtotal: 0, discount: 0, vat: 0, total: 0 },
  );
}

export function mapPurchaseOrderToLineForms(
  purchaseOrder: PurchaseOrderRecord,
): PurchaseOrderLineForm[] {
  return purchaseOrder.lineItems.map((line) => ({
    key: line.id,
    supplierProductId: line.supplierProductId,
    quantity: line.quantityOrdered,
    unitCost: line.unitPrice,
    vatPercent: line.taxRate,
    discountPercent: line.discountRate,
    notes: line.notes ?? '',
    received: line.quantityReceived,
  }));
}

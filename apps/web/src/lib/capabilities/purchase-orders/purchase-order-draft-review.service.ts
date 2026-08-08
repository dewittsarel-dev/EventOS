import type {
  PurchaseOrderDraftFieldDecision,
  PurchaseOrderDraftFieldRecord,
  PurchaseOrderDraftHeader,
  PurchaseOrderDraftLineItem,
  PurchaseOrderDraftPayload,
  PurchaseOrderDraftReviewPayload,
} from '../../purchase-order-drafts-types';

export function calculatePurchaseOrderDraftLineTotals(
  line: Pick<PurchaseOrderDraftLineItem, 'quantity' | 'unitPrice' | 'discountPercent' | 'vatPercent'>,
) {
  const subtotal = round2(line.quantity * line.unitPrice);
  const discount = round2(subtotal * ((line.discountPercent ?? 0) / 100));
  const taxable = round2(subtotal - discount);
  const vat = round2(taxable * ((line.vatPercent ?? 0) / 100));

  return {
    subtotal,
    discount,
    vat,
    total: round2(taxable + vat),
  };
}

export function calculatePurchaseOrderDraftTotals(
  lineItems: PurchaseOrderDraftLineItem[],
  deliveryFee: number,
) {
  return lineItems.reduce(
    (acc, line) => ({
      subtotal: round2(acc.subtotal + line.lineSubtotal),
      discountAmount: round2(acc.discountAmount + line.lineDiscount),
      taxAmount: round2(acc.taxAmount + line.lineTax),
      deliveryFee,
      totalAmount: round2(acc.totalAmount + line.lineTotal),
    }),
    {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      deliveryFee,
      totalAmount: deliveryFee,
    },
  );
}

export function createManualPurchaseOrderDraftLine(): PurchaseOrderDraftLineItem {
  const totals = calculatePurchaseOrderDraftLineTotals({
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    vatPercent: 0,
  });

  return {
    id: crypto.randomUUID(),
    description: '',
    unit: null,
    supplierProductId: null,
    inventoryItemId: null,
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    vatPercent: 0,
    notes: null,
    lineSubtotal: totals.subtotal,
    lineDiscount: totals.discount,
    lineTax: totals.vat,
    lineTotal: totals.total,
    matched: false,
  };
}

export function updateDraftLine(
  line: PurchaseOrderDraftLineItem,
  patch: Partial<PurchaseOrderDraftLineItem>,
): PurchaseOrderDraftLineItem {
  const next = {
    ...line,
    ...patch,
  };
  const totals = calculatePurchaseOrderDraftLineTotals(next);
  return {
    ...next,
    lineSubtotal: totals.subtotal,
    lineDiscount: totals.discount,
    lineTax: totals.vat,
    lineTotal: totals.total,
    matched: Boolean(next.supplierProductId),
  };
}

export function applyDraftFieldDecision(
  fields: PurchaseOrderDraftFieldRecord[],
  fieldPath: string,
  decision: PurchaseOrderDraftFieldDecision,
  finalValue?: unknown,
) {
  return fields.map((field) => {
    if (field.fieldPath !== fieldPath) {
      return field;
    }

    return {
      ...field,
      decision,
      finalValue:
        finalValue === undefined
          ? decision === 'Accepted'
            ? field.suggestedValue
            : field.finalValue
          : finalValue,
    };
  });
}

export function buildPurchaseOrderDraftReviewPayload(
  header: PurchaseOrderDraftHeader,
  lineItems: PurchaseOrderDraftLineItem[],
  fields: PurchaseOrderDraftFieldRecord[],
): PurchaseOrderDraftReviewPayload {
  return {
    header,
    lineItems: lineItems.map((line) => ({
      id: line.id,
      description: line.description,
      unit: line.unit,
      supplierProductId: line.supplierProductId,
      inventoryItemId: line.inventoryItemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      vatPercent: line.vatPercent,
      notes: line.notes,
    })),
    fields: fields.map((field) => ({
      fieldPath: field.fieldPath,
      decision: field.decision,
      finalValue: field.finalValue,
    })),
  };
}

export function refreshDraftPayload(
  payload: PurchaseOrderDraftPayload,
  header: PurchaseOrderDraftHeader,
  lineItems: PurchaseOrderDraftLineItem[],
) {
  const summary = calculatePurchaseOrderDraftTotals(lineItems, header.deliveryFee ?? 0);
  return {
    ...payload,
    header,
    lineItems,
    summary,
  };
}

export function removeLineAndReindexDraftFields(
  fields: PurchaseOrderDraftFieldRecord[],
  removedIndex: number,
) {
  const linePathPattern = /^lineItems\[(\d+)]\.(.+)$/;

  return fields
    .flatMap((field) => {
      const match = field.fieldPath.match(linePathPattern);
      if (!match) {
        return [field];
      }

      const index = Number(match[1]);
      const suffix = match[2];

      if (index === removedIndex) {
        return [];
      }

      if (index < removedIndex) {
        return [field];
      }

      const nextIndex = index - 1;
      return [
        {
          ...field,
          fieldPath: `lineItems[${nextIndex}].${suffix}`,
          label: field.label.replace(/Line\s+\d+/, `Line ${nextIndex + 1}`),
        },
      ];
    })
    .sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
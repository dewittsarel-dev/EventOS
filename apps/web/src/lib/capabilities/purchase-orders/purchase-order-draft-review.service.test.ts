import { describe, expect, it } from 'vitest';
import {
  applyDraftFieldDecision,
  buildPurchaseOrderDraftReviewPayload,
  calculatePurchaseOrderDraftLineTotals,
  createManualPurchaseOrderDraftLine,
  removeLineAndReindexDraftFields,
  updateDraftLine,
} from './purchase-order-draft-review.service';

describe('purchase-order-draft-review.service', () => {
  it('calculates line totals including discount and VAT', () => {
    expect(
      calculatePurchaseOrderDraftLineTotals({
        quantity: 2,
        unitPrice: 100,
        discountPercent: 10,
        vatPercent: 15,
      }),
    ).toEqual({
      subtotal: 200,
      discount: 20,
      vat: 27,
      total: 207,
    });
  });

  it('updates a manual draft line and recalculates totals', () => {
    const updated = updateDraftLine(createManualPurchaseOrderDraftLine(), {
      description: 'Chair Hire',
      quantity: 5,
      unitPrice: 25,
      vatPercent: 15,
    });

    expect(updated.lineSubtotal).toBe(125);
    expect(updated.lineTax).toBe(18.75);
    expect(updated.lineTotal).toBe(143.75);
  });

  it('applies accepted field decisions using suggested values', () => {
    const fields = applyDraftFieldDecision(
      [
        {
          id: 'field-1',
          fieldPath: 'header.supplierReference',
          label: 'Supplier Reference',
          suggestedValue: 'Q-100',
          finalValue: null,
          confidenceScore: 0.8,
          sourceReference: 'text:line 2',
          decision: 'Suggested',
          isRequired: false,
          lowConfidence: false,
        },
      ],
      'header.supplierReference',
      'Accepted',
    );

    expect(fields[0]).toMatchObject({
      decision: 'Accepted',
      finalValue: 'Q-100',
    });
  });

  it('builds a review payload from draft state', () => {
    const line = updateDraftLine(createManualPurchaseOrderDraftLine(), {
      description: 'Chair Hire',
      supplierProductId: 'product-1',
      quantity: 4,
      unitPrice: 10,
    });

    const payload = buildPurchaseOrderDraftReviewPayload(
      {
        purchaseOrderNumber: 'PO-1',
        orderDate: '2026-08-03T00:00:00.000Z',
        quotationDate: null,
        validUntilDate: null,
        expectedDeliveryDate: null,
        supplierId: 'supplier-1',
        supplierName: 'Supplier One',
        supplierReference: null,
        internalReference: null,
        deliveryLocationId: 'location-1',
        currency: 'ZAR',
        deliveryFee: 0,
        deliveryAddress: null,
        paymentTerms: null,
        eventReference: null,
        notes: null,
        extractedTotal: null,
      },
      [line],
      [
        {
          id: 'field-1',
          fieldPath: 'header.purchaseOrderNumber',
          label: 'Purchase Order Number',
          suggestedValue: null,
          finalValue: 'PO-1',
          confidenceScore: null,
          sourceReference: null,
          decision: 'Manual',
          isRequired: true,
          lowConfidence: false,
        },
      ],
    );

    expect(payload.lineItems[0]).toMatchObject({
      description: 'Chair Hire',
      supplierProductId: 'product-1',
      quantity: 4,
      unitPrice: 10,
    });
  });

  it('removes line fields and reindexes remaining line field paths', () => {
    const fields = removeLineAndReindexDraftFields(
      [
        {
          id: 'h-1',
          fieldPath: 'header.purchaseOrderNumber',
          label: 'Purchase Order Number',
          suggestedValue: null,
          finalValue: 'PO-1',
          confidenceScore: null,
          sourceReference: null,
          decision: 'Manual',
          isRequired: true,
          lowConfidence: false,
        },
        {
          id: 'l1-1',
          fieldPath: 'lineItems[0].description',
          label: 'Line 1 Description',
          suggestedValue: 'A',
          finalValue: 'A',
          confidenceScore: 0.8,
          sourceReference: 'text:line 1',
          decision: 'Accepted',
          isRequired: true,
          lowConfidence: false,
        },
        {
          id: 'l2-1',
          fieldPath: 'lineItems[1].description',
          label: 'Line 2 Description',
          suggestedValue: 'B',
          finalValue: 'B',
          confidenceScore: 0.8,
          sourceReference: 'text:line 2',
          decision: 'Accepted',
          isRequired: true,
          lowConfidence: false,
        },
      ],
      0,
    );

    expect(fields).toHaveLength(2);
    expect(fields[0].fieldPath).toBe('header.purchaseOrderNumber');
    expect(fields[1].fieldPath).toBe('lineItems[0].description');
    expect(fields[1].label).toBe('Line 1 Description');
  });
});
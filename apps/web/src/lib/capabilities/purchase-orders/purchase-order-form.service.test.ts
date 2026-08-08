import { describe, expect, it, vi } from 'vitest';
import {
  applySupplierProductDefaults,
  calculatePurchaseOrderLineTotals,
  calculatePurchaseOrderTotals,
  createPurchaseOrderLine,
  mapPurchaseOrderToLineForms,
} from './purchase-order-form.service';

describe('purchase-order-form.service', () => {
  it('creates a draft line from the first supplier product defaults', () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'line-1',
    });

    const line = createPurchaseOrderLine([
      {
        id: 'product-1',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        productName: 'Beam Light',
        sku: 'LIGHT-1',
        category: 'Lighting',
        brand: 'Chauvet',
        description: null,
        unit: 'Each',
        costPrice: 125,
        sellingPrice: null,
        vatPercent: 15,
        leadTimeDays: null,
        minimumOrderQuantity: null,
        preferredProduct: false,
        active: true,
        notes: null,
        supplierName: 'Demo Supplier',
        organizationName: 'Demo Org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    expect(line).toMatchObject({
      key: 'line-1',
      supplierProductId: 'product-1',
      quantity: 1,
      unitCost: 125,
      vatPercent: 15,
      discountPercent: 0,
    });

    vi.unstubAllGlobals();
  });

  it('calculates line and aggregate totals consistently', () => {
    const line = {
      key: 'line-1',
      supplierProductId: 'product-1',
      quantity: 3,
      unitCost: 120,
      vatPercent: 15,
      discountPercent: 5,
      notes: '',
    };

    expect(calculatePurchaseOrderLineTotals(line)).toEqual({
      subtotal: 360,
      discount: 18,
      vat: 51.3,
      total: 393.3,
    });

    expect(calculatePurchaseOrderTotals([line])).toEqual({
      subtotal: 360,
      discount: 18,
      vat: 51.3,
      total: 393.3,
    });
  });

  it('maps a persisted purchase order into editable line forms', () => {
    const lines = mapPurchaseOrderToLineForms({
      id: 'po-1',
      organizationId: 'org-1',
      purchaseOrderNumber: 'PO-1',
      supplierId: 'supplier-1',
      supplierName: 'Demo Supplier',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: null,
      deliveryLocationId: 'loc-1',
      deliveryLocationName: 'Main',
      status: 'Draft',
      currency: 'ZAR',
      subtotal: 100,
      taxAmount: 15,
      discountAmount: 0,
      totalAmount: 115,
      supplierReference: null,
      internalReference: null,
      notes: null,
      createdByUserId: 'user-1',
      createdByUserName: 'User',
      approvedByUserId: null,
      approvedByUserName: null,
      approvedAt: null,
      sentAt: null,
      cancelledAt: null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      receivedPercent: 0,
      lineItems: [
        {
          id: 'line-1',
          purchaseOrderId: 'po-1',
          supplierProductId: 'product-1',
          supplierProductName: 'Beam Light',
          supplierProductSku: 'LIGHT-1',
          supplierProductBrand: 'Chauvet',
          inventoryItemId: null,
          inventoryItemName: null,
          inventoryItemSku: null,
          quantityOrdered: 2,
          quantityReceived: 1,
          quantityOutstanding: 1,
          unitPrice: 50,
          taxRate: 15,
          discountRate: 10,
          lineSubtotal: 100,
          lineDiscount: 10,
          lineTax: 13.5,
          lineTotal: 103.5,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(lines).toEqual([
      {
        key: 'line-1',
        supplierProductId: 'product-1',
        quantity: 2,
        unitCost: 50,
        vatPercent: 15,
        discountPercent: 10,
        notes: '',
        received: 1,
      },
    ]);
  });

  it('applies new product defaults without changing unrelated line state', () => {
    const updated = applySupplierProductDefaults(
      {
        key: 'line-1',
        supplierProductId: 'product-1',
        quantity: 2,
        unitCost: 99,
        vatPercent: 0,
        discountPercent: 7,
        notes: 'keep me',
      },
      {
        id: 'product-2',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        productName: 'Wash Light',
        sku: 'LIGHT-2',
        category: 'Lighting',
        brand: 'Martin',
        description: null,
        unit: 'Each',
        costPrice: 140,
        sellingPrice: null,
        vatPercent: 15,
        leadTimeDays: null,
        minimumOrderQuantity: null,
        preferredProduct: false,
        active: true,
        notes: null,
        supplierName: 'Demo Supplier',
        organizationName: 'Demo Org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );

    expect(updated).toMatchObject({
      supplierProductId: 'product-2',
      unitCost: 140,
      vatPercent: 15,
      quantity: 2,
      discountPercent: 7,
      notes: 'keep me',
    });
  });
});

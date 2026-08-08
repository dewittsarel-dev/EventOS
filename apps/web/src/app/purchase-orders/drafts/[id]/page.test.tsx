import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PurchaseOrderDraftReviewPage from './page';

const push = vi.fn();
const getPurchaseOrderDraft = vi.fn();
const updatePurchaseOrderDraftReview = vi.fn();
const commitPurchaseOrderDraft = vi.fn();
const getAIPurchaseOrderUploadDocumentBlob = vi.fn();
const listSuppliers = vi.fn();
const listStorageLocations = vi.fn();
const listSupplierProducts = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'draft-1' }),
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: () => 'doc-1',
  }),
}));

vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../../../lib/purchase-orders-api', () => ({
  getPurchaseOrderDraft: (...args: unknown[]) => getPurchaseOrderDraft(...args),
  updatePurchaseOrderDraftReview: (...args: unknown[]) => updatePurchaseOrderDraftReview(...args),
  commitPurchaseOrderDraft: (...args: unknown[]) => commitPurchaseOrderDraft(...args),
  getAIPurchaseOrderUploadDocumentBlob: (...args: unknown[]) =>
    getAIPurchaseOrderUploadDocumentBlob(...args),
}));

vi.mock('../../../../lib/suppliers-api', () => ({
  listSuppliers: (...args: unknown[]) => listSuppliers(...args),
}));

vi.mock('../../../../lib/inventory-api', () => ({
  listStorageLocations: (...args: unknown[]) => listStorageLocations(...args),
}));

vi.mock('../../../../lib/supplier-products-api', () => ({
  listSupplierProducts: (...args: unknown[]) => listSupplierProducts(...args),
}));

const baseDraft = {
  id: 'draft-1',
  capability: 'PurchaseOrder' as const,
  status: 'ReviewPending' as const,
  extractionAdapter: 'deterministic-rule-parser-v1',
  committedTargetId: null,
  createdAt: '2026-08-03T10:00:00.000Z',
  updatedAt: '2026-08-03T10:00:00.000Z',
  sourceDocuments: [
    {
      id: 'doc-1',
      inputType: 'Pdf' as const,
      fileName: 'supplier-quote.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 200,
      hasStoredBinary: true,
      hasStoredText: true,
    },
  ],
  payload: {
    header: {
      purchaseOrderNumber: 'PO-1001',
      orderDate: '2026-08-03T00:00:00.000Z',
      quotationDate: '2026-08-03T00:00:00.000Z',
      validUntilDate: null,
      expectedDeliveryDate: '2026-08-15T00:00:00.000Z',
      supplierId: 'supplier-1',
      supplierName: 'Cape Event Supply',
      supplierReference: 'Q-1001',
      internalReference: null,
      deliveryLocationId: 'location-1',
      currency: 'ZAR',
      deliveryFee: 0,
      deliveryAddress: 'Deliver to loading bay',
      paymentTerms: null,
      eventReference: null,
      notes: null,
      extractedTotal: 1380,
    },
    lineItems: [
      {
        id: 'line-1',
        description: 'Folding Chair',
        unit: 'each',
        supplierProductId: 'product-1',
        inventoryItemId: null,
        quantity: 20,
        unitPrice: 35,
        discountPercent: 0,
        vatPercent: 15,
        notes: null,
        lineSubtotal: 700,
        lineDiscount: 0,
        lineTax: 105,
        lineTotal: 805,
        matched: true,
      },
    ],
    summary: {
      subtotal: 700,
      taxAmount: 105,
      discountAmount: 0,
      deliveryFee: 0,
      totalAmount: 805,
    },
    issues: {
      missingRequiredFields: [],
      lowConfidenceFields: ['header.supplierReference'],
      conflictingFields: [],
    },
  },
  fields: [
    {
      id: 'field-1',
      fieldPath: 'header.purchaseOrderNumber',
      label: 'Purchase Order Number',
      suggestedValue: null,
      finalValue: 'PO-1001',
      confidenceScore: null,
      sourceReference: null,
      decision: 'Manual' as const,
      isRequired: true,
      lowConfidence: false,
    },
  ],
  warnings: [],
  missingRequiredFields: [],
  lowConfidenceFields: ['header.supplierReference'],
  conflictingFields: [],
  manualWorkflowPath: '/purchase-orders/new',
};

describe('PurchaseOrderDraftReviewPage', () => {
  beforeEach(() => {
    push.mockReset();
    getPurchaseOrderDraft.mockReset();
    updatePurchaseOrderDraftReview.mockReset();
    commitPurchaseOrderDraft.mockReset();
    getAIPurchaseOrderUploadDocumentBlob.mockReset();
    listSuppliers.mockReset();
    listStorageLocations.mockReset();
    listSupplierProducts.mockReset();

    getPurchaseOrderDraft.mockResolvedValue(baseDraft);
    updatePurchaseOrderDraftReview.mockResolvedValue(baseDraft);
    commitPurchaseOrderDraft.mockResolvedValue({ id: 'po-1' });
    getAIPurchaseOrderUploadDocumentBlob.mockResolvedValue(
      new Blob(['%PDF-mock%'], { type: 'application/pdf' }),
    );

    listSuppliers.mockResolvedValue({
      data: [{ id: 'supplier-1', companyName: 'Cape Event Supply' }],
    });

    listStorageLocations.mockResolvedValue({
      data: [{ id: 'location-1', name: 'Main Warehouse' }],
    });

    listSupplierProducts.mockResolvedValue({
      data: [{ id: 'product-1', productName: 'Folding Chair' }],
    });
  });

  it('allows editing extracted draft fields and saving review', async () => {
    render(<PurchaseOrderDraftReviewPage />);

    expect(await screen.findByDisplayValue('PO-1001')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Purchase Order Number'), {
      target: { value: 'PO-1002' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Review Draft' }));

    await waitFor(() => {
      expect(updatePurchaseOrderDraftReview).toHaveBeenCalledTimes(1);
    });

    expect(updatePurchaseOrderDraftReview).toHaveBeenCalledWith(
      expect.anything(),
      'draft-1',
      expect.objectContaining({
        header: expect.objectContaining({ purchaseOrderNumber: 'PO-1002' }),
      }),
    );
  });

  it('blocks final creation while required fields are missing', async () => {
    getPurchaseOrderDraft.mockResolvedValue({
      ...baseDraft,
      payload: {
        ...baseDraft.payload,
        header: {
          ...baseDraft.payload.header,
          purchaseOrderNumber: null,
          deliveryLocationId: null,
        },
        lineItems: [
          {
            ...baseDraft.payload.lineItems[0],
            supplierProductId: null,
          },
        ],
      },
      missingRequiredFields: ['header.purchaseOrderNumber', 'header.deliveryLocationId'],
    });

    render(<PurchaseOrderDraftReviewPage />);

    expect(
      await screen.findByText('Final creation is blocked until required fields are completed.'),
    ).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: 'Create Purchase Order' });
    expect(createButton).toBeDisabled();
    expect(commitPurchaseOrderDraft).not.toHaveBeenCalled();
  });
});

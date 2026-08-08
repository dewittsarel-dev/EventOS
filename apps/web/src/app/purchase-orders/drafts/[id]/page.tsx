'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  applyDraftFieldDecision,
  buildPurchaseOrderDraftReviewPayload,
  createManualPurchaseOrderDraftLine,
  removeLineAndReindexDraftFields,
  refreshDraftPayload,
  updateDraftLine,
} from '../../../../lib/capabilities/purchase-orders/purchase-order-draft-review.service';
import { listStorageLocations } from '../../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../../lib/inventory-types';
import type {
  PurchaseOrderDraftFieldRecord,
  PurchaseOrderDraftHeader,
  PurchaseOrderDraftLineItem,
  PurchaseOrderDraftRecord,
} from '../../../../lib/purchase-order-drafts-types';
import {
  commitPurchaseOrderDraft,
  getAIPurchaseOrderUploadDocumentBlob,
  getPurchaseOrderDraft,
  updatePurchaseOrderDraftReview,
} from '../../../../lib/purchase-orders-api';
import { listSupplierProducts } from '../../../../lib/supplier-products-api';
import type { SupplierProductRecord } from '../../../../lib/supplier-products-types';
import { listSuppliers } from '../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../lib/suppliers-types';

function formatConfidence(value: number | null) {
  if (value === null || value === undefined) {
    return 'Manual';
  }

  if (value >= 0.8) {
    return 'High';
  }

  if (value >= 0.6) {
    return 'Medium';
  }

  return 'Low';
}

export default function PurchaseOrderDraftReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDocumentId = searchParams.get('documentId');
  const { session } = useAppSession();

  const [draft, setDraft] = useState<PurchaseOrderDraftRecord | null>(null);
  const [header, setHeader] = useState<PurchaseOrderDraftHeader | null>(null);
  const [lineItems, setLineItems] = useState<PurchaseOrderDraftLineItem[]>([]);
  const [fields, setFields] = useState<PurchaseOrderDraftFieldRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<SupplierProductRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    async function load() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [draftResponse, suppliersResponse, locationsResponse] = await Promise.all([
          getPurchaseOrderDraft(requestOptions, id),
          listSuppliers(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 100,
            active: true,
          }),
          listStorageLocations(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 100,
            active: true,
          }),
        ]);

        if (!cancelled) {
          setDraft(draftResponse);
          setHeader(draftResponse.payload.header);
          setLineItems(draftResponse.payload.lineItems);
          setFields(draftResponse.fields);
          setSuppliers(suppliersResponse.data);
          setLocations(locationsResponse.data);
        }

        const fallbackDocumentId = draftResponse.sourceDocuments.find(
          (source) => source.hasStoredBinary,
        )?.id;
        const sourceDocumentId = queryDocumentId || fallbackDocumentId;

        if (sourceDocumentId) {
          const blob = await getAIPurchaseOrderUploadDocumentBlob(
            requestOptions,
            draftResponse.id,
            sourceDocumentId,
          );

          if (!cancelled) {
            objectUrl = URL.createObjectURL(blob);
            setPdfUrl(objectUrl);
          }
        } else if (!cancelled) {
          setPdfUrl('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load purchase order draft.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, queryDocumentId, requestOptions, session.organizationId, session.token]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!session.organizationId || !header?.supplierId) {
        setProducts([]);
        return;
      }

      try {
        const response = await listSupplierProducts(requestOptions, {
          organizationId: session.organizationId,
          supplierId: header.supplierId,
          page: 1,
          limit: 100,
          active: true,
          sortBy: 'productName',
        });

        if (!cancelled) {
          setProducts(response.data);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [header?.supplierId, requestOptions, session.organizationId]);

  function setFieldDecision(fieldPath: string, decision: PurchaseOrderDraftFieldRecord['decision']) {
    setFields((current) => applyDraftFieldDecision(current, fieldPath, decision));
  }

  function updateFieldValue(fieldPath: string, value: unknown) {
    setFields((current) => applyDraftFieldDecision(current, fieldPath, 'Edited', value));
  }

  function refreshDraft(headerValue: PurchaseOrderDraftHeader, lineValue: PurchaseOrderDraftLineItem[]) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        payload: refreshDraftPayload(current.payload, headerValue, lineValue),
      };
    });
  }

  function updateHeaderField<K extends keyof PurchaseOrderDraftHeader>(key: K, value: PurchaseOrderDraftHeader[K]) {
    setHeader((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, [key]: value };
      updateFieldValue(`header.${key}`, value);
      refreshDraft(next, lineItems);
      return next;
    });
  }

  function updateLineItem(lineId: string, patch: Partial<PurchaseOrderDraftLineItem>) {
    setLineItems((current) => {
      const next = current.map((line, index) => {
        if (line.id !== lineId) {
          return line;
        }

        const updated = updateDraftLine(line, patch);
        updateFieldValue(`lineItems[${index}].description`, updated.description);
        updateFieldValue(`lineItems[${index}].supplierProductId`, updated.supplierProductId);
        updateFieldValue(`lineItems[${index}].unit`, updated.unit);
        updateFieldValue(`lineItems[${index}].quantity`, updated.quantity);
        updateFieldValue(`lineItems[${index}].unitPrice`, updated.unitPrice);
        updateFieldValue(`lineItems[${index}].lineTotal`, updated.lineTotal);
        updateFieldValue(`lineItems[${index}].discountPercent`, updated.discountPercent);
        updateFieldValue(`lineItems[${index}].vatPercent`, updated.vatPercent);
        return updated;
      });

      if (header) {
        refreshDraft(header, next);
      }

      return next;
    });
  }

  function addManualLine() {
    const nextLine = createManualPurchaseOrderDraftLine();
    const nextIndex = lineItems.length;
    setLineItems((current) => {
      const next = [...current, nextLine];
      if (header) {
        refreshDraft(header, next);
      }
      return next;
    });
    setFields((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        fieldPath: `lineItems[${nextIndex}].description`,
        label: `Line ${nextIndex + 1} Description`,
        suggestedValue: null,
        finalValue: '',
        confidenceScore: null,
        sourceReference: null,
        decision: 'Manual',
        isRequired: true,
        lowConfidence: false,
      },
      {
        id: crypto.randomUUID(),
        fieldPath: `lineItems[${nextIndex}].supplierProductId`,
        label: `Line ${nextIndex + 1} Product Match`,
        suggestedValue: null,
        finalValue: null,
        confidenceScore: null,
        sourceReference: null,
        decision: 'Manual',
        isRequired: true,
        lowConfidence: false,
      },
      {
        id: crypto.randomUUID(),
        fieldPath: `lineItems[${nextIndex}].unit`,
        label: `Line ${nextIndex + 1} Unit`,
        suggestedValue: null,
        finalValue: null,
        confidenceScore: null,
        sourceReference: null,
        decision: 'Manual',
        isRequired: false,
        lowConfidence: false,
      },
      {
        id: crypto.randomUUID(),
        fieldPath: `lineItems[${nextIndex}].quantity`,
        label: `Line ${nextIndex + 1} Quantity`,
        suggestedValue: null,
        finalValue: 1,
        confidenceScore: null,
        sourceReference: null,
        decision: 'Manual',
        isRequired: true,
        lowConfidence: false,
      },
      {
        id: crypto.randomUUID(),
        fieldPath: `lineItems[${nextIndex}].unitPrice`,
        label: `Line ${nextIndex + 1} Unit Price`,
        suggestedValue: null,
        finalValue: 0,
        confidenceScore: null,
        sourceReference: null,
        decision: 'Manual',
        isRequired: true,
        lowConfidence: false,
      },
    ]);
  }

  const localMissingRequiredFields = useMemo(() => {
    if (!header) {
      return [] as string[];
    }

    const missing: string[] = [];

    if (!header.purchaseOrderNumber?.trim()) {
      missing.push('header.purchaseOrderNumber');
    }
    if (!header.orderDate?.trim()) {
      missing.push('header.orderDate');
    }
    if (!header.supplierId?.trim()) {
      missing.push('header.supplierId');
    }
    if (!header.deliveryLocationId?.trim()) {
      missing.push('header.deliveryLocationId');
    }
    if (lineItems.length === 0) {
      missing.push('lineItems');
    }

    lineItems.forEach((line, index) => {
      if (!line.description.trim()) {
        missing.push(`lineItems[${index}].description`);
      }
      if (!line.supplierProductId) {
        missing.push(`lineItems[${index}].supplierProductId`);
      }
      if (line.quantity <= 0) {
        missing.push(`lineItems[${index}].quantity`);
      }
    });

    return missing;
  }, [header, lineItems]);

  const lowConfidenceFieldCount = useMemo(
    () => fields.filter((field) => field.lowConfidence).length,
    [fields],
  );

  const extractedFieldCount = useMemo(
    () =>
      fields.filter(
        (field) => field.suggestedValue !== null && field.suggestedValue !== undefined,
      ).length,
    [fields],
  );

  function removeLine(lineId: string) {
    setLineItems((current) => {
      const removedIndex = current.findIndex((line) => line.id === lineId);
      const next = current.filter((line) => line.id !== lineId);
      if (header) {
        refreshDraft(header, next);
      }
      if (removedIndex >= 0) {
        setFields((currentFields) =>
          removeLineAndReindexDraftFields(currentFields, removedIndex),
        );
      }
      return next;
    });
  }

  async function onSaveReview() {
    if (!draft || !header) {
      return null;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updatePurchaseOrderDraftReview(
        requestOptions,
        draft.id,
        buildPurchaseOrderDraftReviewPayload(header, lineItems, fields),
      );

      setDraft(updated);
      setHeader(updated.payload.header);
      setLineItems(updated.payload.lineItems);
      setFields(updated.fields);
      setSuccess('Draft review saved.');
      return updated;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to save draft review.',
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onCommit() {
    if (!draft) {
      return;
    }

    setCommitting(true);
    setError('');
    setSuccess('');

    try {
      const saved = await onSaveReview();
      if (!saved) {
        return;
      }

      const purchaseOrder = await commitPurchaseOrderDraft(requestOptions, draft.id);
      router.push(`/purchase-orders/${purchaseOrder.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create live purchase order from draft.',
      );
    } finally {
      setCommitting(false);
    }
  }

  if (!draft || !header) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        {loading ? 'Loading purchase order draft...' : 'Draft not available.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Review Purchase Order Draft"
        description="Review every suggested field before creating a live purchase order."
        actions={
          <div className="flex gap-2">
            <Link
              href="/purchase-orders/drafts/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              New Draft Input
            </Link>
            <Link
              href="/purchase-orders/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Manual Purchase Order
            </Link>
          </div>
        }
      />

      {draft?.warnings.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Review warnings</p>
          <ul className="mt-2 list-disc pl-5">
            {draft.warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-800">Uploaded Quotation PDF</h2>
          <div className="mt-3 h-[62vh] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
            {pdfUrl ? (
              <iframe title="Uploaded quotation PDF" src={pdfUrl} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                PDF preview unavailable.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-zinc-800">Extraction Status</h2>
            <p className="mt-2 text-zinc-700">Extracted fields: {extractedFieldCount}</p>
            <p className="text-amber-700">Uncertain fields: {lowConfidenceFieldCount}</p>
            <p className="text-rose-700">Missing required: {localMissingRequiredFields.length}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
            <h2 className="font-semibold text-zinc-800">Source</h2>
            <div className="mt-3 grid gap-2">
              {draft.sourceDocuments.map((source) => (
                <div key={source.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p>Input Type: {source.inputType}</p>
                  <p>File: {source.fileName ?? 'Pasted text only'}</p>
                  <p>Stored Text: {source.hasStoredText ? 'Yes' : 'No'}</p>
                  <p>Stored Binary: {source.hasStoredBinary ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          </div>

          {localMissingRequiredFields.length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-medium">Missing required fields</p>
              <ul className="mt-2 list-disc pl-5">
                {localMissingRequiredFields.map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800">Header Review</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Purchase Order Number
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.purchaseOrderNumber ?? ''}
              onChange={(event) => updateHeaderField('purchaseOrderNumber', event.target.value)}
            />
          </label>
          <label className="text-sm text-zinc-700">
            Supplier
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.supplierId ?? ''}
              onChange={(event) => updateHeaderField('supplierId', event.target.value || null)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-700">
            Order Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.orderDate ? header.orderDate.slice(0, 10) : ''}
              onChange={(event) =>
                updateHeaderField(
                  'orderDate',
                  event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString() : null,
                )
              }
            />
          </label>
          <label className="text-sm text-zinc-700">
            Quotation Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.quotationDate ? header.quotationDate.slice(0, 10) : ''}
              onChange={(event) =>
                updateHeaderField(
                  'quotationDate',
                  event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString() : null,
                )
              }
            />
          </label>
          <label className="text-sm text-zinc-700">
            Expected Delivery Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.expectedDeliveryDate ? header.expectedDeliveryDate.slice(0, 10) : ''}
              onChange={(event) =>
                updateHeaderField(
                  'expectedDeliveryDate',
                  event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString() : null,
                )
              }
            />
          </label>
          <label className="text-sm text-zinc-700">
            Currency
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.currency}
              onChange={(event) => updateHeaderField('currency', event.target.value.toUpperCase())}
            />
          </label>
          <label className="text-sm text-zinc-700">
            Valid Until
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.validUntilDate ? header.validUntilDate.slice(0, 10) : ''}
              onChange={(event) =>
                updateHeaderField(
                  'validUntilDate',
                  event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString() : null,
                )
              }
            />
          </label>
          <label className="text-sm text-zinc-700">
            Delivery Location
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.deliveryLocationId ?? ''}
              onChange={(event) => updateHeaderField('deliveryLocationId', event.target.value || null)}
            >
              <option value="">Select delivery location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-700">
            Supplier Reference
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.supplierReference ?? ''}
              onChange={(event) => updateHeaderField('supplierReference', event.target.value || null)}
            />
          </label>
          <label className="text-sm text-zinc-700">
            Delivery Fee
            <input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.deliveryFee}
              onChange={(event) => updateHeaderField('deliveryFee', Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Payment Terms
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.paymentTerms ?? ''}
              onChange={(event) => updateHeaderField('paymentTerms', event.target.value || null)}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Delivery Address
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.deliveryAddress ?? ''}
              onChange={(event) => updateHeaderField('deliveryAddress', event.target.value || null)}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Event Reference
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.eventReference ?? ''}
              onChange={(event) => updateHeaderField('eventReference', event.target.value || null)}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={header.notes ?? ''}
              onChange={(event) => updateHeaderField('notes', event.target.value || null)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-800">Line Items Review</h2>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            onClick={addManualLine}
          >
            Add Manual Line
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          {lineItems.map((line, index) => {
            const productField = fields.find(
              (field) => field.fieldPath === `lineItems[${index}].supplierProductId`,
            );

            return (
              <div key={line.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm text-zinc-700 xl:col-span-2">
                    Description
                    <input
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.description}
                      onChange={(event) => updateLineItem(line.id, { description: event.target.value })}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    Product Match
                    <select
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.supplierProductId ?? ''}
                      onChange={(event) => updateLineItem(line.id, { supplierProductId: event.target.value || null })}
                    >
                      <option value="">Select supplier product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-700">
                    Unit
                    <input
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.unit ?? ''}
                      onChange={(event) => updateLineItem(line.id, { unit: event.target.value || null })}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    Quantity
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.quantity}
                      onChange={(event) => updateLineItem(line.id, { quantity: Number(event.target.value) })}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    Unit Price
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.unitPrice}
                      onChange={(event) => updateLineItem(line.id, { unitPrice: Number(event.target.value) })}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    Discount %
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.discountPercent}
                      onChange={(event) => updateLineItem(line.id, { discountPercent: Number(event.target.value) })}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    VAT %
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={line.vatPercent}
                      onChange={(event) => updateLineItem(line.id, { vatPercent: Number(event.target.value) })}
                    />
                  </label>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    <p>Line Total: {line.lineTotal.toFixed(2)}</p>
                    {productField ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Confidence: {formatConfidence(productField.confidenceScore)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100"
                    onClick={() => setFieldDecision(`lineItems[${index}].supplierProductId`, 'Accepted')}
                  >
                    Accept Match
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100"
                    onClick={() => setFieldDecision(`lineItems[${index}].supplierProductId`, 'Ignored')}
                  >
                    Ignore Match
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                    onClick={() => removeLine(line.id)}
                    disabled={lineItems.length <= 1}
                  >
                    Remove Line
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800">Extracted Field Decisions</h2>
        <div className="mt-4 grid gap-3">
          {fields.map((field) => (
            <div key={field.id} className="rounded-md border border-zinc-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-zinc-900">{field.label}</p>
                <div className="flex gap-2 text-xs text-zinc-500">
                  <span>Confidence: {formatConfidence(field.confidenceScore)}</span>
                  {field.lowConfidence ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Uncertain</span>
                  ) : null}
                  <span>{field.sourceReference ?? 'Manual review'}</span>
                </div>
              </div>
              <p className="mt-2 text-zinc-600">
                Suggested: {field.suggestedValue === null || field.suggestedValue === undefined ? 'None' : String(field.suggestedValue)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100"
                  onClick={() => setFieldDecision(field.fieldPath, 'Accepted')}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100"
                  onClick={() => setFieldDecision(field.fieldPath, 'Ignored')}
                >
                  Ignore
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100"
                  onClick={() => setFieldDecision(field.fieldPath, 'Manual')}
                >
                  Mark Manual
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
        <h2 className="font-semibold text-zinc-800">Draft Totals</h2>
        <p className="mt-2">Subtotal: {draft?.payload.summary.subtotal.toFixed(2)}</p>
        <p>VAT: {draft?.payload.summary.taxAmount.toFixed(2)}</p>
        <p>Discount: {draft?.payload.summary.discountAmount.toFixed(2)}</p>
        <p>Delivery Fee: {draft?.payload.summary.deliveryFee.toFixed(2)}</p>
        <p className="font-medium">Grand Total: {draft?.payload.summary.totalAmount.toFixed(2)}</p>
        {header.extractedTotal !== null ? (
          <p className="mt-2 text-xs text-zinc-600">
            Quoted Total: {header.extractedTotal.toFixed(2)}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSaveReview()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-60"
        >
          {saving ? 'Saving Review...' : 'Save Review Draft'}
        </button>
        <button
          type="button"
          disabled={committing || localMissingRequiredFields.length > 0}
          onClick={() => void onCommit()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {committing ? 'Creating Purchase Order...' : 'Create Purchase Order'}
        </button>
      </div>
      {localMissingRequiredFields.length > 0 ? (
        <p className="text-sm text-rose-700">
          Final creation is blocked until required fields are completed.
        </p>
      ) : null}
    </div>
  );
}
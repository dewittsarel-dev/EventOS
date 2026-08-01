'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { listStorageLocations } from '../../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../../lib/inventory-types';
import {
  createGoodsReceipt,
  getPurchaseOrder,
  getPurchaseOrderOutstanding,
} from '../../../../lib/purchase-orders-api';
import type {
  CreateGoodsReceiptLinePayload,
  PurchaseOrderRecord,
} from '../../../../lib/purchase-orders-types';

type ReceiveLineForm = CreateGoodsReceiptLinePayload & { key: string };

export default function ReceiveGoodsPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [storageLocationId, setStorageLocationId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierDeliveryNote, setSupplierDeliveryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ReceiveLineForm[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!session.organizationId || !session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [po, outstanding, locationsResponse] = await Promise.all([
          getPurchaseOrder(requestOptions, id),
          getPurchaseOrderOutstanding(requestOptions, id),
          listStorageLocations(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            active: true,
          }),
        ]);

        if (!cancelled) {
          setPurchaseOrder(po);
          setLocations(locationsResponse.data);
          setStorageLocationId(
            po.deliveryLocationId || locationsResponse.data[0]?.id || '',
          );
          setLines(
            outstanding.lines
              .filter((line) => line.quantityOutstanding > 0)
              .map((line) => ({
                key: line.purchaseOrderLineItemId,
                purchaseOrderLineItemId: line.purchaseOrderLineItemId,
                inventoryItemId: line.inventoryItemId,
                quantityReceived: line.quantityOutstanding,
                quantityAccepted: line.quantityOutstanding,
                quantityDamaged: 0,
                notes: '',
              })),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load receiving data.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id, requestOptions, session.organizationId, session.token]);

  function updateLine(key: string, updater: (line: ReceiveLineForm) => ReceiveLineForm) {
    setLines((current) => current.map((line) => (line.key === key ? updater(line) : line)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session.organizationId || !purchaseOrder) {
      return;
    }

    const confirmed = window.confirm('Post goods receipt now?');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await createGoodsReceipt(requestOptions, {
        organizationId: session.organizationId,
        purchaseOrderId: purchaseOrder.id,
        receivedDate: new Date(`${receivedDate}T00:00:00.000Z`).toISOString(),
        storageLocationId,
        supplierDeliveryNote,
        notes,
        lines: lines.filter((line) => line.quantityReceived > 0).map((line) => ({
          purchaseOrderLineItemId: line.purchaseOrderLineItemId,
          inventoryItemId: line.inventoryItemId,
          quantityReceived: line.quantityReceived,
          quantityAccepted: line.quantityAccepted,
          quantityDamaged: line.quantityDamaged,
          notes: line.notes,
        })),
      });

      setSuccess('Goods receipt posted and inventory updated.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to post goods receipt.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Receive Goods"
        actions={
          <Link
            href={`/purchase-orders/${id}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Purchase Order
          </Link>
        }
      />

      {locations.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You must first create at least one Storage Location before receiving goods.{' '}
          <Link href="/inventory/locations/new" className="underline">
            /inventory/locations/new
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading outstanding quantities...
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {purchaseOrder ? (
        <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5">
          <section className="grid gap-3 md:grid-cols-2">
            <h2 className="text-sm font-semibold text-zinc-800 md:col-span-2">1. Purchase Order</h2>
            <p className="text-sm text-zinc-700">{purchaseOrder.purchaseOrderNumber}</p>
            <p className="text-sm text-zinc-700">Status: {purchaseOrder.status}</p>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <h2 className="text-sm font-semibold text-zinc-800 md:col-span-3">2. Receipt Information</h2>
            <input
              type="date"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={receivedDate}
              onChange={(event) => setReceivedDate(event.target.value)}
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
              placeholder="Supplier delivery note"
              value={supplierDeliveryNote}
              onChange={(event) => setSupplierDeliveryNote(event.target.value)}
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <h2 className="text-sm font-semibold text-zinc-800 md:col-span-2">3. Delivery Location</h2>
            <select
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={storageLocationId}
              onChange={(event) => setStorageLocationId(event.target.value)}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </section>

          <section className="grid gap-3">
            <h2 className="text-sm font-semibold text-zinc-800">4. Items Received</h2>
            <h3 className="text-xs font-medium text-zinc-600">5. Damaged Quantities</h3>
            {lines.map((line) => {
              const item = purchaseOrder.lineItems.find(
                (poLine) => poLine.id === line.purchaseOrderLineItemId,
              );
              if (!item) {
                return null;
              }

              return (
                <div key={line.key} className="grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-6">
                  <div className="text-sm text-zinc-700 md:col-span-2">
                    <p className="font-medium">{item.inventoryItemName}</p>
                    <p>Ordered: {item.quantityOrdered}</p>
                    <p>Previously received: {item.quantityReceived}</p>
                    <p>Outstanding: {item.quantityOutstanding}</p>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={item.quantityOutstanding}
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.quantityReceived}
                    onChange={(event) => {
                      const nextReceived = Number(event.target.value);
                      updateLine(line.key, (current) => ({
                        ...current,
                        quantityReceived: nextReceived,
                        quantityAccepted: Math.max(0, Math.min(current.quantityAccepted, nextReceived)),
                        quantityDamaged: Math.max(0, Math.min(current.quantityDamaged, nextReceived)),
                      }));
                    }}
                  />
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={line.quantityReceived}
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.quantityAccepted}
                    onChange={(event) => {
                      const nextAccepted = Number(event.target.value);
                      updateLine(line.key, (current) => ({
                        ...current,
                        quantityAccepted: nextAccepted,
                        quantityDamaged: Math.max(0, current.quantityReceived - nextAccepted),
                      }));
                    }}
                  />
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={line.quantityReceived}
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.quantityDamaged}
                    onChange={(event) => {
                      const nextDamaged = Number(event.target.value);
                      updateLine(line.key, (current) => ({
                        ...current,
                        quantityDamaged: nextDamaged,
                        quantityAccepted: Math.max(0, current.quantityReceived - nextDamaged),
                      }));
                    }}
                  />
                  <input
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    placeholder="Line notes"
                    value={line.notes}
                    onChange={(event) =>
                      updateLine(line.key, (current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </div>
              );
            })}
          </section>

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold text-zinc-800">6. Notes and Confirmation</h2>
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>

          <button
            type="submit"
            disabled={saving || lines.length === 0 || locations.length === 0}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? 'Posting...' : 'Post Goods Receipt'}
          </button>
        </form>
      ) : null}
    </div>
  );
}

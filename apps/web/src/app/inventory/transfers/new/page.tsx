'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  createStockTransfer,
  listInventoryItems,
  listStorageLocations,
} from '../../../../lib/inventory-api';
import type {
  InventoryItemRecord,
  StorageLocationRecord,
} from '../../../../lib/inventory-types';

export default function NewStockTransferPage() {
  const { session } = useAppSession();

  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);

  const [inventoryItemId, setInventoryItemId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('Stock redistribution');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReferenceData() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [itemsResponse, locationsResponse] = await Promise.all([
          listInventoryItems(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            active: true,
          }),
          listStorageLocations(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            active: true,
          }),
        ]);

        if (!cancelled) {
          setItems(itemsResponse.data);
          setLocations(locationsResponse.data);
          setInventoryItemId(itemsResponse.data[0]?.id ?? '');
          setSourceLocationId(locationsResponse.data[0]?.id ?? '');
          setDestinationLocationId(locationsResponse.data[1]?.id ?? locationsResponse.data[0]?.id ?? '');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load transfer references.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!session.organizationId) {
      setError('Please select an organization.');
      return;
    }

    if (!inventoryItemId) {
      setError('Select an inventory item.');
      return;
    }

    if (!sourceLocationId || !destinationLocationId) {
      setError('Select both source and destination locations.');
      return;
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required for stock transfers.');
      return;
    }

    setSaving(true);

    try {
      await createStockTransfer(requestOptions, {
        organizationId: session.organizationId,
        inventoryItemId,
        sourceLocationId,
        destinationLocationId,
        quantity: numericQuantity,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccess('Stock transfer completed successfully.');
      setQuantity('');
      setReference('');
      setNotes('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create stock transfer.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stock Transfer"
        description="Move inventory quantities between active storage locations."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to transfer stock.
        </div>
      ) : null}

      {canLoad && !loading && items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Create inventory items before creating stock transfers.
        </div>
      ) : null}

      {canLoad && !loading && locations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Create a storage location before adding stock.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading transfer references...
        </div>
      ) : null}

      {canLoad && items.length > 0 && locations.length > 0 ? (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">1. Item</h2>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={inventoryItemId}
              onChange={(event) => setInventoryItemId(event.target.value)}
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </section>

          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">2. Source Location</h2>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={sourceLocationId}
              onChange={(event) => setSourceLocationId(event.target.value)}
              required
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </section>

          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">3. Destination Location</h2>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={destinationLocationId}
              onChange={(event) => setDestinationLocationId(event.target.value)}
              required
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </section>

          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">4. Quantity</h2>
            <input
              type="number"
              min={0.0001}
              step="0.001"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </section>

          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">5. Reference</h2>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Reference (optional)"
            />
          </section>

          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">6. Notes</h2>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason"
              required
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Additional notes (optional)"
            />
          </section>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/inventory/stock"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Transfer'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

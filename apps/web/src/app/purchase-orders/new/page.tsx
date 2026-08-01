'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { listInventoryItems, listStorageLocations } from '../../../lib/inventory-api';
import type { InventoryItemRecord, StorageLocationRecord } from '../../../lib/inventory-types';
import {
  createPurchaseOrder,
} from '../../../lib/purchase-orders-api';
import type { CreatePurchaseOrderLineItemPayload } from '../../../lib/purchase-orders-types';
import { listSuppliers } from '../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../lib/suppliers-types';

type LineForm = CreatePurchaseOrderLineItemPayload & { key: string };

function newLine(items: InventoryItemRecord[]): LineForm {
  const first = items[0];
  return {
    key: crypto.randomUUID(),
    inventoryItemId: first?.id ?? '',
    description: first?.name ?? '',
    supplierSku: '',
    quantityOrdered: 1,
    unitPrice: 0,
    taxRate: 0,
    notes: '',
  };
}

function lineTotals(line: LineForm) {
  const subtotal = line.quantityOrdered * line.unitPrice;
  const tax = subtotal * ((line.taxRate ?? 0) / 100);
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  };
}

export default function NewPurchaseOrderPage() {
  const { session } = useAppSession();

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);

  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryLocationId, setDeliveryLocationId] = useState('');
  const currency = 'ZAR';
  const [supplierReference, setSupplierReference] = useState('');
  const [internalReference, setInternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineForm[]>([]);

  const [loadingRefs, setLoadingRefs] = useState(false);
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

    async function loadReferences() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      setLoadingRefs(true);
      setError('');

      try {
        const [suppliersResponse, itemsResponse, locationsResponse] = await Promise.all([
          listSuppliers(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            active: true,
          }),
          listInventoryItems(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 300,
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
          setSuppliers(suppliersResponse.data);
          setItems(itemsResponse.data);
          setLocations(locationsResponse.data);

          setSupplierId((current) => current || suppliersResponse.data[0]?.id || '');
          setDeliveryLocationId(
            (current) => current || locationsResponse.data[0]?.id || '',
          );
          setLines([newLine(itemsResponse.data)]);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load purchase-order references.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRefs(false);
        }
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  function updateLine(key: string, updater: (line: LineForm) => LineForm) {
    setLines((current) => current.map((line) => (line.key === key ? updater(line) : line)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.organizationId) {
      setError('Select an organization first.');
      return;
    }

    setSaving(true);

    try {
      await createPurchaseOrder(requestOptions, {
        organizationId: session.organizationId,
        purchaseOrderNumber,
        supplierId,
        orderDate: new Date(`${orderDate}T00:00:00.000Z`).toISOString(),
        expectedDeliveryDate: expectedDeliveryDate
          ? new Date(`${expectedDeliveryDate}T00:00:00.000Z`).toISOString()
          : undefined,
        deliveryLocationId,
        currency,
        supplierReference,
        internalReference,
        notes,
        lineItems: lines.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          description: line.description,
          supplierSku: line.supplierSku,
          quantityOrdered: line.quantityOrdered,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          notes: line.notes,
        })),
      });

      setSuccess('Purchase order created.');
      setPurchaseOrderNumber('');
      setSupplierReference('');
      setInternalReference('');
      setNotes('');
      setLines([newLine(items)]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create purchase order.',
      );
    } finally {
      setSaving(false);
    }
  }

  const totals = lines.reduce(
    (acc, line) => {
      const computed = lineTotals(line);
      return {
        subtotal: acc.subtotal + computed.subtotal,
        tax: acc.tax + computed.tax,
        total: acc.total + computed.total,
      };
    },
    { subtotal: 0, tax: 0, total: 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Purchase Order"
        actions={
          <Link
            href="/purchase-orders"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Purchase Orders
          </Link>
        }
      />

      {loadingRefs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading suppliers, items and locations...
        </div>
      ) : null}

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You must first create at least one Supplier before creating a Purchase Order.{' '}
          <Link href="/suppliers/new" className="underline">
            /suppliers/new
          </Link>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You must first create at least one Inventory Item before creating a Purchase Order.{' '}
          <Link href="/inventory/items/new" className="underline">
            /inventory/items/new
          </Link>
        </div>
      ) : null}

      {locations.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You must first create at least one Storage Location before receiving goods.{' '}
          <Link href="/inventory/locations/new" className="underline">
            /inventory/locations/new
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <section className="grid gap-3 md:grid-cols-2">
          <h2 className="text-sm font-semibold text-zinc-800 md:col-span-2">1. Supplier and Delivery</h2>
          <select
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.companyName}
              </option>
            ))}
          </select>

          <select
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={deliveryLocationId}
            onChange={(event) => setDeliveryLocationId(event.target.value)}
          >
            <option value="">Select delivery location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <h2 className="text-sm font-semibold text-zinc-800 md:col-span-3">2. Order Information</h2>
          <input
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="PO Number"
            value={purchaseOrderNumber}
            onChange={(event) => setPurchaseOrderNumber(event.target.value)}
          />
          <input
            type="date"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={orderDate}
            onChange={(event) => setOrderDate(event.target.value)}
          />
          <input
            type="date"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={expectedDeliveryDate}
            onChange={(event) => setExpectedDeliveryDate(event.target.value)}
          />
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-800">3. Line Items</h2>
          {lines.map((line) => {
            const computed = lineTotals(line);
            return (
              <div key={line.key} className="grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-7">
                <select
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm md:col-span-2"
                  value={line.inventoryItemId}
                  onChange={(event) => {
                    const nextItem = items.find((item) => item.id === event.target.value);
                    updateLine(line.key, (current) => ({
                      ...current,
                      inventoryItemId: event.target.value,
                      description: nextItem?.name ?? current.description,
                    }));
                  }}
                >
                  <option value="">Select inventory item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
                <input
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.quantityOrdered}
                  type="number"
                  step="0.001"
                  min="0.001"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      quantityOrdered: Number(event.target.value),
                    }))
                  }
                />
                <input
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.unitPrice}
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      unitPrice: Number(event.target.value),
                    }))
                  }
                />
                <input
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.taxRate ?? 0}
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      taxRate: Number(event.target.value),
                    }))
                  }
                />
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-600">
                  Line Total: {computed.total.toFixed(2)}
                </div>
                <button
                  type="button"
                  className="rounded-md border border-rose-300 px-2 py-2 text-xs text-rose-700 hover:bg-rose-50"
                  onClick={() =>
                    setLines((current) => current.filter((entry) => entry.key !== line.key))
                  }
                  disabled={lines.length <= 1}
                >
                  Remove
                </button>
              </div>
            );
          })}

          <button
            type="button"
            className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            onClick={() => setLines((current) => [...current, newLine(items)])}
          >
            Add Line
          </button>
        </section>

        <section className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <h2 className="font-semibold text-zinc-800">4. Totals</h2>
          <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
          <p>Tax: {totals.tax.toFixed(2)}</p>
          <p className="font-medium">Total: {totals.total.toFixed(2)}</p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <h2 className="text-sm font-semibold text-zinc-800 md:col-span-2">5. References</h2>
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Supplier reference"
            value={supplierReference}
            onChange={(event) => setSupplierReference(event.target.value)}
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Internal reference"
            value={internalReference}
            onChange={(event) => setInternalReference(event.target.value)}
          />
        </section>

        <section className="grid gap-2">
          <h2 className="text-sm font-semibold text-zinc-800">6. Notes</h2>
          <textarea
            className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={saving || suppliers.length === 0 || items.length === 0 || locations.length === 0}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Purchase Order'}
        </button>
      </form>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  applySupplierProductDefaults,
  calculatePurchaseOrderTotals,
  createPurchaseOrderLine,
  type PurchaseOrderLineForm,
} from '../../../lib/capabilities/purchase-orders/purchase-order-form.service';
import { listStorageLocations } from '../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../lib/inventory-types';
import { createPurchaseOrder } from '../../../lib/purchase-orders-api';
import { listSupplierProducts } from '../../../lib/supplier-products-api';
import type { SupplierProductRecord } from '../../../lib/supplier-products-types';
import { listSuppliers } from '../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../lib/suppliers-types';

export default function NewPurchaseOrderPage() {
  const { session } = useAppSession();

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<SupplierProductRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);

  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryLocationId, setDeliveryLocationId] = useState('');
  const currency = 'ZAR';
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>([]);

  const [loadingRefs, setLoadingRefs] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
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
        const [suppliersResponse, locationsResponse] = await Promise.all([
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
          setSuppliers(suppliersResponse.data);
          setLocations(locationsResponse.data);
          setSupplierId((current) => current || suppliersResponse.data[0]?.id || '');
          setDeliveryLocationId(
            (current) => current || locationsResponse.data[0]?.id || '',
          );
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

  useEffect(() => {
    let cancelled = false;

    async function loadProductsForSupplier() {
      if (!canLoad || !session.organizationId || !supplierId) {
        setProducts([]);
        setLines([]);
        return;
      }

      setLoadingProducts(true);
      setError('');

      try {
        const response = await listSupplierProducts(requestOptions, {
          organizationId: session.organizationId,
          supplierId,
          page: 1,
          limit: 100,
          active: true,
          sortBy: 'productName',
        });

        if (!cancelled) {
          setProducts(response.data);
          setLines(
            response.data.length > 0 ? [createPurchaseOrderLine(response.data)] : [],
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setProducts([]);
          setLines([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load supplier products.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProductsForSupplier();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId, supplierId]);

  function updateLine(
    key: string,
    updater: (line: PurchaseOrderLineForm) => PurchaseOrderLineForm,
  ) {
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

    if (lines.length === 0) {
      setError('Add at least one supplier product line item.');
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
        notes,
        lineItems: lines.map((line) => ({
          supplierProductId: line.supplierProductId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          vatPercent: line.vatPercent,
          discountPercent: line.discountPercent,
          notes: line.notes,
        })),
      });

      setSuccess('Purchase order created.');
      setPurchaseOrderNumber('');
      setNotes('');
      setLines(products.length > 0 ? [createPurchaseOrderLine(products)] : []);
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

  const totals = calculatePurchaseOrderTotals(lines);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Purchase Order"
        actions={
          <div className="flex gap-2">
            <Link
              href="/purchase-orders/drafts/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Create from Quotation Draft
            </Link>
            <Link
              href="/purchase-orders"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Purchase Orders
            </Link>
          </div>
        }
      />

      {loadingRefs || loadingProducts ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading suppliers, products and locations...
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

      {supplierId && products.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The selected supplier has no active products. Add products first from supplier details.
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
          <h2 className="text-sm font-semibold text-zinc-800 md:col-span-2">1. Purchase Order Header</h2>
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

          <input
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Purchase Order Number"
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

          <select
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
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

          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
            placeholder="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-800">2. Purchase Order Items</h2>
          {lines.map((line) => {
            const computed = calculatePurchaseOrderTotals([line]);
            return (
              <div key={line.key} className="grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-8">
                <select
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm md:col-span-2"
                  value={line.supplierProductId}
                  onChange={(event) => {
                    const nextProduct = products.find((product) => product.id === event.target.value);
                    updateLine(line.key, (current) =>
                      applySupplierProductDefaults(
                        {
                          ...current,
                          supplierProductId: event.target.value,
                        },
                        nextProduct,
                      ),
                    );
                  }}
                >
                  <option value="">Select supplier product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.productName} {product.brand ? `(${product.brand})` : ''}
                    </option>
                  ))}
                </select>
                <input
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.quantity}
                  type="number"
                  step="0.001"
                  min="0.001"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      quantity: Number(event.target.value),
                    }))
                  }
                />
                <input
                  required
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.unitCost}
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      unitCost: Number(event.target.value),
                    }))
                  }
                />
                <input
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.vatPercent ?? 0}
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      vatPercent: Number(event.target.value),
                    }))
                  }
                />
                <input
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.discountPercent ?? 0}
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(event) =>
                    updateLine(line.key, (current) => ({
                      ...current,
                      discountPercent: Number(event.target.value),
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
            onClick={() =>
              setLines((current) => [...current, createPurchaseOrderLine(products)])
            }
            disabled={products.length === 0}
          >
            Add Line
          </button>
        </section>

        <section className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <h2 className="font-semibold text-zinc-800">3. Totals</h2>
          <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
          <p>VAT: {totals.vat.toFixed(2)}</p>
          <p>Discount: {totals.discount.toFixed(2)}</p>
          <p className="font-medium">Grand Total: {totals.total.toFixed(2)}</p>
        </section>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={saving || lines.length === 0 || !supplierId}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Purchase Order'}
        </button>
      </form>
    </div>
  );
}

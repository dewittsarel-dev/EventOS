'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  applySupplierProductDefaults,
  calculatePurchaseOrderTotals,
  createPurchaseOrderLine,
  mapPurchaseOrderToLineForms,
  type PurchaseOrderLineForm,
} from '../../../../lib/capabilities/purchase-orders/purchase-order-form.service';
import { listStorageLocations } from '../../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../../lib/inventory-types';
import { getPurchaseOrder, updatePurchaseOrder } from '../../../../lib/purchase-orders-api';
import type { PurchaseOrderRecord } from '../../../../lib/purchase-orders-types';
import { listSupplierProducts } from '../../../../lib/supplier-products-api';
import type { SupplierProductRecord } from '../../../../lib/supplier-products-types';
import { listSuppliers } from '../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../lib/suppliers-types';

export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<SupplierProductRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [po, suppliersResponse, locationsResponse] = await Promise.all([
          getPurchaseOrder(requestOptions, id),
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
          setPurchaseOrder(po);
          setSuppliers(suppliersResponse.data);
          setLocations(locationsResponse.data);
          setLines(mapPurchaseOrderToLineForms(po));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load draft purchase order.',
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
    };
  }, [id, requestOptions, session.organizationId, session.token]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplierProducts() {
      if (!session.organizationId || !purchaseOrder?.supplierId) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const response = await listSupplierProducts(requestOptions, {
          organizationId: session.organizationId,
          supplierId: purchaseOrder.supplierId,
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
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void loadSupplierProducts();

    return () => {
      cancelled = true;
    };
  }, [purchaseOrder?.supplierId, requestOptions, session.organizationId]);

  function updateLine(
    key: string,
    updater: (line: PurchaseOrderLineForm) => PurchaseOrderLineForm,
  ) {
    setLines((current) => current.map((line) => (line.key === key ? updater(line) : line)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!purchaseOrder || !session.organizationId) {
      return;
    }

    if (purchaseOrder.status !== 'Draft') {
      setError('Only draft purchase orders may be edited.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updatePurchaseOrder(requestOptions, purchaseOrder.id, {
        organizationId: session.organizationId,
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierId: purchaseOrder.supplierId,
        orderDate: purchaseOrder.orderDate,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ?? undefined,
        deliveryLocationId: purchaseOrder.deliveryLocationId,
        currency: purchaseOrder.currency,
        notes: purchaseOrder.notes ?? undefined,
        lineItems: lines.map((line) => ({
          supplierProductId: line.supplierProductId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          vatPercent: line.vatPercent,
          discountPercent: line.discountPercent,
          notes: line.notes,
        })),
      });

      setPurchaseOrder(updated);
      setLines(mapPurchaseOrderToLineForms(updated));
      setSuccess('Draft purchase order updated.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update purchase order.',
      );
    } finally {
      setSaving(false);
    }
  }

  const totals = calculatePurchaseOrderTotals(lines);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Draft Purchase Order" />

      {loading || loadingProducts ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading draft purchase order...
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {purchaseOrder ? (
        <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5">
          <section className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={purchaseOrder.purchaseOrderNumber}
              onChange={(event) =>
                setPurchaseOrder({ ...purchaseOrder, purchaseOrderNumber: event.target.value })
              }
            />
            <select
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={purchaseOrder.supplierId}
              onChange={(event) =>
                setPurchaseOrder({ ...purchaseOrder, supplierId: event.target.value })
              }
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={purchaseOrder.deliveryLocationId}
              onChange={(event) =>
                setPurchaseOrder({ ...purchaseOrder, deliveryLocationId: event.target.value })
              }
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </section>

          <section className="grid gap-2">
            {lines.map((line) => {
              const computed = calculatePurchaseOrderTotals([line]);
              return (
                <div key={line.key} className="grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-8">
                  <select
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
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productName} {product.brand ? `(${product.brand})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, (current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.unitCost}
                    onChange={(event) =>
                      updateLine(line.key, (current) => ({
                        ...current,
                        unitCost: Number(event.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.vatPercent ?? 0}
                    onChange={(event) =>
                      updateLine(line.key, (current) => ({
                        ...current,
                        vatPercent: Number(event.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={line.discountPercent ?? 0}
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
                    disabled={lines.length <= 1 || (line.received ?? 0) > 0}
                    title={(line.received ?? 0) > 0 ? 'Cannot remove line with received quantity' : 'Remove line'}
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
            <h2 className="font-semibold text-zinc-800">Totals</h2>
            <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
            <p>VAT: {totals.vat.toFixed(2)}</p>
            <p>Discount: {totals.discount.toFixed(2)}</p>
            <p className="font-medium">Grand Total: {totals.total.toFixed(2)}</p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </form>
      ) : null}
    </div>
  );
}

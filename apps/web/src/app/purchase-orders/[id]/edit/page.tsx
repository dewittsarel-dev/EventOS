'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { listInventoryItems, listStorageLocations } from '../../../../lib/inventory-api';
import type { InventoryItemRecord, StorageLocationRecord } from '../../../../lib/inventory-types';
import { getPurchaseOrder, updatePurchaseOrder } from '../../../../lib/purchase-orders-api';
import type { PurchaseOrderRecord } from '../../../../lib/purchase-orders-types';
import { listSuppliers } from '../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../lib/suppliers-types';

export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
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

    async function load() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [po, suppliersResponse, itemsResponse, locationsResponse] = await Promise.all([
          getPurchaseOrder(requestOptions, id),
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
          setPurchaseOrder(po);
          setSuppliers(suppliersResponse.data);
          setItems(itemsResponse.data);
          setLocations(locationsResponse.data);
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
        supplierReference: purchaseOrder.supplierReference ?? undefined,
        internalReference: purchaseOrder.internalReference ?? undefined,
        notes: purchaseOrder.notes ?? undefined,
        lineItems: purchaseOrder.lineItems.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          description: line.description,
          supplierSku: line.supplierSku ?? undefined,
          quantityOrdered: line.quantityOrdered,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          notes: line.notes ?? undefined,
        })),
      });

      setPurchaseOrder(updated);
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

  function updateLine(
    lineId: string,
    updater: (line: PurchaseOrderRecord['lineItems'][number]) => PurchaseOrderRecord['lineItems'][number],
  ) {
    setPurchaseOrder((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        lineItems: current.lineItems.map((line) =>
          line.id === lineId ? updater(line) : line,
        ),
      };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Draft Purchase Order" />

      {loading ? (
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
            {purchaseOrder.lineItems.map((line) => (
              <div key={line.id} className="grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-5">
                <select
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm md:col-span-2"
                  value={line.inventoryItemId}
                  onChange={(event) => {
                    const nextItem = items.find((item) => item.id === event.target.value);
                    updateLine(line.id, (current) => ({
                      ...current,
                      inventoryItemId: event.target.value,
                      inventoryItemName: nextItem?.name ?? current.inventoryItemName,
                      inventoryItemSku: nextItem?.sku ?? current.inventoryItemSku,
                    }));
                  }}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.quantityOrdered}
                  onChange={(event) =>
                    updateLine(line.id, (current) => ({
                      ...current,
                      quantityOrdered: Number(event.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.unitPrice}
                  onChange={(event) =>
                    updateLine(line.id, (current) => ({
                      ...current,
                      unitPrice: Number(event.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={line.taxRate}
                  onChange={(event) =>
                    updateLine(line.id, (current) => ({
                      ...current,
                      taxRate: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
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

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  listInventoryItems,
  listStockLevels,
  listStorageLocations,
} from '../../../lib/inventory-api';
import type {
  InventoryItemRecord,
  StockLevelRecord,
  StorageLocationRecord,
} from '../../../lib/inventory-types';

export default function InventoryStockPage() {
  const { session } = useAppSession();

  const [stockRows, setStockRows] = useState<StockLevelRecord[]>([]);
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);

  const [inventoryItemId, setInventoryItemId] = useState('ALL');
  const [storageLocationId, setStorageLocationId] = useState('ALL');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLocations([]);
        }
      }
    }

    void loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  const loadStockRows = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setStockRows([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listStockLevels(requestOptions, {
        organizationId: session.organizationId,
        inventoryItemId,
        storageLocationId,
        page: 1,
        limit: 500,
      });

      setStockRows(response.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to load stock data.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    canLoad,
    inventoryItemId,
    requestOptions,
    session.organizationId,
    storageLocationId,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStockRows();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStockRows]);

  async function onApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadStockRows();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stock by Item and Location"
        description="Inspect quantity on hand, reserved and available stock levels."
        actions={
          <div className="flex gap-2">
            <Link
              href="/inventory/adjustments/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              New Adjustment
            </Link>
            <Link
              href="/inventory/transfers/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              New Transfer
            </Link>
          </div>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to view stock levels.
        </div>
      ) : null}

      {canLoad && locations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Create a storage location before adding stock.
        </div>
      ) : null}

      <form
        onSubmit={onApplyFilters}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-4"
      >
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={inventoryItemId}
          onChange={(event) => setInventoryItemId(event.target.value)}
        >
          <option value="ALL">All items</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.sku})
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={storageLocationId}
          onChange={(event) => setStorageLocationId(event.target.value)}
        >
          <option value="ALL">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading stock levels...
        </div>
      ) : canLoad && stockRows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No stock levels found for the selected filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Item</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Location</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">On Hand</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Reserved</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Available</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <tr
                  key={`${row.inventoryItemId}-${row.storageLocationId}`}
                  className="border-t border-zinc-200"
                >
                  <td className="px-3 py-2 text-zinc-900">{row.inventoryItemName}</td>
                  <td className="px-3 py-2 text-zinc-700">{row.storageLocationName}</td>
                  <td className="px-3 py-2 text-right text-zinc-700">{row.quantityOnHand}</td>
                  <td className="px-3 py-2 text-right text-zinc-700">{row.quantityReserved}</td>
                  <td className="px-3 py-2 text-right text-zinc-700">{row.quantityAvailable}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

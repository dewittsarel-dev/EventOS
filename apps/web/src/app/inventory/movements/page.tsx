'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  listInventoryItems,
  listStockMovements,
  listStorageLocations,
} from '../../../lib/inventory-api';
import {
  STOCK_MOVEMENT_TYPE_OPTIONS,
  type InventoryItemRecord,
  type StockMovementRecord,
  type StockMovementType,
  type StorageLocationRecord,
} from '../../../lib/inventory-types';

type MovementTypeFilter = 'ALL' | StockMovementType;

export default function StockMovementsPage() {
  const { session } = useAppSession();

  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);

  const [inventoryItemId, setInventoryItemId] = useState('ALL');
  const [storageLocationId, setStorageLocationId] = useState('ALL');
  const [movementType, setMovementType] = useState<MovementTypeFilter>('ALL');
  const [search, setSearch] = useState('');

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

  const loadMovements = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setMovements([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listStockMovements(requestOptions, {
        organizationId: session.organizationId,
        inventoryItemId: inventoryItemId === 'ALL' ? undefined : inventoryItemId,
        storageLocationId:
          storageLocationId === 'ALL' ? undefined : storageLocationId,
        movementType: movementType === 'ALL' ? undefined : movementType,
        search: search.trim() || undefined,
        page: 1,
        limit: 500,
      });

      setMovements(response.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load movement history.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    canLoad,
    inventoryItemId,
    movementType,
    requestOptions,
    search,
    session.organizationId,
    storageLocationId,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMovements();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMovements]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadMovements();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Movement History"
        description="Audit trail of all quantity changes across inventory locations."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to view movement history.
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-5"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reason, notes or reference"
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={inventoryItemId}
          onChange={(event) => setInventoryItemId(event.target.value)}
        >
          <option value="ALL">All items</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
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

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={movementType}
          onChange={(event) =>
            setMovementType(event.target.value as MovementTypeFilter)
          }
        >
          <option value="ALL">All movement types</option>
          {STOCK_MOVEMENT_TYPE_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
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
          Loading movement history...
        </div>
      ) : canLoad && movements.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No stock movements found for the selected filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Date</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Item</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Location</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Type</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Quantity</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Reason</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Reference</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2 text-zinc-700">
                    {new Date(movement.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-zinc-900">{movement.inventoryItemName}</td>
                  <td className="px-3 py-2 text-zinc-700">{movement.storageLocationName}</td>
                  <td className="px-3 py-2 text-zinc-700">{movement.movementType}</td>
                  <td className="px-3 py-2 text-right text-zinc-700">{movement.quantity}</td>
                  <td className="px-3 py-2 text-zinc-700">{movement.reason ?? '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">{movement.reference ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

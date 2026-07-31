'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { getInventoryOverview } from '../../lib/inventory-api';
import type { InventoryOverview } from '../../lib/inventory-types';

const emptyOverview: InventoryOverview = {
  totalActiveItems: 0,
  totalStockQuantity: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  activeLocations: 0,
  recentStockMovements: [],
};

export default function InventoryOverviewPage() {
  const { session } = useAppSession();
  const [overview, setOverview] = useState<InventoryOverview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({
      token: session.token,
      baseUrl: session.baseUrl,
    }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      if (!canLoad || !session.organizationId) {
        if (!cancelled) {
          setOverview(emptyOverview);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getInventoryOverview(requestOptions, session.organizationId);

        if (!cancelled) {
          setOverview(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load inventory overview.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inventory"
        description="Central hub for inventory operations, stock health and movement trends."
        actions={
          <div className="flex gap-2">
            <Link
              href="/inventory/items/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Create Item
            </Link>
            <Link
              href="/inventory/adjustments/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              New Adjustment
            </Link>
          </div>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to access inventory data.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading inventory overview...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canLoad && !loading && !error ? (
        <>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Active Items" value={overview.totalActiveItems} />
            <StatCard label="Total Stock Quantity" value={overview.totalStockQuantity} />
            <StatCard label="Low-Stock Items" value={overview.lowStockItems} />
            <StatCard label="Out-of-Stock Items" value={overview.outOfStockItems} />
            <StatCard label="Active Locations" value={overview.activeLocations} />
            <StatCard label="Recent Movements" value={overview.recentStockMovements.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Shortcuts</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/items">
                  Inventory Items
                </Link>
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/categories">
                  Categories Management
                </Link>
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/locations">
                  Storage Locations
                </Link>
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/stock">
                  Stock by Item and Location
                </Link>
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/transfers/new">
                  Stock Transfer Form
                </Link>
                <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/inventory/movements">
                  Movement History
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Recent Stock Movements</h2>
              {overview.recentStockMovements.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No stock movements recorded yet.</p>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  {overview.recentStockMovements.map((movement) => (
                    <div key={movement.id} className="rounded-md border border-zinc-200 px-3 py-2">
                      <p className="font-medium text-zinc-900">
                        {movement.movementType} · {movement.inventoryItemName}
                      </p>
                      <p className="text-zinc-600">
                        {movement.storageLocationName} · Qty {movement.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

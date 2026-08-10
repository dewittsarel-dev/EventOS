'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import {
  getResourceWorkspaceSummary,
  listInventoryCategories,
  listResourceWorkspaceCards,
  updateResourceMarketplaceVisibility,
} from '../../lib/inventory-api';
import type {
  InventoryCategoryRecord,
  ResourceWorkspaceCard,
  ResourceWorkspaceSummary,
} from '../../lib/inventory-types';
import { listSuppliers } from '../../lib/suppliers-api';
import type { SupplierRecord } from '../../lib/suppliers-types';

const emptySummary: ResourceWorkspaceSummary = {
  totalResources: 0,
  availableToday: 0,
  reservedToday: 0,
  damaged: 0,
  missing: 0,
  returningToday: 0,
  maintenanceDue: 0,
  recentlyReturnedResources: [],
};

export default function InventoryOverviewPage() {
  const { session } = useAppSession();

  const [summary, setSummary] = useState<ResourceWorkspaceSummary>(emptySummary);
  const [cards, setCards] = useState<ResourceWorkspaceCard[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  const [search, setSearch] = useState('');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('ALL');
  const [supplierId, setSupplierId] = useState('ALL');
  const [available, setAvailable] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [missing, setMissing] = useState(false);
  const [maintenanceDue, setMaintenanceDue] = useState(false);
  const [marketplacePublished, setMarketplacePublished] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalCards, setTotalCards] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [error, setError] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({
      token: session.token,
      baseUrl: session.baseUrl,
    }),
    [session.baseUrl, session.token],
  );

  const totalPages = useMemo(() => {
    if (!totalCards || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(totalCards / limit));
  }, [limit, totalCards]);

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      setLoadingReferences(true);

      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          listInventoryCategories(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 100,
            active: true,
          }),
          listSuppliers(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 100,
            active: true,
          }),
        ]);

        if (!cancelled) {
          setCategories(categoriesResponse.data);
          setSuppliers(suppliersResponse.data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setSuppliers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingReferences(false);
        }
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  const loadWorkspace = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setSummary(emptySummary);
      setCards([]);
      setTotalCards(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [summaryResponse, cardsResponse] = await Promise.all([
        getResourceWorkspaceSummary(requestOptions, session.organizationId),
        listResourceWorkspaceCards(requestOptions, {
          organizationId: session.organizationId,
          search,
          category: category === 'ALL' ? undefined : category,
          tags,
          keywords,
          supplierId: supplierId === 'ALL' ? undefined : supplierId,
          available,
          reserved,
          damaged,
          missing,
          maintenanceDue,
          marketplacePublished,
          page,
          limit,
        }),
      ]);

      setSummary(summaryResponse);
      setCards(cardsResponse.data);
      setTotalCards(cardsResponse.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load resource workspace.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    available,
    canLoad,
    category,
    damaged,
    keywords,
    limit,
    maintenanceDue,
    marketplacePublished,
    missing,
    page,
    requestOptions,
    reserved,
    search,
    session.organizationId,
    supplierId,
    tags,
  ]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void loadWorkspace();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadWorkspace]);

  function onFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void loadWorkspace();
  }

  async function toggleMarketplace(resourceId: string, published: boolean) {
    setError('');
    try {
      await updateResourceMarketplaceVisibility(
        requestOptions,
        resourceId,
        published ? 'PRIVATE' : 'MARKETPLACE',
      );
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Marketplace publication could not be updated.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Resource Workspace"
        description="Operational center for resources, availability, reservations, and return flows."
        actions={
          <div className="flex gap-2">
            <Link
              href="/settings/marketplace"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Manage Marketplace
            </Link>
            <Link
              href="/marketplace"
              target="_blank"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Preview Marketplace
            </Link>
            <Link
              href="/resources/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Add Product or Service
            </Link>
            <Link
              href="/inventory/items/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Add Tracked Stock Item
            </Link>
          </div>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to access resource operations.
        </div>
      ) : null}

      <form
        onSubmit={onFilterSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-4 xl:grid-cols-8"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, description, category, SKU, barcode"
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags (comma-separated)"
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="Keywords"
        />
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="ALL">All categories</option>
          {categories.map((entry) => (
            <option key={entry.id} value={entry.name}>
              {entry.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={supplierId}
          onChange={(event) => setSupplierId(event.target.value)}
        >
          <option value="ALL">All suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.companyName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setTags('');
            setKeywords('');
            setCategory('ALL');
            setSupplierId('ALL');
            setAvailable(false);
            setReserved(false);
            setDamaged(false);
            setMissing(false);
            setMaintenanceDue(false);
            setMarketplacePublished(false);
            setPage(1);
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
        >
          Reset
        </button>

        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={available}
            onChange={(event) => setAvailable(event.target.checked)}
          />
          Available
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={reserved}
            onChange={(event) => setReserved(event.target.checked)}
          />
          Reserved
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={damaged}
            onChange={(event) => setDamaged(event.target.checked)}
          />
          Damaged
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={missing}
            onChange={(event) => setMissing(event.target.checked)}
          />
          Missing
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={maintenanceDue}
            onChange={(event) => setMaintenanceDue(event.target.checked)}
          />
          Maintenance due
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={marketplacePublished}
            onChange={(event) => setMarketplacePublished(event.target.checked)}
          />
          Marketplace published
        </label>
      </form>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading resource workspace...
        </div>
      ) : null}

      {loadingReferences ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading categories and suppliers...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canLoad && !loading && !error ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <StatCard label="Total Resources" value={summary.totalResources} />
            <StatCard label="Available Today" value={summary.availableToday} />
            <StatCard label="Reserved Today" value={summary.reservedToday} />
            <StatCard label="Damaged" value={summary.damaged} />
            <StatCard label="Missing" value={summary.missing} />
            <StatCard label="Returning Today" value={summary.returningToday} />
            <StatCard label="Maintenance Due" value={summary.maintenanceDue} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {cards.length === 0 ? (
              <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
                No resources match the current filters.
              </div>
            ) : (
              <div className="xl:col-span-2 grid gap-3 sm:grid-cols-2">
                {cards.map((card) => (
                  <article key={card.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-900">{card.name}</h2>
                        <p className="text-xs text-zinc-500">{card.category}</p>
                      </div>
                      <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700">
                        {card.marketplaceStatus}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <StatLine label="Quantity" value={displayQuantity(card.quantity)} />
                      <StatLine
                        label="Available"
                        value={displayQuantity(card.availableQuantity)}
                      />
                      <StatLine
                        label="Reserved"
                        value={displayQuantity(card.reservedQuantity)}
                      />
                      <StatLine
                        label="Damaged"
                        value={String(card.damagedQuantity)}
                      />
                      <StatLine
                        label="Missing"
                        value={String(card.missingQuantity)}
                      />
                      <StatLine
                        label="Location"
                        value={card.currentLocation ?? '-'}
                      />
                      <StatLine
                        label="Supplier"
                        value={card.supplierName ?? '-'}
                      />
                      <StatLine
                        label="Next Reservation"
                        value={card.nextReservation ? new Date(card.nextReservation).toLocaleString() : '-'}
                      />
                    </dl>

                    <div className="mt-3 flex min-h-20 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-center text-xs text-zinc-500">
                      No product photo yet. Marketplace uses a neutral placeholder until one is added.
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void toggleMarketplace(
                          card.id,
                          card.marketplaceStatus === 'MARKETPLACE',
                        )
                      }
                      className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      {card.marketplaceStatus === 'MARKETPLACE'
                        ? 'Remove from Marketplace'
                        : 'Publish to Marketplace'}
                    </button>
                    <Link href={`/resources/${card.id}/edit`} className="mt-2 block text-center text-xs text-zinc-600 underline">Edit resource details</Link>
                  </article>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Operational Panels</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <Panel label="Availability" value={`${summary.availableToday} resources available today`} />
                <Panel label="Reservations" value={`${summary.reservedToday} resources reserved today`} />
                <Panel label="Damaged Items" value={`${summary.damaged} resources require inspection`} />
                <Panel label="Missing Items" value={`${summary.missing} resources currently marked missing`} />
                <Panel
                  label="Maintenance Alerts"
                  value={`${summary.maintenanceDue} resources marked maintenance due`}
                />
                <Panel
                  label="Recently Returned Resources"
                  value={`${summary.recentlyReturnedResources.length} resources returned in the last week`}
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-zinc-800">Recently Returned</h3>
              {summary.recentlyReturnedResources.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">No recent returns captured yet.</p>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  {summary.recentlyReturnedResources.map((entry) => (
                    <div key={`${entry.resourceId}-${entry.returnedAt}`} className="rounded-md border border-zinc-200 px-3 py-2">
                      <p className="font-medium text-zinc-900">{entry.resourceName}</p>
                      <p className="text-zinc-600">
                        Qty returned {entry.quantityReturned} · {new Date(entry.returnedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="xl:col-span-3 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  Page {page} of {totalPages} · {totalCards} resource card(s)
                </p>
                <div className="flex items-center gap-2">
                  <label>
                    Cards
                    <select
                      className="ml-2 rounded-md border border-zinc-300 px-2 py-1"
                      value={limit}
                      onChange={(event) => {
                        setLimit(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      {[6, 12, 24].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-3 rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Manual Workflow Shortcuts</h2>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
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

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-800">{value}</dd>
    </>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-800">{value}</p>
    </div>
  );
}

function displayQuantity(value: number | null) {
  if (value === null) {
    return 'Unlimited';
  }

  return String(value);
}

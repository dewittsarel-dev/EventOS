'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  updateInventoryItem,
} from '../../../lib/inventory-api';
import {
  INVENTORY_MARKETPLACE_VISIBILITY_OPTIONS,
  INVENTORY_RESOURCE_STATUSES,
  INVENTORY_ITEM_TYPES,
  INVENTORY_SORT_OPTIONS,
  type InventoryCategoryRecord,
  type InventoryItemRecord,
  type InventoryItemType,
  type InventoryMarketplaceVisibility,
  type InventoryResourceStatus,
  type InventorySortBy,
} from '../../../lib/inventory-types';
import { listSuppliers } from '../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../lib/suppliers-types';

type BoolFilter = 'ALL' | 'true' | 'false';

type ItemTypeFilter = 'ALL' | InventoryItemType;
type ResourceStatusFilter = 'ALL' | InventoryResourceStatus;
type MarketplaceVisibilityFilter = 'ALL' | InventoryMarketplaceVisibility;

export default function InventoryItemsPage() {
  const { session } = useAppSession();

  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('ALL');
  const [itemType, setItemType] = useState<ItemTypeFilter>('ALL');
  const [active, setActive] = useState<BoolFilter>('ALL');
  const [style, setStyle] = useState('');
  const [material, setMaterial] = useState('');
  const [colour, setColour] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [preferredSupplierId, setPreferredSupplierId] = useState('ALL');
  const [resourceStatus, setResourceStatus] =
    useState<ResourceStatusFilter>('ALL');
  const [marketplaceVisibility, setMarketplaceVisibility] =
    useState<MarketplaceVisibilityFilter>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<InventorySortBy>('name');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  useEffect(() => {
    let cancelled = false;

    async function loadReferenceData() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          listInventoryCategories(requestOptions, {
            organizationId: session.organizationId,
            active: true,
            page: 1,
            limit: 100,
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
      }
    }

    void loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  const loadItems = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await listInventoryItems(requestOptions, {
        organizationId: session.organizationId,
        page,
        limit,
        search,
        style: style || undefined,
        material: material || undefined,
        colour: colour || undefined,
        dimensions: dimensions || undefined,
        tags: tags || undefined,
        keywords: keywords || undefined,
        categoryId: categoryId === 'ALL' ? undefined : categoryId,
        itemType: itemType === 'ALL' ? undefined : itemType,
        resourceStatus:
          resourceStatus === 'ALL' ? undefined : resourceStatus,
        marketplaceVisibility:
          marketplaceVisibility === 'ALL' ? undefined : marketplaceVisibility,
        active: active === 'ALL' ? undefined : active === 'true',
        preferredSupplierId:
          preferredSupplierId === 'ALL' ? undefined : preferredSupplierId,
        lowStockOnly,
        sortBy,
      });

      setItems(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load resource items.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    active,
    canLoad,
    categoryId,
    itemType,
    limit,
    lowStockOnly,
    material,
    marketplaceVisibility,
    page,
    preferredSupplierId,
    resourceStatus,
    requestOptions,
    search,
    session.organizationId,
    sortBy,
    style,
    tags,
    dimensions,
    keywords,
    colour,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadItems]);

  async function onDelete(id: string) {
    if (!session.token) {
      setError('Please sign in before changing a resource.');
      return;
    }

    const confirmed = window.confirm('Delete this resource item?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteInventoryItem(requestOptions, id);
      setSuccess('Resource item deleted.');
      await loadItems();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete resource item.',
      );
    }
  }

  async function onArchiveToggle(item: InventoryItemRecord) {
    if (!session.token) {
      setError('Please sign in before changing a resource.');
      return;
    }

    const shouldArchive = item.active;
    const confirmed = window.confirm(
      shouldArchive
        ? 'Archive this resource item?'
        : 'Restore this resource item?',
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await updateInventoryItem(requestOptions, item.id, {
        active: !shouldArchive,
        resourceStatus: shouldArchive ? 'Archived' : 'Active',
      });
      setSuccess(
        shouldArchive
          ? 'Resource item archived.'
          : 'Resource item restored.',
      );
      await loadItems();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : shouldArchive
            ? 'Failed to archive resource item.'
            : 'Failed to restore resource item.',
      );
    }
  }

  async function onFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadItems();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Resource Items"
        description="Manage the organization resource catalog and stock signals."
        actions={
          <Link
            href="/inventory/items/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Create Resource
          </Link>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage resource items.
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-8"
        onSubmit={onFilterSubmit}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, description, tags, style, material"
        />

        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={style}
          onChange={(event) => setStyle(event.target.value)}
          placeholder="Style"
        />

        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
          placeholder="Material"
        />

        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={colour}
          onChange={(event) => setColour(event.target.value)}
          placeholder="Colour"
        />

        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dimensions}
          onChange={(event) => setDimensions(event.target.value)}
          placeholder="Dimensions"
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
          placeholder="Keywords (comma-separated)"
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="ALL">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={itemType}
          onChange={(event) => setItemType(event.target.value as ItemTypeFilter)}
        >
          <option value="ALL">All item types</option>
          {INVENTORY_ITEM_TYPES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={resourceStatus}
          onChange={(event) =>
            setResourceStatus(event.target.value as ResourceStatusFilter)
          }
        >
          <option value="ALL">All resource statuses</option>
          {INVENTORY_RESOURCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={marketplaceVisibility}
          onChange={(event) =>
            setMarketplaceVisibility(
              event.target.value as MarketplaceVisibilityFilter,
            )
          }
        >
          <option value="ALL">Marketplace: All</option>
          {INVENTORY_MARKETPLACE_VISIBILITY_OPTIONS.map((visibility) => (
            <option key={visibility} value={visibility}>
              {visibility}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={active}
          onChange={(event) => setActive(event.target.value as BoolFilter)}
        >
          <option value="ALL">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={preferredSupplierId}
          onChange={(event) => setPreferredSupplierId(event.target.value)}
        >
          <option value="ALL">All suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.companyName}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as InventorySortBy)}
        >
          {INVENTORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>

        <label className="inline-flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(event) => setLowStockOnly(event.target.checked)}
            className="h-4 w-4"
          />
          Low stock only
        </label>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading resource items...
        </div>
      ) : canLoad && items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No resource items found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Item name</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Item type</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">On hand</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">Reserved</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">Available</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">Reorder</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-200">
                    <td className="px-3 py-2 text-zinc-900">{item.sku}</td>
                    <td className="px-3 py-2 text-zinc-900">{item.name}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.categoryName}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.itemType}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{item.stock.quantityOnHand}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{item.stock.quantityReserved}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{item.stock.quantityAvailable}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{item.reorderLevel ?? '-'}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.active ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      <div className="flex gap-2">
                        <Link
                          href={`/inventory/items/${item.id}`}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          View
                        </Link>
                        <Link
                          href={`/inventory/items/${item.id}/edit`}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            void onArchiveToggle(item);
                          }}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          {item.active ? 'Archive' : 'Restore'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void onDelete(item.id);
                          }}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canLoad ? (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
          <p>
            Page {page} of {totalPages} · {total} item(s)
          </p>
          <div className="flex items-center gap-3">
            <label>
              Rows
              <select
                className="ml-2 rounded-md border border-zinc-300 px-2 py-1"
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((size) => (
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
      ) : null}
    </div>
  );
}

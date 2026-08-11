'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { getSupplier } from '@/lib/suppliers-api';
import {
  archiveSupplierProduct,
  deleteSupplierProduct,
  listSupplierProducts,
  restoreSupplierProduct,
} from '@/lib/supplier-products-api';
import {
  SUPPLIER_PRODUCT_CATEGORIES,
  type SupplierProductRecord,
  type SupplierProductSortBy,
} from '@/lib/supplier-products-types';

type ActiveFilter = 'ALL' | 'true' | 'false';
type CategoryFilter = 'ALL' | (typeof SUPPLIER_PRODUCT_CATEGORIES)[number];

function money(value: number | null) {
  if (value === null) {
    return '-';
  }

  return value.toFixed(2);
}

export default function SupplierProductsPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);

  const { session } = useAppSession();

  const [supplierName, setSupplierName] = useState('Supplier');
  const [products, setProducts] = useState<SupplierProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [active, setActive] = useState<ActiveFilter>('true');
  const [sortBy, setSortBy] = useState<SupplierProductSortBy>('productName');

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

  const loadProducts = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const [supplier, response] = await Promise.all([
        getSupplier(requestOptions, supplierId),
        listSupplierProducts(requestOptions, {
          organizationId: session.organizationId,
          supplierId,
          page,
          limit,
          search,
          category,
          active: active === 'ALL' ? undefined : active === 'true',
          sortBy,
        }),
      ]);

      setSupplierName(supplier.companyName);
      setProducts(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load supplier products.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    active,
    canLoad,
    category,
    limit,
    page,
    requestOptions,
    search,
    session.organizationId,
    sortBy,
    supplierId,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProducts]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadProducts();
  }

  async function onArchive(productId: string) {
    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    const confirmed = window.confirm('Archive this product?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await archiveSupplierProduct(
        requestOptions,
        supplierId,
        productId,
        session.organizationId,
      );
      setSuccess('Product archived.');
      await loadProducts();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive product.',
      );
    }
  }

  async function onRestore(productId: string) {
    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await restoreSupplierProduct(
        requestOptions,
        supplierId,
        productId,
        session.organizationId,
      );
      setSuccess('Product restored.');
      await loadProducts();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to restore product.',
      );
    }
  }

  async function onDelete(productId: string) {
    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    const confirmed = window.confirm(
      'Delete this product permanently? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteSupplierProduct(
        requestOptions,
        supplierId,
        productId,
        session.organizationId,
      );
      setSuccess('Product deleted.');
      await loadProducts();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete product.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Supplier Products"
        description={`Catalogue for ${supplierName}.`}
        actions={
          <>
            <Link
              href={`/suppliers/${supplierId}`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Supplier
            </Link>
            <Link
              href={`/suppliers/${supplierId}/products/import`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Import Catalogue
            </Link>
            <Link
              href={`/suppliers/${supplierId}/products/new`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Create Product
            </Link>
          </>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage supplier products.
        </div>
      ) : null}

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-5"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search product name, SKU or brand"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
        >
          <option value="ALL">All categories</option>
          {SUPPLIER_PRODUCT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={active}
          onChange={(event) => setActive(event.target.value as ActiveFilter)}
        >
          <option value="ALL">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Archived</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as SupplierProductSortBy)
          }
        >
          <option value="productName">Product Name</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="costPrice">Cost Price</option>
          <option value="leadTime">Lead Time</option>
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 md:col-span-5 md:justify-self-end"
        >
          Apply
        </button>
      </form>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-600">Rows</label>
        <input
          type="number"
          min={1}
          max={100}
          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value) || 10)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading products...
        </div>
      ) : canLoad && products.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No products found for this supplier.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Product Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Brand</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Cost Price</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Lead Time</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">{product.productName}</td>
                    <td className="px-4 py-3 text-zinc-700">{product.category}</td>
                    <td className="px-4 py-3 text-zinc-700">{product.brand ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{money(product.costPrice)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {product.leadTimeDays === null ? '-' : `${product.leadTimeDays} days`}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {product.active ? 'Active' : 'Archived'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/suppliers/${supplierId}/products/${product.id}`}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          View
                        </Link>
                        <Link
                          href={`/suppliers/${supplierId}/products/${product.id}/edit`}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          Edit
                        </Link>
                        {product.active ? (
                          <button
                            type="button"
                            className="rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                            onClick={() => void onArchive(product.id)}
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => void onRestore(product.id)}
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => void onDelete(product.id)}
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

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
            <p>
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

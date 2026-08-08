'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { archiveSupplier, listSuppliers } from '../../lib/suppliers-api';
import {
  SUPPLIER_CATEGORIES,
  type SupplierRecord,
  type SupplierSortBy,
} from '../../lib/suppliers-types';

type BooleanFilter = 'ALL' | 'true' | 'false';
type CategoryFilter = 'ALL' | (typeof SUPPLIER_CATEGORIES)[number];

function ratingText(value: number | null) {
  return value === null ? '-' : `${value}/5`;
}

export default function SuppliersPage() {
  const { session } = useAppSession();
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [preferredSupplier, setPreferredSupplier] =
    useState<BooleanFilter>('ALL');
  const [active, setActive] = useState<BooleanFilter>('true');
  const [sortBy, setSortBy] = useState<SupplierSortBy>('companyName');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const canLoad = Boolean(session.token && session.organizationId);

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  async function loadSuppliers() {
    setError('');
    setSuccess('');

    if (!canLoad) {
      setSuppliers([]);
      return;
    }

    setLoading(true);

    try {
      const response = await listSuppliers(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          page,
          limit,
          search,
          category,
          preferredSupplier:
            preferredSupplier === 'ALL' ? undefined : preferredSupplier === 'true',
          active: active === 'ALL' ? undefined : active === 'true',
          sortBy,
        },
      );

      const uniqueSuppliers = Array.from(
        new Map(response.data.map((supplier) => [supplier.id, supplier])).values(),
      );
      setSuppliers(uniqueSuppliers);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load suppliers.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canLoad) {
      return;
    }

    // Fetching data in this effect is intentional for query-driven refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, session.token, session.organizationId, page, limit, sortBy]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadSuppliers();
  }

  async function onArchive(id: string) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    const confirmed = window.confirm(
      'Archive this supplier? This keeps historical records and removes it from active supplier lists.',
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await archiveSupplier(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        id,
      );

      setSuccess('Supplier archived.');
      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive supplier.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Suppliers"
        description="Manage external service providers used by your organization."
        actions={
          <Link
            href="/suppliers/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create Supplier
          </Link>
        }
      />

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-7"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search name, contact, email, phone or city"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
        >
          <option value="ALL">All categories</option>
          {SUPPLIER_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={preferredSupplier}
          onChange={(event) => setPreferredSupplier(event.target.value as BooleanFilter)}
        >
          <option value="ALL">Preferred: All</option>
          <option value="true">Preferred only</option>
          <option value="false">Not preferred</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={active}
          onChange={(event) => setActive(event.target.value as BooleanFilter)}
        >
          <option value="ALL">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Archived</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SupplierSortBy)}
        >
          <option value="companyName">Company Name</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Rating</option>
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
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

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage suppliers.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading suppliers...
        </div>
      ) : canLoad && suppliers.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No suppliers found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Primary Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Phone / Mobile</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">City</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Preferred</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="cursor-pointer border-t border-zinc-200 hover:bg-zinc-50"
                    onClick={() => router.push(`/suppliers/${supplier.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/suppliers/${supplier.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ${supplier.companyName} details`}
                  >
                    <td className="px-4 py-3 text-zinc-900">{supplier.companyName}</td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.category}</td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.primaryContactName ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {supplier.phone ?? supplier.mobile ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.email ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.city ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{ratingText(supplier.internalRating)}</td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.preferredSupplier ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-zinc-700">{supplier.active ? 'Active' : 'Archived'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/suppliers/${supplier.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </Link>
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/suppliers/${supplier.id}/edit`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Edit
                        </Link>
                        {supplier.active ? (
                          <button
                            type="button"
                            className="rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onArchive(supplier.id);
                            }}
                          >
                            Archive
                          </button>
                        ) : null}
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
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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

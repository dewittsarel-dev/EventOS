'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  archiveQuotation,
  listQuotations,
  updateQuotationStatus,
} from '@/lib/quotations-api';
import {
  QUOTATION_STATUSES,
  type QuotationRecord,
  type QuotationStatus,
} from '@/lib/quotations-types';

type SortBy = 'createdAt' | 'updatedAt' | 'totalCents' | 'quoteNumber';
type SortOrder = 'asc' | 'desc';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

export default function QuotationsPage() {
  const { session } = useAppSession();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuotationStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sort, setSort] = useState<SortOrder>('desc');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  async function loadQuotations() {
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    setLoading(true);

    try {
      const response = await listQuotations(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          page,
          limit,
          search,
          status,
          sortBy,
          sort,
          includeArchived,
        },
      );

      setQuotations(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load quotations.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.token || !session.organizationId) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session.token,
    session.organizationId,
    page,
    limit,
    sortBy,
    sort,
    includeArchived,
  ]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadQuotations();
  }

  async function onArchive(id: string) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await archiveQuotation(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        id,
      );

      setSuccess('Quotation archived.');
      await loadQuotations();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive quotation.',
      );
    }
  }

  async function onStatusUpdate(id: string, nextStatus: QuotationStatus) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await updateQuotationStatus(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        id,
        nextStatus,
      );

      setSuccess('Status updated.');
      await loadQuotations();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update status.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Quotations"
        description="Manage pricing proposals linked to contacts and events."
        actions={
          <Link
            href="/quotations/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create Quotation
          </Link>
        }
      />

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-8"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search quote number / title / notes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as QuotationStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {QUOTATION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortBy)}
        >
          <option value="createdAt">Sort by created</option>
          <option value="updatedAt">Sort by updated</option>
          <option value="totalCents">Sort by total</option>
          <option value="quoteNumber">Sort by quote number</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOrder)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <input
          type="number"
          min={1}
          max={100}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value) || 10)}
        />

        <label className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Include archived
        </label>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading quotations...
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No quotations found yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Quote</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">{quotation.quoteNumber}</td>
                    <td className="px-4 py-3 text-zinc-900">{quotation.title}</td>
                    <td className="px-4 py-3 text-zinc-700">{quotation.status}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatCurrency(quotation.totalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/quotations/${quotation.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/quotations/${quotation.id}/edit`}
                        >
                          Edit
                        </Link>
                        <select
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                          value={quotation.status}
                          onChange={(event) =>
                            void onStatusUpdate(
                              quotation.id,
                              event.target.value as QuotationStatus,
                            )
                          }
                        >
                          {QUOTATION_STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        {quotation.archivedAt ? null : (
                          <button
                            type="button"
                            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => void onArchive(quotation.id)}
                          >
                            Archive
                          </button>
                        )}
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

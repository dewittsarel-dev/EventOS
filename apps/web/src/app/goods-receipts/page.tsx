'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { listGoodsReceipts } from '../../lib/purchase-orders-api';
import type { GoodsReceiptRecord } from '../../lib/purchase-orders-types';

export default function GoodsReceiptsPage() {
  const { session } = useAppSession();

  const [receipts, setReceipts] = useState<GoodsReceiptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
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

  async function loadReceipts() {
    if (!canLoad || !session.organizationId) {
      setReceipts([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listGoodsReceipts(requestOptions, {
        organizationId: session.organizationId,
        page,
        limit,
        search: search.trim() || undefined,
      });

      setReceipts(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load goods receipts.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReceipts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, session.organizationId, page, limit]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadReceipts();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Goods Receipts"
        description="History of all goods received against purchase orders."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to view goods receipts.
        </div>
      ) : null}

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-4"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-3"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search receipt number, PO number or delivery note"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading goods receipts...
        </div>
      ) : receipts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No goods receipts found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700">Receipt Number</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Purchase Order</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Supplier</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Received Date</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Location</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-3 py-2">{receipt.receiptNumber}</td>
                  <td className="px-3 py-2">{receipt.purchaseOrderNumber}</td>
                  <td className="px-3 py-2">{receipt.supplierName}</td>
                  <td className="px-3 py-2">{new Date(receipt.receivedDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{receipt.storageLocationName}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/goods-receipts/${receipt.id}`}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 text-sm">
        <p className="text-zinc-600">
          Page {page} of {totalPages} ({total} rows)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <select
            className="rounded border border-zinc-300 px-2 py-1"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

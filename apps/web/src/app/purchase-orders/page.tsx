'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import {
  cancelPurchaseOrder,
  listPurchaseOrders,
  markPurchaseOrderSent,
  submitPurchaseOrderForApproval,
} from '../../lib/purchase-orders-api';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderRecord,
  type PurchaseOrderSortBy,
  type PurchaseOrderStatus,
} from '../../lib/purchase-orders-types';
import { listSuppliers } from '../../lib/suppliers-api';
import type { SupplierRecord } from '../../lib/suppliers-types';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
  }).format(amount);
}

function statusClass(status: PurchaseOrderStatus) {
  if (status === 'Draft') {
    return 'bg-zinc-100 text-zinc-700';
  }

  if (status === 'PendingApproval') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'Approved') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'Sent') {
    return 'bg-sky-100 text-sky-700';
  }

  if (status === 'PartiallyReceived') {
    return 'bg-violet-100 text-violet-700';
  }

  if (status === 'FullyReceived') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-rose-100 text-rose-700';
}

export default function PurchaseOrdersPage() {
  const { session } = useAppSession();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('ALL');
  const [status, setStatus] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<PurchaseOrderSortBy>('newest');

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

    async function loadSuppliersForFilter() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      try {
        const response = await listSuppliers(requestOptions, {
          organizationId: session.organizationId,
          page: 1,
          limit: 200,
          active: true,
        });

        if (!cancelled) {
          setSuppliers(response.data);
        }
      } catch {
        if (!cancelled) {
          setSuppliers([]);
        }
      }
    }

    void loadSuppliersForFilter();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  async function loadPurchaseOrders() {
    if (!canLoad || !session.organizationId) {
      setPurchaseOrders([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listPurchaseOrders(requestOptions, {
        organizationId: session.organizationId,
        page,
        limit,
        search: search.trim() || undefined,
        supplierId: supplierId === 'ALL' ? undefined : supplierId,
        status,
        overdueOnly,
        sortBy,
      });

      setPurchaseOrders(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load purchase orders.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPurchaseOrders();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, session.organizationId, page, limit, sortBy, overdueOnly]);

  async function onFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadPurchaseOrders();
  }

  async function onSubmitForApproval(id: string) {
    setError('');
    setSuccess('');

    try {
      await submitPurchaseOrderForApproval(requestOptions, id);
      setSuccess('Purchase order submitted for approval.');
      await loadPurchaseOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to submit purchase order for approval.',
      );
    }
  }

  async function onMarkSent(id: string) {
    setError('');
    setSuccess('');

    try {
      await markPurchaseOrderSent(requestOptions, id);
      setSuccess('Purchase order marked as sent.');
      await loadPurchaseOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to mark purchase order as sent.',
      );
    }
  }

  async function onCancel(id: string) {
    const confirmed = window.confirm('Cancel this purchase order?');
    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await cancelPurchaseOrder(requestOptions, id);
      setSuccess('Purchase order cancelled.');
      await loadPurchaseOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to cancel purchase order.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Purchase Orders"
        description="Create, approve, send and track supplier purchasing."
        actions={
          <Link
            href="/purchase-orders/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Create Purchase Order
          </Link>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage purchase orders.
        </div>
      ) : null}

      <form
        onSubmit={onFilterSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-7"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search number, supplier or references"
        />

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

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as PurchaseOrderStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {PURCHASE_ORDER_STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as PurchaseOrderSortBy)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="number">PO Number</option>
          <option value="supplier">Supplier</option>
          <option value="expectedDelivery">Expected Delivery</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(event) => setOverdueOnly(event.target.checked)}
          />
          Overdue only
        </label>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading purchase orders...
        </div>
      ) : canLoad && purchaseOrders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No purchase orders found for current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700">Purchase Order Number</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Supplier</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Order Date</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Expected Delivery</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Status</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Total</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Received progress</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Created by</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {purchaseOrders.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium text-zinc-900">{row.purchaseOrderNumber}</td>
                  <td className="px-3 py-2 text-zinc-700">{row.supplierName}</td>
                  <td className="px-3 py-2 text-zinc-700">{new Date(row.orderDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    {row.expectedDeliveryDate
                      ? new Date(row.expectedDeliveryDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {formatCurrency(row.totalAmount, row.currency)}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{row.receivedPercent}%</td>
                  <td className="px-3 py-2 text-zinc-700">{row.createdByUserName ?? '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/purchase-orders/${row.id}`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        View
                      </Link>
                      {row.status === 'Draft' ? (
                        <>
                          <Link
                            href={`/purchase-orders/${row.id}/edit`}
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => void onSubmitForApproval(row.id)}
                          >
                            Submit
                          </button>
                        </>
                      ) : null}
                      {row.status === 'Approved' ? (
                        <button
                          type="button"
                          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          onClick={() => void onMarkSent(row.id)}
                        >
                          Mark Sent
                        </button>
                      ) : null}
                      {(row.status === 'Sent' || row.status === 'PartiallyReceived') ? (
                        <Link
                          href={`/purchase-orders/${row.id}/receive`}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          Receive
                        </Link>
                      ) : null}
                      {row.status !== 'Cancelled' && row.status !== 'FullyReceived' ? (
                        <button
                          type="button"
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                          onClick={() => void onCancel(row.id)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
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
            className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>

          <select
            className="rounded border border-zinc-300 px-2 py-1"
            value={limit}
            onChange={(event) => {
              const next = Number(event.target.value);
              setLimit(next);
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
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

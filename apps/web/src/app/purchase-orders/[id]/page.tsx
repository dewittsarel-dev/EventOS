'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { buildLoginRedirectPath } from '../../../components/app-shell/protected-routes';
import { useAppSession } from '../../../components/app-shell/session-context';
import { refreshSession } from '../../../lib/auth-api';
import {
  approvePurchaseOrder,
  archivePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrderReceipts,
  markPurchaseOrderSent,
  restorePurchaseOrder,
  returnPurchaseOrderToDraft,
  submitPurchaseOrderForApproval,
} from '../../../lib/purchase-orders-api';
import type {
  GoodsReceiptRecord,
  PurchaseOrderRecord,
} from '../../../lib/purchase-orders-types';

class AuthRedirectError extends Error {
  constructor() {
    super('AUTH_REDIRECTED');
    this.name = 'AuthRedirectError';
  }
}

function getErrorStatus(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }

  return null;
}

function isAuthFailure(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('token expired') ||
    message.includes('status 401') ||
    message.includes('status 403')
  );
}

function toUserFriendlyMessage(error: unknown, fallback: string) {
  if (isAuthFailure(error)) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
  }).format(amount);
}

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, setSession } = useAppSession();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [receipts, setReceipts] = useState<GoodsReceiptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function redirectToLogin() {
    if (typeof window === 'undefined') {
      return false;
    }

    const loginPath = buildLoginRedirectPath(
      window.location.pathname,
      window.location.search,
    );

    router.replace(loginPath);
    return true;
  }

  async function trySessionRefresh() {
    if (!session.baseUrl || !session.token) {
      return null;
    }

    try {
      const refreshed = await refreshSession(session.baseUrl, session.token);
      setSession({
        baseUrl: session.baseUrl,
        token: refreshed.accessToken,
        organizationId: refreshed.organizationId || session.organizationId,
      });
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  async function runWithSessionRecovery<T>(
    request: (options: { token: string; baseUrl: string }) => Promise<T>,
  ) {
    try {
      return await request({ token: session.token, baseUrl: session.baseUrl });
    } catch (requestError) {
      if (!isAuthFailure(requestError)) {
        throw requestError;
      }

      const refreshedToken = await trySessionRefresh();

      if (refreshedToken) {
        try {
          return await request({ token: refreshedToken, baseUrl: session.baseUrl });
        } catch (retryError) {
          if (!isAuthFailure(retryError)) {
            throw retryError;
          }

          if (redirectToLogin()) {
            throw new AuthRedirectError();
          }

          throw new Error('Your session has expired. Please sign in again.');
        }
      }

      if (redirectToLogin()) {
        throw new AuthRedirectError();
      }

      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  async function loadPage() {
    if (!session.token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [po, poReceipts] = await runWithSessionRecovery((options) =>
        Promise.all([
          getPurchaseOrder(options, id),
          listPurchaseOrderReceipts(options, id),
        ]),
      );
      setPurchaseOrder(po);
      setReceipts(poReceipts);
    } catch (requestError) {
      if (requestError instanceof AuthRedirectError) {
        return;
      }

      setPurchaseOrder(null);
      setReceipts([]);
      setError(toUserFriendlyMessage(requestError, 'Failed to load purchase order.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session.token, session.baseUrl]);

  async function doAction(action: (options: { token: string; baseUrl: string }) => Promise<unknown>, message: string) {
    setError('');
    setSuccess('');

    try {
      await runWithSessionRecovery(action);
      setSuccess(message);
      await loadPage();
    } catch (requestError) {
      if (requestError instanceof AuthRedirectError) {
        return;
      }

      setError(toUserFriendlyMessage(requestError, 'Action failed.'));
    }
  }

  async function onDelete() {
    if (!purchaseOrder) {
      return;
    }

    const confirmed = window.confirm('Delete this purchase order permanently?');
    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await runWithSessionRecovery((options) =>
        deletePurchaseOrder(options, purchaseOrder.id),
      );
      router.replace('/purchase-orders');
    } catch (requestError) {
      if (requestError instanceof AuthRedirectError) {
        return;
      }

      setError(toUserFriendlyMessage(requestError, 'Action failed.'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Purchase Order Details"
        actions={
          <>
            <Link
              href="/purchase-orders"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
            {purchaseOrder?.status === 'Draft' ? (
              <Link
                href={`/purchase-orders/${id}/edit`}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
              >
                Edit Draft
              </Link>
            ) : null}
            {(purchaseOrder?.status === 'Sent' || purchaseOrder?.status === 'PartiallyReceived') ? (
              <Link
                href={`/purchase-orders/${id}/receive`}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
              >
                Receive Goods
              </Link>
            ) : null}
            {purchaseOrder ? (
              purchaseOrder.archivedAt ? (
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                  onClick={() =>
                    void doAction(
                      async (options) => restorePurchaseOrder(options, purchaseOrder.id),
                      'Purchase order restored.',
                    )
                  }
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                  onClick={() =>
                    void doAction(
                      async (options) => archivePurchaseOrder(options, purchaseOrder.id),
                      'Purchase order archived.',
                    )
                  }
                >
                  Archive
                </button>
              )
            ) : null}
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading purchase order...
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {purchaseOrder ? (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{purchaseOrder.purchaseOrderNumber}</h2>
                <p className="text-sm text-zinc-600">Supplier: {purchaseOrder.supplierName}</p>
                <p className="text-sm text-zinc-600">Status: {purchaseOrder.status}</p>
                <p className="text-sm text-zinc-600">Archived: {purchaseOrder.archivedAt ? 'Yes' : 'No'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {purchaseOrder.status === 'Draft' ? (
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                    onClick={() =>
                      void doAction(
                        async (options) =>
                          submitPurchaseOrderForApproval(options, purchaseOrder.id),
                        'Purchase order submitted for approval.',
                      )
                    }
                  >
                    Submit for Approval
                  </button>
                ) : null}

                {purchaseOrder.status === 'PendingApproval' ? (
                  <>
                    <button
                      type="button"
                      className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                      onClick={() =>
                        void doAction(
                          async (options) => approvePurchaseOrder(options, purchaseOrder.id),
                          'Purchase order approved.',
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                      onClick={() =>
                        void doAction(
                          async (options) =>
                            returnPurchaseOrderToDraft(options, purchaseOrder.id),
                          'Purchase order returned to draft.',
                        )
                      }
                    >
                      Return to Draft
                    </button>
                  </>
                ) : null}

                {purchaseOrder.status === 'Approved' ? (
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                    onClick={() =>
                      void doAction(
                        async (options) => markPurchaseOrderSent(options, purchaseOrder.id),
                        'Purchase order marked as sent.',
                      )
                    }
                  >
                    Mark as Sent
                  </button>
                ) : null}

                {purchaseOrder.status !== 'Cancelled' &&
                purchaseOrder.status !== 'FullyReceived' ? (
                  <button
                    type="button"
                    className="rounded border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                    onClick={() =>
                      void doAction(
                        async (options) => cancelPurchaseOrder(options, purchaseOrder.id),
                        'Purchase order cancelled.',
                      )
                    }
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="button"
                  className="rounded border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                  onClick={() => void onDelete()}
                >
                  Delete
                </button>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-sm md:grid-cols-3">
              <div>
                <dt className="font-medium text-zinc-700">Order Date</dt>
                <dd className="text-zinc-600">{new Date(purchaseOrder.orderDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Expected Delivery</dt>
                <dd className="text-zinc-600">
                  {purchaseOrder.expectedDeliveryDate
                    ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Delivery Location</dt>
                <dd className="text-zinc-600">{purchaseOrder.deliveryLocationName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Subtotal</dt>
                <dd className="text-zinc-600">{formatMoney(purchaseOrder.subtotal, purchaseOrder.currency)}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Tax</dt>
                <dd className="text-zinc-600">{formatMoney(purchaseOrder.taxAmount, purchaseOrder.currency)}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Discount</dt>
                <dd className="text-zinc-600">{formatMoney(purchaseOrder.discountAmount, purchaseOrder.currency)}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Grand Total</dt>
                <dd className="text-zinc-600">{formatMoney(purchaseOrder.totalAmount, purchaseOrder.currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Unit Cost</th>
                  <th className="px-3 py-2">VAT %</th>
                  <th className="px-3 py-2">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {purchaseOrder.lineItems.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">{line.supplierProductName}</td>
                    <td className="px-3 py-2">{line.supplierProductBrand ?? '-'}</td>
                    <td className="px-3 py-2">{line.quantityOrdered}</td>
                    <td className="px-3 py-2">{formatMoney(line.unitPrice, purchaseOrder.currency)}</td>
                    <td className="px-3 py-2">{line.taxRate.toFixed(2)}</td>
                    <td className="px-3 py-2">{formatMoney(line.lineTotal, purchaseOrder.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-800">Goods Receipt History</h3>
            {receipts.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No receipts posted yet.</p>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {receipts.map((receipt) => (
                  <Link
                    key={receipt.id}
                    href={`/goods-receipts/${receipt.id}`}
                    className="block rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
                  >
                    {receipt.receiptNumber} · {new Date(receipt.receivedDate).toLocaleDateString()} · {receipt.storageLocationName}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

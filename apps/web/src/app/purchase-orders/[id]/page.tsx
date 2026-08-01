'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrderReceipts,
  markPurchaseOrderSent,
  returnPurchaseOrderToDraft,
  submitPurchaseOrderForApproval,
} from '../../../lib/purchase-orders-api';
import type {
  GoodsReceiptRecord,
  PurchaseOrderRecord,
} from '../../../lib/purchase-orders-types';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
  }).format(amount);
}

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [receipts, setReceipts] = useState<GoodsReceiptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  async function loadPage() {
    if (!session.token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [po, poReceipts] = await Promise.all([
        getPurchaseOrder(requestOptions, id),
        listPurchaseOrderReceipts(requestOptions, id),
      ]);
      setPurchaseOrder(po);
      setReceipts(poReceipts);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load purchase order.',
      );
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

  async function doAction(action: () => Promise<unknown>, message: string) {
    setError('');
    setSuccess('');

    try {
      await action();
      setSuccess(message);
      await loadPage();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Action failed.',
      );
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
              </div>

              <div className="flex flex-wrap gap-2">
                {purchaseOrder.status === 'Draft' ? (
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                    onClick={() =>
                      void doAction(
                        async () => submitPurchaseOrderForApproval(requestOptions, purchaseOrder.id),
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
                          async () => approvePurchaseOrder(requestOptions, purchaseOrder.id),
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
                          async () => returnPurchaseOrderToDraft(requestOptions, purchaseOrder.id),
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
                        async () => markPurchaseOrderSent(requestOptions, purchaseOrder.id),
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
                        async () => cancelPurchaseOrder(requestOptions, purchaseOrder.id),
                        'Purchase order cancelled.',
                      )
                    }
                  >
                    Cancel
                  </button>
                ) : null}
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
                <dt className="font-medium text-zinc-700">Total</dt>
                <dd className="text-zinc-600">{formatMoney(purchaseOrder.totalAmount, purchaseOrder.currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Ordered</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2">Outstanding</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {purchaseOrder.lineItems.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">{line.inventoryItemName}</td>
                    <td className="px-3 py-2">{line.description}</td>
                    <td className="px-3 py-2">{line.quantityOrdered}</td>
                    <td className="px-3 py-2">{line.quantityReceived}</td>
                    <td className="px-3 py-2">{line.quantityOutstanding}</td>
                    <td className="px-3 py-2">{formatMoney(line.unitPrice, purchaseOrder.currency)}</td>
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

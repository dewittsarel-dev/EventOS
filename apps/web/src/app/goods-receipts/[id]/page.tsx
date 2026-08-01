'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { getGoodsReceipt } from '../../../lib/purchase-orders-api';
import type { GoodsReceiptRecord } from '../../../lib/purchase-orders-types';

export default function GoodsReceiptDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();
  const [receipt, setReceipt] = useState<GoodsReceiptRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    async function loadReceipt() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getGoodsReceipt(requestOptions, id);
        setReceipt(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load goods receipt.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReceipt();
  }, [id, requestOptions, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Goods Receipt Details"
        actions={
          <>
            <Link
              href="/goods-receipts"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
            {receipt ? (
              <Link
                href={`/purchase-orders/${receipt.purchaseOrderId}`}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
              >
                Open Purchase Order
              </Link>
            ) : null}
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading goods receipt...
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {receipt ? (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-xl font-semibold text-zinc-900">{receipt.receiptNumber}</h2>
            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
              <div>
                <dt className="font-medium text-zinc-700">Purchase Order</dt>
                <dd className="text-zinc-600">{receipt.purchaseOrderNumber}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Supplier</dt>
                <dd className="text-zinc-600">{receipt.supplierName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Received Date</dt>
                <dd className="text-zinc-600">{new Date(receipt.receivedDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Storage Location</dt>
                <dd className="text-zinc-600">{receipt.storageLocationName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Received By</dt>
                <dd className="text-zinc-600">{receipt.receivedByUserName ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Supplier Delivery Note</dt>
                <dd className="text-zinc-600">{receipt.supplierDeliveryNote ?? '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty Received</th>
                  <th className="px-3 py-2">Qty Accepted</th>
                  <th className="px-3 py-2">Qty Damaged</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {receipt.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">{line.inventoryItemName}</td>
                    <td className="px-3 py-2">{line.quantityReceived}</td>
                    <td className="px-3 py-2">{line.quantityAccepted}</td>
                    <td className="px-3 py-2">{line.quantityDamaged}</td>
                    <td className="px-3 py-2">{line.notes ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

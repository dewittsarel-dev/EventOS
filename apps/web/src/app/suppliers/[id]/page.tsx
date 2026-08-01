'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { getSupplierPurchaseHistory } from '../../../lib/purchase-orders-api';
import type { SupplierPurchaseHistory } from '../../../lib/purchase-orders-types';
import { getSupplier } from '../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../lib/suppliers-types';

export default function SupplierDetailsPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);

  const { session } = useAppSession();
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [history, setHistory] = useState<SupplierPurchaseHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSupplier() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const supplierResponse = await getSupplier(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          supplierId,
        );

        setSupplier(supplierResponse);

        if (session.organizationId) {
          const historyResponse = await getSupplierPurchaseHistory(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            session.organizationId,
            supplierId,
          );

          setHistory(historyResponse);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load supplier.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSupplier();
  }, [session.baseUrl, session.organizationId, session.token, supplierId]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Supplier Details"
        actions={
          <>
            <Link
              href={`/suppliers/${supplierId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Supplier
            </Link>
            <Link
              href="/suppliers"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading supplier...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : supplier ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">{supplier.companyName}</h2>
          <p className="mt-1 text-sm text-zinc-600">Category: {supplier.category}</p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Organization</dt>
              <dd className="text-zinc-600">{supplier.organizationName}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Primary Contact</dt>
              <dd className="text-zinc-600">{supplier.primaryContactName ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Phone</dt>
              <dd className="text-zinc-600">{supplier.phone ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Mobile</dt>
              <dd className="text-zinc-600">{supplier.mobile ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Email</dt>
              <dd className="text-zinc-600">{supplier.email ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Website</dt>
              <dd className="text-zinc-600">{supplier.website ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">City</dt>
              <dd className="text-zinc-600">{supplier.city ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Province</dt>
              <dd className="text-zinc-600">{supplier.province ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Preferred</dt>
              <dd className="text-zinc-600">{supplier.preferredSupplier ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Active</dt>
              <dd className="text-zinc-600">{supplier.active ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Internal Rating</dt>
              <dd className="text-zinc-600">
                {supplier.internalRating !== null ? `${supplier.internalRating}/5` : '-'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Payment Terms</dt>
              <dd className="text-zinc-600">{supplier.preferredPaymentTerms ?? '-'}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Address</p>
            <p className="mt-1 text-sm text-zinc-600">
              {supplier.physicalAddress ?? '-'}
              {supplier.postalCode ? `, ${supplier.postalCode}` : ''}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {supplier.notes || 'No notes provided.'}
            </p>
          </div>

          {history ? (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Supplier Purchase History</h3>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <p className="text-zinc-500">Total Order Value</p>
                  <p className="font-medium text-zinc-800">{history.totalOrderValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Open Purchase Orders</p>
                  <p className="font-medium text-zinc-800">{history.openPurchaseOrders}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Outstanding Deliveries</p>
                  <p className="font-medium text-zinc-800">{history.outstandingDeliveries.toFixed(3)}</p>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <p className="mb-2 font-medium text-zinc-700">Recent Purchase Orders</p>
                {history.purchaseOrders.length === 0 ? (
                  <p className="text-zinc-600">No purchase orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.purchaseOrders.slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        href={`/purchase-orders/${order.id}`}
                        className="block rounded border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-100"
                      >
                        {order.purchaseOrderNumber} · {order.status} · {order.totalAmount.toFixed(2)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Supplier not found.
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { getSupplierPurchaseHistory } from '../../../lib/purchase-orders-api';
import type { SupplierPurchaseHistory } from '../../../lib/purchase-orders-types';
import { listSupplierProducts } from '../../../lib/supplier-products-api';
import type { SupplierProductRecord } from '../../../lib/supplier-products-types';
import { archiveSupplier, getSupplier, updateSupplier } from '../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../lib/suppliers-types';

export default function SupplierDetailsPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);
  const router = useRouter();

  const { session } = useAppSession();
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [history, setHistory] = useState<SupplierPurchaseHistory | null>(null);
  const [products, setProducts] = useState<SupplierProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        const [historyResponse, productsResponse] = await Promise.all([
          getSupplierPurchaseHistory(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            session.organizationId,
            supplierId,
          ),
          listSupplierProducts(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            {
              organizationId: session.organizationId,
              supplierId,
              page: 1,
              limit: 5,
              sortBy: 'productName',
              active: true,
            },
          ),
        ]);

        setHistory(historyResponse);
        setProducts(productsResponse.data);
      } else {
        setHistory(null);
        setProducts([]);
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

  useEffect(() => {
    // Fetching data in this effect is intentional for route-driven refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.baseUrl, session.organizationId, session.token, supplierId]);

  async function onArchive() {
    if (!session.token) {
      setError('Please sign in before changing this supplier.');
      return;
    }

    const confirmed = window.confirm(
      'Archive this supplier? This keeps history and removes it from active supplier lists.',
    );

    if (!confirmed) {
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await archiveSupplier(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
      );

      setSuccess('Supplier archived. Redirecting to suppliers list...');
      router.push('/suppliers');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive supplier.',
      );
    } finally {
      setUpdating(false);
    }
  }

  async function onRestore() {
    if (!session.token) {
      setError('Please sign in before changing this supplier.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await updateSupplier(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        {
          active: true,
        },
      );

      setSuccess('Supplier restored. Redirecting to suppliers list...');
      router.push('/suppliers');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to restore supplier.',
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Supplier Details"
        actions={
          <>
            {supplier && !supplier.active ? (
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                onClick={() => void onRestore()}
                disabled={updating}
              >
                Restore Supplier
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                onClick={() => void onArchive()}
                disabled={updating}
              >
                Archive Supplier
              </button>
            )}
            <Link
              href={`/suppliers/${supplierId}/products`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Products
            </Link>
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
          {success ? <p className="mb-3 text-sm text-emerald-600">{success}</p> : null}
          <h2 className="text-xl font-semibold text-zinc-900">{supplier.companyName}</h2>

          <nav className="mt-4 flex flex-wrap gap-2 text-xs">
            <a href="#company-information" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Company Information
            </a>
            <a href="#contacts" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Contacts
            </a>
            <a href="#products" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Products
            </a>
            <a href="#purchase-orders" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Purchase Orders
            </a>
            <a href="#documents" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Documents
            </a>
            <a href="#performance" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Performance
            </a>
            <a href="#notes" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
              Notes
            </a>
          </nav>

          <section id="company-information" className="mt-5 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Company Information
            </h3>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-700">Supplier Name</dt>
                <dd className="text-zinc-600">{supplier.companyName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Company</dt>
                <dd className="text-zinc-600">{supplier.companyName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Contact Person</dt>
                <dd className="text-zinc-600">{supplier.primaryContactName ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Email</dt>
                <dd className="text-zinc-600">{supplier.email ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Phone</dt>
                <dd className="text-zinc-600">{supplier.phone ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Mobile</dt>
                <dd className="text-zinc-600">{supplier.mobile ?? '-'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-medium text-zinc-700">Website</dt>
                <dd className="break-all text-zinc-600">{supplier.website ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section id="contacts" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Contacts
            </h3>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-700">Primary Contact</dt>
                <dd className="text-zinc-600">{supplier.primaryContactName ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Email</dt>
                <dd className="text-zinc-600">{supplier.email ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Phone</dt>
                <dd className="text-zinc-600">{supplier.phone ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Mobile</dt>
                <dd className="text-zinc-600">{supplier.mobile ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section id="products" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Products
              </h3>
              <Link
                href={`/suppliers/${supplierId}/products`}
                className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
              >
                Manage Products
              </Link>
            </div>

            {products.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No active products found for this supplier.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Product Name</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Brand</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Cost Price</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Lead Time</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t border-zinc-200">
                        <td className="px-3 py-2 text-zinc-900">{product.productName}</td>
                        <td className="px-3 py-2 text-zinc-700">{product.category}</td>
                        <td className="px-3 py-2 text-zinc-700">{product.brand ?? '-'}</td>
                        <td className="px-3 py-2 text-zinc-700">{product.costPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-zinc-700">
                          {product.leadTimeDays === null ? '-' : `${product.leadTimeDays} days`}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{product.active ? 'Active' : 'Archived'}</td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/suppliers/${supplierId}/products/${product.id}`}
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
          </section>

          <section className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Address
            </h3>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div className="md:col-span-2">
                <dt className="font-medium text-zinc-700">Street</dt>
                <dd className="text-zinc-600">{supplier.physicalAddress ?? '-'}</dd>
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
                <dt className="font-medium text-zinc-700">Postal Code</dt>
                <dd className="text-zinc-600">{supplier.postalCode ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Country</dt>
                <dd className="text-zinc-600">-</dd>
              </div>
            </dl>
          </section>

          <section id="performance" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Performance
            </h3>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-700">Supplier Category</dt>
                <dd className="text-zinc-600">{supplier.category}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Preferred Supplier</dt>
                <dd className="text-zinc-600">{supplier.preferredSupplier ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">VAT Number</dt>
                <dd className="text-zinc-600">{supplier.vatNumber ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Registration Number</dt>
                <dd className="text-zinc-600">{supplier.registrationNumber ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Payment Terms</dt>
                <dd className="text-zinc-600">{supplier.preferredPaymentTerms ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Internal Rating</dt>
                <dd className="text-zinc-600">
                  {supplier.internalRating !== null ? `${supplier.internalRating}/5` : '-'}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-medium text-zinc-700">Preferred Product Coverage</dt>
                <dd className="text-zinc-600">{products.filter((product) => product.preferredProduct).length} preferred product(s)</dd>
              </div>
            </dl>
          </section>

          <section id="purchase-orders" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              System
            </h3>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-700">Created Date</dt>
                <dd className="text-zinc-600">{new Date(supplier.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Updated Date</dt>
                <dd className="text-zinc-600">{new Date(supplier.updatedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Organization Name</dt>
                <dd className="text-zinc-600">{supplier.organizationName}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Active / Archived Status</dt>
                <dd className="text-zinc-600">{supplier.active ? 'Active' : 'Archived'}</dd>
              </div>
            </dl>
          </section>

          <section id="documents" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Documents
            </h3>
            <p className="mt-3 text-sm text-zinc-600">
              Supplier documents module is available from purchase orders and goods receipt workflows.
            </p>
          </section>

          <section id="notes" className="mt-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Notes
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600">
              {supplier.notes || 'No notes provided.'}
            </p>
          </section>

          {history ? (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Purchase Orders</h3>
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

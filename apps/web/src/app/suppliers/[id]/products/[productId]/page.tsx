'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  archiveSupplierProduct,
  getSupplierProduct,
  restoreSupplierProduct,
} from '@/lib/supplier-products-api';
import type { SupplierProductRecord } from '@/lib/supplier-products-types';

function valueOrDash(value: string | number | null) {
  if (value === null || value === '') {
    return '-';
  }

  return String(value);
}

export default function SupplierProductDetailsPage() {
  const params = useParams<{ id: string; productId: string }>();
  const supplierId = String(params.id);
  const productId = String(params.productId);
  const router = useRouter();

  const { session } = useAppSession();
  const [product, setProduct] = useState<SupplierProductRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getSupplierProduct(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          supplierId,
          productId,
          session.organizationId,
        );

        setProduct(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load product.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProduct();
  }, [productId, session.baseUrl, session.organizationId, session.token, supplierId]);

  async function onArchive() {
    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    const confirmed = window.confirm('Archive this product?');

    if (!confirmed) {
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const updated = await archiveSupplierProduct(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        productId,
        session.organizationId,
      );

      setProduct(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive product.',
      );
    } finally {
      setUpdating(false);
    }
  }

  async function onRestore() {
    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const updated = await restoreSupplierProduct(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        productId,
        session.organizationId,
      );

      setProduct(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to restore product.',
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Supplier Product Details"
        actions={
          <>
            {product?.active ? (
              <button
                type="button"
                className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                onClick={() => void onArchive()}
                disabled={updating}
              >
                Archive Product
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                onClick={() => void onRestore()}
                disabled={updating}
              >
                Restore Product
              </button>
            )}
            <Link
              href={`/suppliers/${supplierId}/products/${productId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Product
            </Link>
            <Link
              href={`/suppliers/${supplierId}/products`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Products
            </Link>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
              onClick={() => router.push(`/suppliers/${supplierId}`)}
            >
              Back to Supplier
            </button>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading product...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : product ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">{product.productName}</h2>
          <p className="mt-1 text-sm text-zinc-600">Supplier: {product.supplierName}</p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Detail label="Category" value={product.category} />
            <Detail label="Brand" value={valueOrDash(product.brand)} />
            <Detail label="SKU" value={valueOrDash(product.sku)} />
            <Detail label="Unit" value={product.unit} />
            <Detail label="Cost Price" value={product.costPrice.toFixed(2)} />
            <Detail
              label="Selling Price"
              value={
                product.sellingPrice === null
                  ? '-'
                  : product.sellingPrice.toFixed(2)
              }
            />
            <Detail
              label="VAT %"
              value={
                product.vatPercent === null ? '-' : product.vatPercent.toString()
              }
            />
            <Detail
              label="Lead Time"
              value={
                product.leadTimeDays === null
                  ? '-'
                  : `${product.leadTimeDays} days`
              }
            />
            <Detail
              label="Minimum Order Quantity"
              value={valueOrDash(product.minimumOrderQuantity)}
            />
            <Detail
              label="Preferred Product"
              value={product.preferredProduct ? 'Yes' : 'No'}
            />
            <Detail label="Active" value={product.active ? 'Yes' : 'No'} />
            <Detail label="Organization" value={product.organizationName} />
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {product.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {product.notes || 'No notes provided.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Product not found.
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-zinc-700">{label}</dt>
      <dd className="text-zinc-600">{value}</dd>
    </div>
  );
}

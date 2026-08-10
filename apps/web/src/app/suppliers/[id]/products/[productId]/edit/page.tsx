'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  SupplierProductForm,
  type SupplierProductFormValues,
} from '@/components/suppliers/supplier-product-form';
import {
  getSupplierProduct,
  updateSupplierProduct,
} from '@/lib/supplier-products-api';
import {
  DEFAULT_SUPPLIER_PRODUCT_FORM,
  formToSupplierProductPayload,
  supplierProductToForm,
} from '@/lib/supplier-product-form';
import type { SupplierProductRecord } from '@/lib/supplier-products-types';

export default function EditSupplierProductPage() {
  const params = useParams<{ id: string; productId: string }>();
  const supplierId = String(params.id);
  const productId = String(params.productId);
  const router = useRouter();

  const { session } = useAppSession();

  const [product, setProduct] = useState<SupplierProductRecord | null>(null);
  const [form, setForm] = useState<SupplierProductFormValues>(DEFAULT_SUPPLIER_PRODUCT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setForm(supplierProductToForm(response));
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    if (!form.productName.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!form.costPrice.trim()) {
      setError('Cost price is required.');
      return;
    }

    setSaving(true);

    try {
      await updateSupplierProduct(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        productId,
        session.organizationId,
        formToSupplierProductPayload(form),
      );

      setSuccess('Product updated successfully. Redirecting...');
      router.push(`/suppliers/${supplierId}/products/${productId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update product.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Supplier Product"
        actions={
          <Link
            href={`/suppliers/${supplierId}/products/${productId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading product...
        </div>
      ) : product ? (
        <SupplierProductForm
          mode="edit"
          values={form}
          saving={saving}
          error={error}
          success={success}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Product not found.
        </div>
      )}
    </div>
  );
}

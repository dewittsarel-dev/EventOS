'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  SupplierProductForm,
  type SupplierProductFormValues,
} from '@/components/suppliers/supplier-product-form';
import { createSupplierProduct } from '@/lib/supplier-products-api';

const defaultForm: SupplierProductFormValues = {
  productName: '',
  sku: '',
  category: 'Other',
  brand: '',
  description: '',
  unit: 'Each',
  costPrice: '',
  sellingPrice: '',
  vatPercent: '',
  leadTimeDays: '',
  minimumOrderQuantity: '',
  preferredProduct: false,
  active: true,
  notes: '',
};

export default function NewSupplierProductPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);
  const router = useRouter();

  const { session } = useAppSession();
  const [form, setForm] = useState<SupplierProductFormValues>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const created = await createSupplierProduct(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        {
          organizationId: session.organizationId,
          productName: form.productName.trim(),
          sku: form.sku.trim() || undefined,
          category: form.category,
          brand: form.brand.trim() || undefined,
          description: form.description.trim() || undefined,
          unit: form.unit,
          costPrice: Number(form.costPrice),
          sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
          vatPercent: form.vatPercent ? Number(form.vatPercent) : undefined,
          leadTimeDays: form.leadTimeDays
            ? Number.parseInt(form.leadTimeDays, 10)
            : undefined,
          minimumOrderQuantity: form.minimumOrderQuantity
            ? Number(form.minimumOrderQuantity)
            : undefined,
          preferredProduct: form.preferredProduct,
          active: form.active,
          notes: form.notes.trim() || undefined,
        },
      );

      setSuccess('Product created successfully. Redirecting...');
      router.push(`/suppliers/${supplierId}/products/${created.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create product.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Supplier Product"
        actions={
          <Link
            href={`/suppliers/${supplierId}/products`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Products
          </Link>
        }
      />

      <SupplierProductForm
        mode="create"
        values={form}
        saving={saving}
        error={error}
        success={success}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  SupplierForm,
  type SupplierFormValues,
} from '../../../../components/suppliers/supplier-form';
import { getSupplier, updateSupplier } from '../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../lib/suppliers-types';

const defaultForm: SupplierFormValues = {
  companyName: '',
  category: 'Other',
  primaryContactName: '',
  phone: '',
  mobile: '',
  email: '',
  website: '',
  physicalAddress: '',
  city: '',
  province: '',
  postalCode: '',
  vatNumber: '',
  registrationNumber: '',
  preferredSupplier: false,
  active: true,
  preferredPaymentTerms: '',
  internalRating: '',
  notes: '',
};

function supplierToForm(supplier: SupplierRecord): SupplierFormValues {
  return {
    companyName: supplier.companyName,
    category: supplier.category,
    primaryContactName: supplier.primaryContactName ?? '',
    phone: supplier.phone ?? '',
    mobile: supplier.mobile ?? '',
    email: supplier.email ?? '',
    website: supplier.website ?? '',
    physicalAddress: supplier.physicalAddress ?? '',
    city: supplier.city ?? '',
    province: supplier.province ?? '',
    postalCode: supplier.postalCode ?? '',
    vatNumber: supplier.vatNumber ?? '',
    registrationNumber: supplier.registrationNumber ?? '',
    preferredSupplier: supplier.preferredSupplier,
    active: supplier.active,
    preferredPaymentTerms: supplier.preferredPaymentTerms ?? '',
    internalRating:
      supplier.internalRating === null ? '' : String(supplier.internalRating),
    notes: supplier.notes ?? '',
  };
}

export default function EditSupplierPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);

  const { session } = useAppSession();
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [form, setForm] = useState<SupplierFormValues>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadSupplier() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getSupplier(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          supplierId,
        );

        setSupplier(response);
        setForm(supplierToForm(response));
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
  }, [session.baseUrl, session.token, supplierId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please save a Bearer token first.');
      return;
    }

    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);

    try {
      await updateSupplier(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        supplierId,
        {
          companyName: form.companyName.trim(),
          category: form.category,
          primaryContactName: form.primaryContactName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          mobile: form.mobile.trim() || undefined,
          email: form.email.trim() || undefined,
          website: form.website.trim() || undefined,
          physicalAddress: form.physicalAddress.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          vatNumber: form.vatNumber.trim() || undefined,
          registrationNumber: form.registrationNumber.trim() || undefined,
          preferredSupplier: form.preferredSupplier,
          active: form.active,
          preferredPaymentTerms: form.preferredPaymentTerms.trim() || undefined,
          internalRating: form.internalRating
            ? Number.parseInt(form.internalRating, 10)
            : undefined,
          notes: form.notes.trim() || undefined,
        },
      );

      setSuccess('Supplier updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update supplier.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Supplier"
        actions={
          <Link
            href={`/suppliers/${supplierId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading supplier...
        </div>
      ) : supplier ? (
        <SupplierForm
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
          Supplier not found.
        </div>
      )}
    </div>
  );
}

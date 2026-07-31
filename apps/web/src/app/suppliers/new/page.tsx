'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  SupplierForm,
  type SupplierFormValues,
} from '../../../components/suppliers/supplier-form';
import { createSupplier } from '../../../lib/suppliers-api';

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

export default function NewSupplierPage() {
  const { session } = useAppSession();

  const [form, setForm] = useState<SupplierFormValues>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);

    try {
      await createSupplier(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
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

      setSuccess('Supplier created successfully.');
      setForm(defaultForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create supplier.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Supplier"
        actions={
          <Link
            href="/suppliers"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Suppliers
          </Link>
        }
      />

      <SupplierForm
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

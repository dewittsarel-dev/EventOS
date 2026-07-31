'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  StorageLocationForm,
  type StorageLocationFormValues,
} from '../../../../components/inventory/storage-location-form';
import { createStorageLocation } from '../../../../lib/inventory-api';

const defaultForm: StorageLocationFormValues = {
  name: '',
  code: '',
  physicalAddress: '',
  city: '',
  province: '',
  notes: '',
  active: true,
};

export default function NewStorageLocationPage() {
  const { session } = useAppSession();

  const [form, setForm] = useState<StorageLocationFormValues>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!session.organizationId) {
      setError('Please select an organization in the header.');
      return;
    }

    if (!form.name.trim()) {
      setError('Location name is required.');
      return;
    }

    if (!form.code.trim()) {
      setError('Location code is required.');
      return;
    }

    setSaving(true);

    try {
      await createStorageLocation(requestOptions, {
        organizationId: session.organizationId,
        name: form.name.trim(),
        code: form.code.trim(),
        physicalAddress: form.physicalAddress.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        notes: form.notes.trim() || undefined,
        active: form.active,
      });

      setSuccess('Storage location created successfully.');
      setForm(defaultForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create storage location.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Storage Location"
        description="Register a warehouse or stock-holding location."
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to create storage locations.
        </div>
      ) : (
        <StorageLocationForm
          mode="create"
          values={form}
          saving={saving}
          error={error}
          success={success}
          cancelHref="/inventory/locations"
          onChange={setForm}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

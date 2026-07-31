'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  StorageLocationForm,
  type StorageLocationFormValues,
} from '../../../../components/inventory/storage-location-form';
import {
  getStorageLocation,
  updateStorageLocation,
} from '../../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../../lib/inventory-types';

function locationToForm(location: StorageLocationRecord): StorageLocationFormValues {
  return {
    name: location.name,
    code: location.code,
    physicalAddress: location.physicalAddress ?? '',
    city: location.city ?? '',
    province: location.province ?? '',
    notes: location.notes ?? '',
    active: location.active,
  };
}

export default function StorageLocationDetailsPage() {
  const params = useParams<{ id: string }>();
  const locationId = String(params.id);

  const { session } = useAppSession();

  const [location, setLocation] = useState<StorageLocationRecord | null>(null);
  const [form, setForm] = useState<StorageLocationFormValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getStorageLocation(requestOptions, locationId);

        if (!cancelled) {
          setLocation(response);
          setForm(locationToForm(response));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load storage location.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLocation();

    return () => {
      cancelled = true;
    };
  }, [locationId, requestOptions, session.token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setError('');
    setSuccess('');

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
      const updated = await updateStorageLocation(requestOptions, locationId, {
        name: form.name.trim(),
        code: form.code.trim(),
        physicalAddress: form.physicalAddress.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        notes: form.notes.trim() || undefined,
        active: form.active,
      });

      setLocation(updated);
      setForm(locationToForm(updated));
      setSuccess('Storage location updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update storage location.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Storage Location Details"
        actions={
          <Link
            href="/inventory/locations"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Locations
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading storage location...
        </div>
      ) : location && form ? (
        <StorageLocationForm
          mode="edit"
          values={form}
          saving={saving}
          error={error}
          success={success}
          cancelHref="/inventory/locations"
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          {error || 'Storage location not found.'}
        </div>
      )}
    </div>
  );
}

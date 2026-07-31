'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  deleteStorageLocation,
  listStorageLocations,
  updateStorageLocation,
} from '../../../lib/inventory-api';
import type { StorageLocationRecord } from '../../../lib/inventory-types';

export default function StorageLocationsPage() {
  const { session } = useAppSession();

  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  const loadLocations = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setLocations([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listStorageLocations(requestOptions, {
        organizationId: session.organizationId,
        search: search.trim() || undefined,
        page: 1,
        limit: 100,
      });

      setLocations(response.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load storage locations.',
      );
    } finally {
      setLoading(false);
    }
  }, [canLoad, requestOptions, search, session.organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLocations();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLocations]);

  async function onDelete(id: string) {
    const confirmed = window.confirm('Delete this storage location?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteStorageLocation(requestOptions, id);
      setSuccess('Storage location deleted.');
      await loadLocations();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete storage location.',
      );
    }
  }

  async function onToggleActive(location: StorageLocationRecord) {
    setError('');
    setSuccess('');

    try {
      await updateStorageLocation(requestOptions, location.id, {
        active: !location.active,
      });

      setSuccess('Storage location status updated.');
      await loadLocations();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update storage location status.',
      );
    }
  }

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadLocations();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Storage Locations"
        description="Manage warehouses and stock holding locations."
        actions={
          <Link
            href="/inventory/locations/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Create Location
          </Link>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage storage locations.
        </div>
      ) : null}

      <form
        onSubmit={onSearchSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, code, city or province"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Apply
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading storage locations...
        </div>
      ) : canLoad && locations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No storage locations found. Create a storage location before adding stock.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Code</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">City</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Province</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2 text-zinc-900">{location.name}</td>
                  <td className="px-3 py-2 text-zinc-700">{location.code}</td>
                  <td className="px-3 py-2 text-zinc-700">{location.city ?? '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">{location.province ?? '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">{location.active ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/inventory/locations/${location.id}`}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void onToggleActive(location);
                        }}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        {location.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void onDelete(location.id);
                        }}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

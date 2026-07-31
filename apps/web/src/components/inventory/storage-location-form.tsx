'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';

export type StorageLocationFormValues = {
  name: string;
  code: string;
  physicalAddress: string;
  city: string;
  province: string;
  notes: string;
  active: boolean;
};

type StorageLocationFormProps = {
  mode: 'create' | 'edit';
  values: StorageLocationFormValues;
  saving: boolean;
  error: string;
  success: string;
  cancelHref: string;
  onChange: (next: StorageLocationFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function StorageLocationForm({
  mode,
  values,
  saving,
  error,
  success,
  cancelHref,
  onChange,
  onSubmit,
}: StorageLocationFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Storage Location' : 'Edit Storage Location'}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-zinc-700">
          Name
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            maxLength={140}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Code
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.code}
            onChange={(event) => onChange({ ...values, code: event.target.value })}
            maxLength={50}
            required
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Physical Address
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.physicalAddress}
            onChange={(event) =>
              onChange({ ...values, physicalAddress: event.target.value })
            }
            maxLength={240}
          />
        </label>

        <label className="text-sm text-zinc-700">
          City
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.city}
            onChange={(event) => onChange({ ...values, city: event.target.value })}
            maxLength={120}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Province
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.province}
            onChange={(event) =>
              onChange({ ...values, province: event.target.value })
            }
            maxLength={120}
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={2000}
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) => onChange({ ...values, active: event.target.checked })}
            className="h-4 w-4"
          />
          Active
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Location'
              : 'Save Location'}
        </button>
      </div>
    </form>
  );
}

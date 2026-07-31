'use client';

import type { FormEvent } from 'react';
import {
  SUPPLIER_CATEGORIES,
  type SupplierCategory,
} from '../../lib/suppliers-types';

export type SupplierFormValues = {
  companyName: string;
  category: SupplierCategory;
  primaryContactName: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  physicalAddress: string;
  city: string;
  province: string;
  postalCode: string;
  vatNumber: string;
  registrationNumber: string;
  preferredSupplier: boolean;
  active: boolean;
  preferredPaymentTerms: string;
  internalRating: string;
  notes: string;
};

type SupplierFormProps = {
  mode: 'create' | 'edit';
  values: SupplierFormValues;
  saving: boolean;
  error: string;
  success: string;
  onChange: (next: SupplierFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SupplierForm({
  mode,
  values,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}: SupplierFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Supplier' : 'Edit Supplier'}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-zinc-700 md:col-span-2">
          Company Name
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.companyName}
            onChange={(event) =>
              onChange({ ...values, companyName: event.target.value })
            }
            maxLength={160}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Category
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.category}
            onChange={(event) =>
              onChange({
                ...values,
                category: event.target.value as SupplierCategory,
              })
            }
            required
          >
            {SUPPLIER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Primary Contact Name
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.primaryContactName}
            onChange={(event) =>
              onChange({ ...values, primaryContactName: event.target.value })
            }
            maxLength={120}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Phone
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.phone}
            onChange={(event) => onChange({ ...values, phone: event.target.value })}
            maxLength={40}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Mobile
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.mobile}
            onChange={(event) => onChange({ ...values, mobile: event.target.value })}
            maxLength={40}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.email}
            onChange={(event) => onChange({ ...values, email: event.target.value })}
            maxLength={160}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Website
          <input
            type="url"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.website}
            onChange={(event) => onChange({ ...values, website: event.target.value })}
            placeholder="https://example.com"
            maxLength={240}
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
            maxLength={80}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Province
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.province}
            onChange={(event) => onChange({ ...values, province: event.target.value })}
            maxLength={80}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Postal Code
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.postalCode}
            onChange={(event) =>
              onChange({ ...values, postalCode: event.target.value })
            }
            maxLength={20}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Internal Rating (1-5)
          <input
            type="number"
            min={1}
            max={5}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.internalRating}
            onChange={(event) =>
              onChange({ ...values, internalRating: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          VAT Number
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.vatNumber}
            onChange={(event) => onChange({ ...values, vatNumber: event.target.value })}
            maxLength={40}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Registration Number
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.registrationNumber}
            onChange={(event) =>
              onChange({ ...values, registrationNumber: event.target.value })
            }
            maxLength={60}
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Preferred Payment Terms
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.preferredPaymentTerms}
            onChange={(event) =>
              onChange({ ...values, preferredPaymentTerms: event.target.value })
            }
            maxLength={120}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.preferredSupplier}
            onChange={(event) =>
              onChange({ ...values, preferredSupplier: event.target.checked })
            }
          />
          Preferred Supplier
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) =>
              onChange({ ...values, active: event.target.checked })
            }
          />
          Active
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            rows={4}
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={2000}
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-4">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Supplier'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

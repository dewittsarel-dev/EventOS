'use client';

import type { FormEvent } from 'react';
import {
  SUPPLIER_PRODUCT_CATEGORIES,
  SUPPLIER_PRODUCT_UNITS,
  type SupplierProductCategory,
  type SupplierProductUnit,
} from '../../lib/supplier-products-types';

export type SupplierProductFormValues = {
  productName: string;
  sku: string;
  category: SupplierProductCategory;
  brand: string;
  description: string;
  unit: SupplierProductUnit;
  costPrice: string;
  sellingPrice: string;
  vatPercent: string;
  leadTimeDays: string;
  minimumOrderQuantity: string;
  preferredProduct: boolean;
  active: boolean;
  notes: string;
};

type SupplierProductFormProps = {
  mode: 'create' | 'edit';
  values: SupplierProductFormValues;
  saving: boolean;
  error: string;
  success: string;
  onChange: (next: SupplierProductFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SupplierProductForm({
  mode,
  values,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}: SupplierProductFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Product' : 'Edit Product'}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-zinc-700 md:col-span-2">
          Product Name
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.productName}
            onChange={(event) =>
              onChange({ ...values, productName: event.target.value })
            }
            maxLength={180}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          SKU
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.sku}
            onChange={(event) => onChange({ ...values, sku: event.target.value })}
            maxLength={80}
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
                category: event.target.value as SupplierProductCategory,
              })
            }
            required
          >
            {SUPPLIER_PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Brand
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.brand}
            onChange={(event) => onChange({ ...values, brand: event.target.value })}
            maxLength={120}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Unit
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.unit}
            onChange={(event) =>
              onChange({ ...values, unit: event.target.value as SupplierProductUnit })
            }
            required
          >
            {SUPPLIER_PRODUCT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Cost Price
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.costPrice}
            onChange={(event) => onChange({ ...values, costPrice: event.target.value })}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Selling Price
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.sellingPrice}
            onChange={(event) =>
              onChange({ ...values, sellingPrice: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          VAT %
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.vatPercent}
            onChange={(event) => onChange({ ...values, vatPercent: event.target.value })}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Lead Time (days)
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.leadTimeDays}
            onChange={(event) =>
              onChange({ ...values, leadTimeDays: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          Minimum Order Quantity
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.minimumOrderQuantity}
            onChange={(event) =>
              onChange({ ...values, minimumOrderQuantity: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Description
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.description}
            onChange={(event) =>
              onChange({ ...values, description: event.target.value })
            }
            maxLength={2000}
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

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.preferredProduct}
            onChange={(event) =>
              onChange({ ...values, preferredProduct: event.target.checked })
            }
          />
          Preferred Product
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) => onChange({ ...values, active: event.target.checked })}
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

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

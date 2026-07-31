'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import {
  INVENTORY_ITEM_TYPES,
  UNIT_OF_MEASURE_OPTIONS,
  type InventoryCategoryRecord,
  type InventoryItemType,
  type UnitOfMeasure,
} from '../../lib/inventory-types';
import type { SupplierRecord } from '../../lib/suppliers-types';

export type InventoryItemFormValues = {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  preferredSupplierId: string;
  itemType: InventoryItemType;
  unitOfMeasure: UnitOfMeasure;
  costPrice: string;
  replacementValue: string;
  rentalPrice: string;
  sellingPrice: string;
  taxable: boolean;
  active: boolean;
  trackQuantity: boolean;
  trackSerialNumbers: boolean;
  minimumStock: string;
  reorderLevel: string;
  notes: string;
};

type InventoryItemFormProps = {
  mode: 'create' | 'edit';
  values: InventoryItemFormValues;
  categories: InventoryCategoryRecord[];
  suppliers: SupplierRecord[];
  saving: boolean;
  error: string;
  success: string;
  canSubmit: boolean;
  cancelHref: string;
  onChange: (next: InventoryItemFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function InventoryItemForm({
  mode,
  values,
  categories,
  suppliers,
  saving,
  error,
  success,
  canSubmit,
  cancelHref,
  onChange,
  onSubmit,
}: InventoryItemFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Inventory Item' : 'Edit Inventory Item'}
      </h2>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">1. Item Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            SKU
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.sku}
              onChange={(event) => onChange({ ...values, sku: event.target.value })}
              maxLength={80}
              required
            />
          </label>

          <label className="text-sm text-zinc-700">
            Barcode
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.barcode}
              onChange={(event) =>
                onChange({ ...values, barcode: event.target.value })
              }
              maxLength={120}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Item Name
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.name}
              onChange={(event) => onChange({ ...values, name: event.target.value })}
              maxLength={180}
              required
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Description
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.description}
              onChange={(event) =>
                onChange({ ...values, description: event.target.value })
              }
              maxLength={2000}
            />
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">2. Classification</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-zinc-700">
            Category
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.categoryId}
              onChange={(event) =>
                onChange({ ...values, categoryId: event.target.value })
              }
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Item Type
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.itemType}
              onChange={(event) =>
                onChange({
                  ...values,
                  itemType: event.target.value as InventoryItemType,
                })
              }
              required
            >
              {INVENTORY_ITEM_TYPES.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Unit of Measure
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.unitOfMeasure}
              onChange={(event) =>
                onChange({
                  ...values,
                  unitOfMeasure: event.target.value as UnitOfMeasure,
                })
              }
              required
            >
              {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">3. Pricing</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Cost Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.costPrice}
              onChange={(event) =>
                onChange({ ...values, costPrice: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Replacement Value
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.replacementValue}
              onChange={(event) =>
                onChange({ ...values, replacementValue: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Rental Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.rentalPrice}
              onChange={(event) =>
                onChange({ ...values, rentalPrice: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Selling Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.sellingPrice}
              onChange={(event) =>
                onChange({ ...values, sellingPrice: event.target.value })
              }
            />
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">4. Stock Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Minimum Stock
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.minimumStock}
              onChange={(event) =>
                onChange({ ...values, minimumStock: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Reorder Level
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.reorderLevel}
              onChange={(event) =>
                onChange({ ...values, reorderLevel: event.target.value })
              }
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={values.trackQuantity}
              onChange={(event) =>
                onChange({ ...values, trackQuantity: event.target.checked })
              }
              className="h-4 w-4"
            />
            Track Quantity
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={values.trackSerialNumbers}
              onChange={(event) =>
                onChange({
                  ...values,
                  trackSerialNumbers: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Track Serial Numbers
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">5. Supplier and Status</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Preferred Supplier
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.preferredSupplierId}
              onChange={(event) =>
                onChange({
                  ...values,
                  preferredSupplierId: event.target.value,
                })
              }
            >
              <option value="">No preferred supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 pt-6">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={values.taxable}
                onChange={(event) =>
                  onChange({ ...values, taxable: event.target.checked })
                }
                className="h-4 w-4"
              />
              Taxable
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={values.active}
                onChange={(event) =>
                  onChange({ ...values, active: event.target.checked })
                }
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">6. Notes</h3>
        <label className="text-sm text-zinc-700">
          Notes
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={2000}
          />
        </label>
      </section>

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
          disabled={saving || !canSubmit}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Item'
              : 'Save Item'}
        </button>
      </div>
    </form>
  );
}

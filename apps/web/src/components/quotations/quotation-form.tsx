'use client';

import type { FormEvent } from 'react';
import {
  QUOTATION_STATUSES,
  type ContactOption,
  type EventOption,
  type QuotationItemPayload,
  type QuotationStatus,
} from '@/lib/quotations-types';

export type QuotationFormValues = {
  contactId: string;
  eventId: string;
  title: string;
  notes: string;
  issueDate: string;
  expiryDate: string;
  discountCents: number;
  taxRatePercent: number;
  status: QuotationStatus;
  items: QuotationItemPayload[];
};

type QuotationFormProps = {
  mode: 'create' | 'edit';
  values: QuotationFormValues;
  contacts: ContactOption[];
  events: EventOption[];
  saving: boolean;
  error: string;
  success: string;
  onChange: (next: QuotationFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

export function QuotationForm({
  mode,
  values,
  contacts,
  events,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}: QuotationFormProps) {
  const subtotal = values.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const safeDiscount = Math.min(values.discountCents || 0, subtotal);
  const taxable = subtotal - safeDiscount;
  const tax = Math.round((taxable * (values.taxRatePercent || 0)) / 100);
  const total = taxable + tax;

  function setItem(index: number, next: QuotationItemPayload) {
    const items = values.items.map((item, currentIndex) =>
      currentIndex === index ? next : item,
    );
    onChange({ ...values, items });
  }

  function addItem() {
    onChange({
      ...values,
      items: [
        ...values.items,
        {
          description: '',
          quantity: 1,
          unitPriceCents: 0,
        },
      ],
    });
  }

  function removeItem(index: number) {
    const items = values.items.filter((_, currentIndex) => currentIndex !== index);
    onChange({
      ...values,
      items: items.length
        ? items
        : [
            {
              description: '',
              quantity: 1,
              unitPriceCents: 0,
            },
          ],
    });
  }

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Quotation' : 'Edit Quotation'}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-zinc-700">
          Contact
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.contactId}
            onChange={(event) =>
              onChange({ ...values, contactId: event.target.value })
            }
            required
          >
            <option value="">Select contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName ?? ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Event
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.eventId}
            onChange={(event) => onChange({ ...values, eventId: event.target.value })}
            required
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Title
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.title}
            onChange={(event) => onChange({ ...values, title: event.target.value })}
            maxLength={150}
            required
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            rows={3}
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={1500}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Issue Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.issueDate}
            onChange={(event) =>
              onChange({ ...values, issueDate: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          Expiry Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.expiryDate}
            onChange={(event) =>
              onChange({ ...values, expiryDate: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          Discount (cents)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.discountCents}
            onChange={(event) =>
              onChange({
                ...values,
                discountCents: Number(event.target.value) || 0,
              })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          Tax Rate (%)
          <input
            type="number"
            min={0}
            max={100}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.taxRatePercent}
            onChange={(event) =>
              onChange({
                ...values,
                taxRatePercent: Number(event.target.value) || 0,
              })
            }
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Status
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.status}
            onChange={(event) =>
              onChange({
                ...values,
                status: event.target.value as QuotationStatus,
              })
            }
          >
            {QUOTATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">Line Items</h3>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100"
            onClick={addItem}
          >
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {values.items.map((item, index) => (
            <div
              key={`${index}-${item.description}`}
              className="grid gap-2 rounded-lg border border-zinc-200 p-3 md:grid-cols-12"
            >
              <input
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-6"
                placeholder="Description"
                value={item.description}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    description: event.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                min={1}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
                placeholder="Qty"
                value={item.quantity}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    quantity: Number(event.target.value) || 1,
                  })
                }
                required
              />

              <input
                type="number"
                min={0}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-3"
                placeholder="Unit price cents"
                value={item.unitPriceCents}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    unitPriceCents: Number(event.target.value) || 0,
                  })
                }
                required
              />

              <button
                type="button"
                className="rounded-md border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50 md:col-span-1"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>

              <div className="text-xs text-zinc-600 md:col-span-12">
                Line total: {formatCurrency(item.quantity * item.unitPriceCents)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm md:max-w-md">
        <p>Subtotal: {formatCurrency(subtotal)}</p>
        <p>Discount: -{formatCurrency(safeDiscount)}</p>
        <p>Tax: {formatCurrency(tax)}</p>
        <p className="font-semibold text-zinc-900">Total: {formatCurrency(total)}</p>
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
              ? 'Create Quotation'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

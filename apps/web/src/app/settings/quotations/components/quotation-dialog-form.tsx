'use client';

import { DialogShell } from '../../users/components/dialog-shell';
import type {
  ContactOption,
  EventOption,
  QuotationItemPayload,
  QuotationStatus,
} from '../../../../lib/quotations-types';

export type QuotationDialogFormValues = {
  contactId: string;
  eventId: string;
  title: string;
  notes: string;
  issueDate: string;
  validUntil: string;
  taxRatePercent: number;
  status: QuotationStatus;
  items: QuotationItemPayload[];
};

type QuotationDialogFormProps = {
  mode: 'create' | 'edit';
  values: QuotationDialogFormValues;
  contacts: ContactOption[];
  events: EventOption[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: () => void;
  onChange: (next: QuotationDialogFormValues) => void;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

function lineTotal(item: QuotationItemPayload) {
  const base = Math.max(0, item.quantity) * Math.max(0, item.unitPriceCents);
  const discountPercent = Math.max(0, Math.min(100, item.discountPercent ?? 0));
  const discountAmount = Math.round((base * discountPercent) / 100);
  return Math.max(0, base - discountAmount);
}

export function QuotationDialogForm({
  mode,
  values,
  contacts,
  events,
  busy,
  error,
  onClose,
  onSave,
  onChange,
}: QuotationDialogFormProps) {
  const subtotal = values.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const vat = Math.round((subtotal * (values.taxRatePercent || 0)) / 100);
  const total = subtotal + vat;

  function setItem(index: number, next: QuotationItemPayload) {
    onChange({
      ...values,
      items: values.items.map((item, currentIndex) =>
        currentIndex === index ? next : item,
      ),
    });
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
          discountPercent: 0,
        },
      ],
    });
  }

  function removeItem(index: number) {
    const nextItems = values.items.filter((_, currentIndex) => currentIndex !== index);

    onChange({
      ...values,
      items:
        nextItems.length > 0
          ? nextItems
          : [
              {
                description: '',
                quantity: 1,
                unitPriceCents: 0,
                discountPercent: 0,
              },
            ],
    });
  }

  const title = mode === 'create' ? 'Create Quotation' : 'Edit Quotation';

  return (
    <DialogShell
      title={title}
      description="Create and maintain quotation pricing with VAT-ready totals."
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
            disabled={busy}
          >
            {busy ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create Quotation' : 'Save Changes'}
          </button>
        </>
      }
    >
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-zinc-700">
          Contact
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.contactId}
            onChange={(event) => onChange({ ...values, contactId: event.target.value })}
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
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.eventId}
            onChange={(event) => onChange({ ...values, eventId: event.target.value })}
          >
            <option value="">No linked event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Quotation Title
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.title}
            onChange={(event) => onChange({ ...values, title: event.target.value })}
            maxLength={150}
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={1500}
            rows={3}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Issue Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.issueDate}
            onChange={(event) => onChange({ ...values, issueDate: event.target.value })}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Valid Until
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.validUntil}
            onChange={(event) => onChange({ ...values, validUntil: event.target.value })}
          />
        </label>

        <label className="text-sm text-zinc-700">
          VAT (%)
          <input
            type="number"
            min={0}
            max={100}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.taxRatePercent}
            onChange={(event) =>
              onChange({ ...values, taxRatePercent: Number(event.target.value) || 0 })
            }
          />
        </label>

        <label className="text-sm text-zinc-700">
          Status
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) =>
              onChange({ ...values, status: event.target.value as QuotationStatus })
            }
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Items</h3>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
            onClick={addItem}
          >
            Add Item
          </button>
        </div>

        {values.items.map((item, index) => (
          <div key={`item-${index}-${item.description}`} className="rounded-lg border border-zinc-200 p-3">
            <div className="grid gap-2 md:grid-cols-12">
              <input
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-4"
                placeholder="Description"
                value={item.description}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    description: event.target.value,
                  })
                }
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
              />

              <input
                type="number"
                min={0}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
                placeholder="Unit cents"
                value={item.unitPriceCents}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    unitPriceCents: Number(event.target.value) || 0,
                  })
                }
              />

              <input
                type="number"
                min={0}
                max={100}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
                placeholder="Discount %"
                value={item.discountPercent ?? 0}
                onChange={(event) =>
                  setItem(index, {
                    ...item,
                    discountPercent: Number(event.target.value) || 0,
                  })
                }
              />

              <button
                type="button"
                className="rounded-md border border-red-300 px-2.5 py-2 text-xs text-red-700 hover:bg-red-50 md:col-span-2"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-600">
              Line Total: {formatCurrency(lineTotal(item))}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600">Subtotal</span>
          <span className="font-medium text-zinc-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-zinc-600">VAT</span>
          <span className="font-medium text-zinc-900">{formatCurrency(vat)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-zinc-200 pt-1.5">
          <span className="font-semibold text-zinc-900">Grand Total</span>
          <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </DialogShell>
  );
}

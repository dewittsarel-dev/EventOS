'use client';

import type { FormEvent } from 'react';
import { EVENT_STATUSES, type ContactRecord, type EventStatus } from '@/lib/events-types';

export type EventFormValues = {
  contactId: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  status: EventStatus;
};

type EventFormProps = {
  mode: 'create' | 'edit';
  values: EventFormValues;
  contacts: ContactRecord[];
  saving: boolean;
  error: string;
  success: string;
  onChange: (next: EventFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventForm({
  mode,
  values,
  contacts,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}: EventFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Event' : 'Edit Event'}
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
          Status
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.status}
            onChange={(event) =>
              onChange({
                ...values,
                status: event.target.value as EventStatus,
              })
            }
            required
          >
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
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
          Description
          <textarea
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.description}
            onChange={(event) =>
              onChange({ ...values, description: event.target.value })
            }
            rows={3}
          />
        </label>

        <label className="text-sm text-zinc-700">
          Start Date/Time
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.startDateTime}
            onChange={(event) =>
              onChange({ ...values, startDateTime: event.target.value })
            }
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          End Date/Time
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.endDateTime}
            onChange={(event) =>
              onChange({ ...values, endDateTime: event.target.value })
            }
            required
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Location
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.location}
            onChange={(event) =>
              onChange({ ...values, location: event.target.value })
            }
            maxLength={200}
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
          {saving ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

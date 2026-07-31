'use client';

import type { FormEvent } from 'react';
import {
  EVENT_STATUSES,
  type ContactRecord,
  type EventStatus,
  type OrganizationUserRecord,
} from '../../lib/events-types';

export type EventFormValues = {
  contactId: string;
  assignedUserId: string;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  budget: string;
  notes: string;
  status: EventStatus;
};

type EventFormProps = {
  mode: 'create' | 'edit';
  values: EventFormValues;
  contacts: ContactRecord[];
  assignedUsers: OrganizationUserRecord[];
  saving: boolean;
  submitDisabled?: boolean;
  error: string;
  success: string;
  onChange: (next: EventFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventForm({
  mode,
  values,
  contacts,
  assignedUsers,
  saving,
  submitDisabled,
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
          Client
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
          Assigned User
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.assignedUserId}
            onChange={(event) =>
              onChange({ ...values, assignedUserId: event.target.value })
            }
          >
            <option value="">Unassigned</option>
            {assignedUsers
              .filter((user) => user.status === 'Active')
              .map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name ?? user.email}
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
          Event Name
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.title}
            onChange={(event) => onChange({ ...values, title: event.target.value })}
            maxLength={150}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Event Type
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.eventType}
            onChange={(event) =>
              onChange({ ...values, eventType: event.target.value })
            }
            maxLength={100}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Event Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.eventDate}
            onChange={(event) => onChange({ ...values, eventDate: event.target.value })}
            required
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Venue
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.venue}
            onChange={(event) =>
              onChange({ ...values, venue: event.target.value })
            }
            maxLength={200}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Start Time
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.startTime}
            onChange={(event) =>
              onChange({ ...values, startTime: event.target.value })
            }
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          End Time
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.endTime}
            onChange={(event) =>
              onChange({ ...values, endTime: event.target.value })
            }
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Budget (in currency units)
          <input
            type="number"
            min={0}
            step={0.01}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.budget}
            onChange={(event) =>
              onChange({ ...values, budget: event.target.value })
            }
          />
        </label>

        <label className="text-sm text-zinc-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            rows={3}
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-4">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={saving || submitDisabled}
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

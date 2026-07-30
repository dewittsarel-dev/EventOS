'use client';

import type { FormEvent } from 'react';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type ContactOption,
  type EventOption,
  type QuotationOption,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/tasks-types';

export type TaskFormValues = {
  eventId: string;
  assignedUserId: string;
  quotationId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type TaskFormProps = {
  mode: 'create' | 'edit';
  values: TaskFormValues;
  events: EventOption[];
  contacts: ContactOption[];
  quotations: QuotationOption[];
  saving: boolean;
  error: string;
  success: string;
  onChange: (next: TaskFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TaskForm({
  mode,
  values,
  events,
  contacts,
  quotations,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Task' : 'Edit Task'}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName ?? ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Quotation
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.quotationId}
            onChange={(event) => onChange({ ...values, quotationId: event.target.value })}
          >
            <option value="">None</option>
            {quotations.map((quotation) => (
              <option key={quotation.id} value={quotation.id}>
                {quotation.quoteNumber} - {quotation.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Priority
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.priority}
            onChange={(event) =>
              onChange({
                ...values,
                priority: event.target.value as TaskPriority,
              })
            }
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-700">
          Due Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.dueDate}
            onChange={(event) => onChange({ ...values, dueDate: event.target.value })}
            required
          />
        </label>

        <label className="text-sm text-zinc-700">
          Due Time
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.dueTime}
            onChange={(event) => onChange({ ...values, dueTime: event.target.value })}
            required
          />
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
            rows={4}
            value={values.description}
            onChange={(event) =>
              onChange({ ...values, description: event.target.value })
            }
            maxLength={1500}
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
                status: event.target.value as TaskStatus,
              })
            }
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
          {saving ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

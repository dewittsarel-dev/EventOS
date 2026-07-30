'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { TaskForm, type TaskFormValues } from '@/components/tasks/task-form';
import {
  createTask,
  listContacts,
  listEvents,
  listQuotations,
} from '@/lib/tasks-api';
import type {
  ContactOption,
  EventOption,
  QuotationOption,
} from '@/lib/tasks-types';

function nowParts() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const [date, time] = local.split('T');

  return {
    date,
    time,
  };
}

const defaultNow = nowParts();

const defaultForm: TaskFormValues = {
  eventId: '',
  assignedUserId: '',
  quotationId: '',
  title: '',
  description: '',
  dueDate: defaultNow.date,
  dueTime: defaultNow.time,
  priority: 'Medium',
  status: 'Todo',
};

export default function NewTaskPage() {
  const { session } = useAppSession();
  const [form, setForm] = useState<TaskFormValues>(defaultForm);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadReferences() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoadingRefs(true);
      setError('');

      try {
        const [eventsResponse, contactsResponse, quotationsResponse] =
          await Promise.all([
            listEvents(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              session.organizationId,
            ),
            listContacts(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              session.organizationId,
            ),
            listQuotations(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              session.organizationId,
            ),
          ]);

        setEvents(eventsResponse.data);
        setContacts(contactsResponse.data);
        setQuotations(quotationsResponse.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load reference data.',
        );
      } finally {
        setLoadingRefs(false);
      }
    }

    void loadReferences();
  }, [session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    setSaving(true);

    try {
      await createTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          eventId: form.eventId,
          assignedUserId: form.assignedUserId || undefined,
          quotationId: form.quotationId || undefined,
          title: form.title,
          description: form.description || undefined,
          dueDate: new Date(`${form.dueDate}T${form.dueTime}:00.000Z`).toISOString(),
          priority: form.priority,
          status: form.status,
        },
      );

      setSuccess('Task created successfully.');
      const next = nowParts();
      setForm({ ...defaultForm, dueDate: next.date, dueTime: next.time });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create task.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Task"
        actions={
          <Link
            href="/tasks"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Tasks
          </Link>
        }
      />

      {loadingRefs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading events, contacts and quotations...
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          You need at least one event to create a task.
        </div>
      ) : null}

      <TaskForm
        mode="create"
        values={form}
        events={events}
        contacts={contacts}
        quotations={quotations}
        saving={saving}
        error={error}
        success={success}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </div>
  );
}

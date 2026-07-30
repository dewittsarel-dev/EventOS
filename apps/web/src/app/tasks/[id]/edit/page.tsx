'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { TaskForm, type TaskFormValues } from '@/components/tasks/task-form';
import {
  getTask,
  listContacts,
  listEvents,
  listQuotations,
  updateTask,
} from '@/lib/tasks-api';
import type {
  ContactOption,
  EventOption,
  QuotationOption,
  TaskRecord,
} from '@/lib/tasks-types';

function toFormDateTime(value: string) {
  const dateValue = new Date(value);
  const local = new Date(dateValue.getTime() - dateValue.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [dueDate, dueTime] = local.split('T');

  return {
    dueDate,
    dueTime,
  };
}

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const taskId = String(params.id);

  const { session } = useAppSession();
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);
  const [form, setForm] = useState<TaskFormValues>({
    eventId: '',
    assignedContactId: '',
    quotationId: '',
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'Normal',
    status: 'Todo',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [taskResponse, eventsResponse, contactsResponse, quotationsResponse] =
          await Promise.all([
            getTask(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              taskId,
            ),
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

        setTask(taskResponse);
        setEvents(eventsResponse.data);
        setContacts(contactsResponse.data);
        setQuotations(quotationsResponse.data);

        const dateTime = toFormDateTime(taskResponse.dueDate);

        setForm({
          eventId: taskResponse.eventId,
          assignedContactId: taskResponse.assignedContactId ?? '',
          quotationId: taskResponse.quotationId ?? '',
          title: taskResponse.title,
          description: taskResponse.description ?? '',
          dueDate: dateTime.dueDate,
          dueTime: dateTime.dueTime,
          priority: taskResponse.priority,
          status: taskResponse.status,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load task.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [taskId, session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        taskId,
        {
          eventId: form.eventId,
          assignedContactId: form.assignedContactId || null,
          quotationId: form.quotationId || null,
          title: form.title,
          description: form.description || undefined,
          dueDate: new Date(`${form.dueDate}T${form.dueTime}:00.000Z`).toISOString(),
          priority: form.priority,
          status: form.status,
        },
      );

      setTask(updated);
      setSuccess('Task updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update task.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Task"
        actions={
          <Link
            href={`/tasks/${taskId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading task...
        </div>
      ) : task ? (
        <TaskForm
          mode="edit"
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
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Task not found.
        </div>
      )}
    </div>
  );
}

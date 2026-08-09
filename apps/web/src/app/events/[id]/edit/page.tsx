'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  EventForm,
  type EventFormValues,
} from '../../../../components/events/event-form';
import {
  getEvent,
  listContacts,
  listOrganizationUsers,
  updateEvent,
} from '../../../../lib/events-api';
import type {
  ContactRecord,
  EventRecord,
  OrganizationUserRecord,
} from '../../../../lib/events-types';

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = String(params.id);

  const { session } = useAppSession();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<OrganizationUserRecord[]>([]);
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventFormValues>({
    contactId: '',
    assignedUserId: '',
    title: '',
    eventType: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    budget: '',
    notes: '',
    status: 'Draft',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const eventResponse = await getEvent(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          eventId,
        );

        const organizationId = eventResponse.organizationId;

        const [contactsResponse, usersResponse] = await Promise.all([
          listContacts(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            organizationId,
          ).catch(() => ({ data: [] as ContactRecord[] })),
          listOrganizationUsers(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            organizationId,
          ).catch(() => ({ data: [] as OrganizationUserRecord[] })),
        ]);

        setEventRecord(eventResponse);
        setContacts(contactsResponse.data);
        setAssignedUsers(usersResponse.data);
        setForm({
          contactId: eventResponse.contactId,
          assignedUserId: eventResponse.assignedUserId ?? '',
          title: eventResponse.title,
          eventType: eventResponse.eventType,
          eventDate: toDateOnly(eventResponse.eventDate),
          startTime: eventResponse.startTime,
          endTime: eventResponse.endTime,
          venue: eventResponse.venue ?? '',
          budget:
            eventResponse.budgetCents !== null
              ? (eventResponse.budgetCents / 100).toFixed(2)
              : '',
          notes: eventResponse.notes ?? '',
          status: eventResponse.status,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load event.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [eventId, session.baseUrl, session.token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please sign in before editing this event.');
      return;
    }

    setSaving(true);

    try {
      await updateEvent(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        eventId,
        {
          contactId: form.contactId,
          assignedUserId: form.assignedUserId || undefined,
          title: form.title,
          eventType: form.eventType,
          eventDate: new Date(`${form.eventDate}T00:00:00.000Z`).toISOString(),
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue,
          budgetCents: form.budget
            ? Math.round(Number.parseFloat(form.budget) * 100)
            : undefined,
          notes: form.notes || undefined,
          status: form.status,
        },
      );

      setSuccess('Event updated successfully. Redirecting to details...');
      router.push(`/events/${eventId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update event.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Event"
        actions={
          <Link
            href={`/events/${eventId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading event...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : eventRecord ? (
        <EventForm
          mode="edit"
          values={form}
          contacts={contacts}
          assignedUsers={assignedUsers}
          saving={saving}
          error={error}
          success={success}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Event not found.
        </div>
      )}
    </div>
  );
}

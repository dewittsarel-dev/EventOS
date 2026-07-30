'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { EventForm, type EventFormValues } from '@/components/events/event-form';
import { getEvent, listContacts, updateEvent } from '@/lib/events-api';
import type { ContactRecord, EventRecord } from '@/lib/events-types';

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = String(params.id);

  const { session } = useAppSession();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventFormValues>({
    contactId: '',
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
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
        const [eventResponse, contactsResponse] = await Promise.all([
          getEvent(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            eventId,
          ),
          session.organizationId
            ? listContacts(
                {
                  token: session.token,
                  baseUrl: session.baseUrl,
                },
                session.organizationId,
              )
            : Promise.resolve({ data: [] as ContactRecord[] }),
        ]);

        setEventRecord(eventResponse);
        setContacts(contactsResponse.data);
        setForm({
          contactId: eventResponse.contactId,
          title: eventResponse.title,
          description: eventResponse.description ?? '',
          startDateTime: toDateTimeLocal(eventResponse.startDateTime),
          endDateTime: toDateTimeLocal(eventResponse.endDateTime),
          location: eventResponse.location ?? '',
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
  }, [eventId, session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please save a Bearer token first.');
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
          title: form.title,
          description: form.description,
          startDateTime: new Date(form.startDateTime).toISOString(),
          endDateTime: new Date(form.endDateTime).toISOString(),
          location: form.location,
          status: form.status,
        },
      );

      setSuccess('Event updated successfully.');
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
      ) : eventRecord ? (
        <EventForm
          mode="edit"
          values={form}
          contacts={contacts}
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

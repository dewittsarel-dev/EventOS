'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { EventForm, type EventFormValues } from '@/components/events/event-form';
import { createEvent, listContacts } from '@/lib/events-api';
import { type ContactRecord } from '@/lib/events-types';

const defaultForm: EventFormValues = {
  contactId: '',
  title: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  location: '',
  status: 'Draft',
};

export default function NewEventPage() {
  const { session } = useAppSession();
  const [form, setForm] = useState<EventFormValues>(defaultForm);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadContacts() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoadingContacts(true);
      setError('');

      try {
        const response = await listContacts(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
        );

        setContacts(response.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load contacts.',
        );
      } finally {
        setLoadingContacts(false);
      }
    }

    void loadContacts();
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
      await createEvent(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          contactId: form.contactId,
          title: form.title,
          description: form.description,
          startDateTime: new Date(form.startDateTime).toISOString(),
          endDateTime: new Date(form.endDateTime).toISOString(),
          location: form.location,
          status: form.status,
        },
      );

      setSuccess('Event created successfully.');
      setForm(defaultForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create event.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Event"
        actions={
          <Link
            href="/events"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Events
          </Link>
        }
      />

      {loadingContacts ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          No contacts available. Create a contact first.
        </div>
      ) : null}

      <EventForm
        mode="create"
        values={form}
        contacts={contacts}
        saving={saving}
        error={error}
        success={success}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </div>
  );
}

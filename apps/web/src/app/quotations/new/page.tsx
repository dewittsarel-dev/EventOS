'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  QuotationForm,
  type QuotationFormValues,
} from '@/components/quotations/quotation-form';
import {
  createQuotation,
  listContacts,
  listEvents,
} from '@/lib/quotations-api';
import type { ContactOption, EventOption } from '@/lib/quotations-types';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const defaultForm: QuotationFormValues = {
  contactId: '',
  eventId: '',
  title: '',
  notes: '',
  issueDate: todayDate(),
  expiryDate: '',
  discountCents: 0,
  taxRatePercent: 0,
  status: 'Draft',
  items: [
    {
      description: '',
      quantity: 1,
      unitPriceCents: 0,
      discountPercent: 0,
    },
  ],
};

export default function NewQuotationPage() {
  const { session } = useAppSession();
  const [form, setForm] = useState<QuotationFormValues>(defaultForm);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
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
        const [contactsResponse, eventsResponse] = await Promise.all([
          listContacts(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            session.organizationId,
          ),
          listEvents(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            session.organizationId,
          ),
        ]);

        setContacts(contactsResponse.data);
        setEvents(eventsResponse.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load contacts/events.',
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
      await createQuotation(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          contactId: form.contactId,
          eventId: form.eventId || undefined,
          title: form.title,
          notes: form.notes,
          issueDate: form.issueDate
            ? new Date(`${form.issueDate}T00:00:00.000Z`).toISOString()
            : undefined,
          expiryDate: form.expiryDate
            ? new Date(`${form.expiryDate}T00:00:00.000Z`).toISOString()
            : undefined,
          discountCents: form.discountCents,
          taxRatePercent: form.taxRatePercent,
          status: form.status,
          items: form.items,
        },
      );

      setSuccess('Quotation created successfully.');
      setForm(defaultForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create quotation.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Quotation"
        actions={
          <Link
            href="/quotations"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Quotations
          </Link>
        }
      />

      {loadingRefs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading contacts and events...
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          You need at least one contact to create a quotation. Linking an event is optional.
        </div>
      ) : null}

      <QuotationForm
        mode="create"
        values={form}
        contacts={contacts}
        events={events}
        saving={saving}
        error={error}
        success={success}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  QuotationForm,
  type QuotationFormValues,
} from '@/components/quotations/quotation-form';
import {
  getQuotation,
  listContacts,
  listEvents,
  updateQuotation,
} from '@/lib/quotations-api';
import type {
  ContactOption,
  EventOption,
  QuotationRecord,
} from '@/lib/quotations-types';

function toDateInput(value: string | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const quotationId = String(params.id);

  const { session } = useAppSession();
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [quotation, setQuotation] = useState<QuotationRecord | null>(null);
  const [form, setForm] = useState<QuotationFormValues>({
    contactId: '',
    eventId: '',
    title: '',
    notes: '',
    issueDate: '',
    expiryDate: '',
    discountCents: 0,
    taxRatePercent: 0,
    status: 'Draft',
    items: [
      {
        description: '',
        quantity: 1,
        unitPriceCents: 0,
      },
    ],
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
        const [quotationResponse, contactsResponse, eventsResponse] =
          await Promise.all([
            getQuotation(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              quotationId,
            ),
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

        setQuotation(quotationResponse);
        setContacts(contactsResponse.data);
        setEvents(eventsResponse.data);

        setForm({
          contactId: quotationResponse.contactId,
          eventId: quotationResponse.eventId,
          title: quotationResponse.title,
          notes: quotationResponse.notes ?? '',
          issueDate: toDateInput(quotationResponse.issueDate),
          expiryDate: toDateInput(quotationResponse.expiryDate),
          discountCents: quotationResponse.discountCents,
          taxRatePercent: quotationResponse.taxRatePercent,
          status: quotationResponse.status,
          items: quotationResponse.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load quotation.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [quotationId, session]);

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
      await updateQuotation(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        quotationId,
        {
          contactId: form.contactId,
          eventId: form.eventId,
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

      setSuccess('Quotation updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update quotation.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Quotation"
        actions={
          <Link
            href={`/quotations/${quotationId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading quotation...
        </div>
      ) : quotation ? (
        <QuotationForm
          mode="edit"
          values={form}
          contacts={contacts}
          events={events}
          saving={saving}
          error={error}
          success={success}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Quotation not found.
        </div>
      )}
    </div>
  );
}

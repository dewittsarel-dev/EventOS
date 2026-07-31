'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  archiveQuotation,
  getQuotation,
  listContacts,
  listEvents,
  updateQuotationStatus,
} from '@/lib/quotations-api';
import {
  QUOTATION_STATUSES,
  type ContactOption,
  type EventOption,
  type QuotationRecord,
  type QuotationStatus,
} from '@/lib/quotations-types';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

export default function QuotationDetailsPage() {
  const params = useParams<{ id: string }>();
  const quotationId = String(params.id);

  const { session } = useAppSession();
  const [quotation, setQuotation] = useState<QuotationRecord | null>(null);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadQuotation() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [quotationResponse, contactsResponse, eventsResponse] = await Promise.all([
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

    void loadQuotation();
  }, [quotationId, session]);

  async function onArchive() {
    if (!session.token || !quotation) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await archiveQuotation(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        quotation.id,
      );

      setSuccess('Quotation archived.');
      setQuotation({ ...quotation, archivedAt: new Date().toISOString() });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive quotation.',
      );
    }
  }

  async function onStatusChange(nextStatus: QuotationStatus) {
    if (!session.token || !quotation) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const updated = await updateQuotationStatus(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        quotation.id,
        nextStatus,
      );

      setQuotation(updated);
      setSuccess('Status updated.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update status.',
      );
    }
  }

  const clientName = quotation
    ? contacts.find((contact) => contact.id === quotation.contactId)
    : null;
  const eventName = quotation?.eventId
    ? events.find((event) => event.id === quotation.eventId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Quotation Details"
        actions={
          <>
            <Link
              href={`/quotations/${quotationId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Quotation
            </Link>
            <Link
              href="/quotations"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading quotation...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : quotation ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{quotation.title}</h2>
              <p className="text-sm text-zinc-600">{quotation.quoteNumber}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Quotation status"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                value={quotation.status}
                onChange={(event) =>
                  void onStatusChange(event.target.value as QuotationStatus)
                }
              >
                {QUOTATION_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {quotation.archivedAt ? null : (
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  onClick={() => void onArchive()}
                >
                  Archive
                </button>
              )}
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Client</dt>
              <dd className="text-zinc-600">
                {clientName ? `${clientName.firstName} ${clientName.lastName ?? ''}`.trim() : quotation.contactId}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Status</dt>
              <dd className="text-zinc-600">{quotation.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Issue Date</dt>
              <dd className="text-zinc-600">
                {new Date(quotation.issueDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Expiry Date</dt>
              <dd className="text-zinc-600">
                {quotation.expiryDate
                  ? new Date(quotation.expiryDate).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Created Date</dt>
              <dd className="text-zinc-600">
                {new Date(quotation.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Event</dt>
              <dd className="break-all text-zinc-600">
                {quotation.eventId
                  ? eventName?.title ?? quotation.eventId
                  : 'No linked event'}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {quotation.notes || 'No notes provided.'}
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">Qty</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Discount %
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-200">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatCurrency(item.unitPriceCents)}</td>
                    <td className="px-3 py-2">{item.discountPercent}%</td>
                    <td className="px-3 py-2">{formatCurrency(item.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm md:max-w-sm">
            <p>Subtotal: {formatCurrency(quotation.subtotalCents)}</p>
            <p>Discount: -{formatCurrency(quotation.discountCents)}</p>
            <p>VAT: {formatCurrency(quotation.taxCents)}</p>
            <p>Total: {formatCurrency(quotation.totalCents - quotation.taxCents)}</p>
            <p className="font-semibold text-zinc-900">
              Grand Total: {formatCurrency(quotation.grandTotalCents)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Quotation not found.
        </div>
      )}

      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </div>
  );
}

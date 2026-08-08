'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { archiveContact, getContact } from '@/lib/contacts-api';
import type { ContactDetailsRecord } from '@/lib/contacts-types';

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

function formatName(contact: ContactDetailsRecord) {
  return `${contact.firstName} ${contact.lastName ?? ''}`.trim();
}

export default function ContactDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contactId = String(params.id);

  const { session } = useAppSession();
  const [contact, setContact] = useState<ContactDetailsRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadContact() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getContact(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          contactId,
        );

        setContact(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load contact.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadContact();
  }, [contactId, session.baseUrl, session.token]);

  async function onArchive() {
    if (!session.token || !contact) {
      return;
    }

    setArchiving(true);
    setError('');

    try {
      await archiveContact(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        contact.id,
      );

      router.push('/contacts');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive contact.',
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contact Details"
        actions={
          <>
            <Link
              href={`/contacts/${contactId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Contact
            </Link>
            <button
              type="button"
              onClick={() => void onArchive()}
              disabled={archiving}
              className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {archiving ? 'Archiving...' : 'Archive Contact'}
            </button>
            <Link
              href="/contacts"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Contacts
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading contact...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : contact ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">{formatName(contact)}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {contact.contactType ?? 'Unspecified type'}
          </p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Name</dt>
              <dd className="text-zinc-600">{formatName(contact)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Email</dt>
              <dd className="text-zinc-600">{contact.email ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Phone</dt>
              <dd className="text-zinc-600">{contact.phone ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Mobile</dt>
              <dd className="text-zinc-600">{contact.mobile ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Company or Organization</dt>
              <dd className="text-zinc-600">
                {contact.companyName ?? contact.organizationName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Contact Type</dt>
              <dd className="text-zinc-600">{contact.contactType ?? '-'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-zinc-700">Address</dt>
              <dd className="whitespace-pre-wrap text-zinc-600">{contact.address ?? '-'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-zinc-700">Notes</dt>
              <dd className="whitespace-pre-wrap text-zinc-600">
                {contact.notes ?? 'No notes provided.'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Created</dt>
              <dd className="text-zinc-600">{formatDate(contact.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Updated</dt>
              <dd className="text-zinc-600">{formatDate(contact.updatedAt)}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Linked Events</h3>
              {contact.events.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">No linked events.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {contact.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block rounded border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
                    >
                      {event.title} · {new Date(event.eventDate).toLocaleDateString()} ·{' '}
                      {event.status}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Linked Quotations</h3>
              {contact.quotations.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">No linked quotations.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {contact.quotations.map((quotation) => (
                    <Link
                      key={quotation.id}
                      href={`/quotations/${quotation.id}`}
                      className="block rounded border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
                    >
                      {quotation.quoteNumber} · {quotation.title} · {quotation.status}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Linked Meeting Notes</h3>
              {contact.meetingNotes.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">No linked meeting notes.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {contact.meetingNotes.map((meetingNote) => (
                    <Link
                      key={meetingNote.id}
                      href={`/meeting-notes/${meetingNote.id}`}
                      className="block rounded border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
                    >
                      {meetingNote.title} ·{' '}
                      {new Date(meetingNote.meetingDate).toLocaleDateString()} ·{' '}
                      {meetingNote.meetingType}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Linked Tasks</h3>
              {contact.tasks.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">No linked tasks.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {contact.tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block rounded border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
                    >
                      {task.title} · {task.status}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Contact not found.
        </div>
      )}
    </div>
  );
}

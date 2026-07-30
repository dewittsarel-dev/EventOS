'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { getEvent } from '@/lib/events-api';
import type { EventRecord } from '@/lib/events-types';

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const eventId = String(params.id);

  const { session } = useAppSession();
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getEvent(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          eventId,
        );

        setEventRecord(response);
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

    void loadEvent();
  }, [eventId, session]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Event Details"
        actions={
          <>
            <Link
              href={`/tasks/timeline?eventId=${eventId}`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Timeline
            </Link>
            <Link
              href={`/events/${eventId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Event
            </Link>
            <Link
              href="/events"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
          </>
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
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">{eventRecord.title}</h2>
          <p className="mt-1 text-sm text-zinc-600">Status: {eventRecord.status}</p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Start</dt>
              <dd className="text-zinc-600">
                {new Date(eventRecord.startDateTime).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">End</dt>
              <dd className="text-zinc-600">
                {new Date(eventRecord.endDateTime).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Location</dt>
              <dd className="text-zinc-600">{eventRecord.location ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Contact ID</dt>
              <dd className="break-all text-zinc-600">{eventRecord.contactId}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {eventRecord.description || 'No description provided.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Event not found.
        </div>
      )}
    </div>
  );
}

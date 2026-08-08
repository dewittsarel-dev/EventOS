'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { EventLifecyclePanel } from '../../../components/events/event-lifecycle-panel';
import { getEvent } from '../../../lib/events-api';
import type { EventRecord } from '../../../lib/events-types';

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
  }, [eventId, session.baseUrl, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={eventRecord?.title ?? 'Event workspace'}
        description={
          eventRecord
            ? `${eventRecord.eventType} · ${new Date(eventRecord.eventDate).toLocaleDateString()} · ${eventRecord.venue ?? 'Venue not confirmed'}`
            : 'Lifecycle health, current stage and the next relevant action.'
        }
        actions={
          <>
            <Link
              href={`/events/${eventId}/planning`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Design & Requirements
            </Link>
            <Link
              href={`/events/${eventId}/mood-board`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Mood Board
            </Link>
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
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Event overview</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-900">{eventRecord.contactName ?? eventRecord.contactId}</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{eventRecord.status}</span>
          </div>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Event owner</dt>
              <dd className="text-zinc-600">{eventRecord.assignedUserName ?? 'Not assigned'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Organization</dt>
              <dd className="text-zinc-600 break-all">{eventRecord.organizationId}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Event Type</dt>
              <dd className="text-zinc-600">{eventRecord.eventType}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Event Date</dt>
              <dd className="text-zinc-600">{new Date(eventRecord.eventDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Start Time</dt>
              <dd className="text-zinc-600">{eventRecord.startTime}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">End Time</dt>
              <dd className="text-zinc-600">{eventRecord.endTime}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Venue</dt>
              <dd className="text-zinc-600">{eventRecord.venue ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Lifecycle status</dt>
              <dd className="text-zinc-600">{eventRecord.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Budget</dt>
              <dd className="text-zinc-600">
                {eventRecord.budgetCents !== null
                  ? (eventRecord.budgetCents / 100).toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    })
                  : '-'}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {eventRecord.notes || 'No notes provided.'}
            </p>
          </div>
          </div>
          <EventLifecyclePanel
            eventId={eventId}
            token={session.token}
            baseUrl={session.baseUrl}
            organizationId={eventRecord.organizationId}
          />
        </>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Event not found.
        </div>
      )}
    </div>
  );
}

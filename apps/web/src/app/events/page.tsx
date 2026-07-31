'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { deleteEvent, listEvents } from '../../lib/events-api';
import {
  EVENT_STATUSES,
  type EventRecord,
  type EventStatus,
} from '../../lib/events-types';

type SortOrder = 'asc' | 'desc';

export default function EventsPage() {
  const { session } = useAppSession();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState<EventStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  async function loadEvents() {
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    setLoading(true);

    try {
      const response = await listEvents(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          page,
          limit,
          search,
          eventType,
          status,
          sort,
        },
      );

      setEvents(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load events.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.token || !session.organizationId) {
      return;
    }

    // Fetching data in this effect is intentional for query-driven refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, session.organizationId, page, limit, sort]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadEvents();
  }

  async function onDelete(id: string) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    const confirmed = window.confirm('Delete this event?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteEvent(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        id,
      );

      setSuccess('Event deleted.');
      await loadEvents();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete event.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Events"
        description="Manage events in your organization."
        actions={
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create Event
          </Link>
        }
      />

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-6"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search name, type or venue"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Filter event type"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as EventStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {EVENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOrder)}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <input
          type="number"
          min={1}
          max={100}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value) || 10)}
        />

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No events found. Create your first event to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Event Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Venue</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">{event.title}</td>
                    <td className="px-4 py-3 text-zinc-700">{event.contactName ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{event.eventType}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {new Date(event.eventDate).toLocaleDateString()} {event.startTime}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{event.status}</td>
                    <td className="px-4 py-3 text-zinc-700">{event.venue ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/events/${event.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/events/${event.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => void onDelete(event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
            <p>
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

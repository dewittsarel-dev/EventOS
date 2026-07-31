'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { deleteMeetingNote, listMeetingNotes } from '../../lib/meeting-notes-api';
import {
  MEETING_TYPES,
  type MeetingNoteListItemRecord,
  type MeetingType,
} from '../../lib/meeting-notes-types';
import { listEvents } from '../../lib/events-api';
import type { EventRecord } from '../../lib/events-types';
import { ConfirmDeleteMeetingNoteDialog } from '../../components/meeting-notes/confirm-delete-meeting-note-dialog';

export default function MeetingNotesPage() {
  const { session } = useAppSession();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNoteListItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [eventId, setEventId] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'upcoming'>('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<MeetingNoteListItemRecord | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const canLoad = Boolean(session.token && session.organizationId);

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  async function loadData() {
    if (!session.token || !session.organizationId) {
      setEvents([]);
      setMeetingNotes([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [eventsResponse, notesResponse] = await Promise.all([
        listEvents(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
          },
        ),
        listMeetingNotes(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          {
            organizationId: session.organizationId,
            page,
            limit,
            search,
            eventId: eventId || undefined,
            meetingType,
            dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString() : undefined,
            dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : undefined,
            sort,
          },
        ),
      ]);

      setEvents(eventsResponse.data);
      setMeetingNotes(notesResponse.data);
      setTotal(notesResponse.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load meeting notes.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function runLoad() {
      if (!session.token || !session.organizationId) {
        if (!cancelled) {
          setEvents([]);
          setMeetingNotes([]);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError('');
      }

      try {
        const [eventsResponse, notesResponse] = await Promise.all([
          listEvents(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            {
              organizationId: session.organizationId,
              page: 1,
              limit: 200,
            },
          ),
          listMeetingNotes(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            {
              organizationId: session.organizationId,
              page,
              limit,
              search,
              eventId: eventId || undefined,
              meetingType,
              dateFrom: dateFrom
                ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString()
                : undefined,
              dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : undefined,
              sort,
            },
          ),
        ]);

        if (!cancelled) {
          setEvents(eventsResponse.data);
          setMeetingNotes(notesResponse.data);
          setTotal(notesResponse.meta.total);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load meeting notes.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [session.baseUrl, session.organizationId, session.token, page, limit, sort, meetingType, eventId, dateFrom, dateTo, search]);

  async function onDelete() {
    if (!deleteTarget || !session.token) {
      return;
    }

    setBusyDelete(true);
    setError('');

    try {
      await deleteMeetingNote(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        deleteTarget.id,
      );

      setDeleteTarget(null);
      setSuccess('Meeting note deleted.');
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete meeting note.',
      );
    } finally {
      setBusyDelete(false);
    }
  }

  const filteredEmpty = !loading && meetingNotes.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Meeting Notes"
        description="Track decisions, attendees and follow-up actions for event discussions."
        actions={
          <Link
            href="/meeting-notes/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create Meeting Note
          </Link>
        }
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage meeting notes.
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void loadData();
        }}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search title, summary, notes or location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
        >
          <option value="">All events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={meetingType}
          onChange={(event) => setMeetingType(event.target.value as MeetingType | 'ALL')}
        >
          <option value="ALL">All types</option>
          {MEETING_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as 'newest' | 'oldest' | 'upcoming')}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="upcoming">Upcoming</option>
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>

        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
      </form>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-600">Rows</label>
        <input
          type="number"
          min={1}
          max={100}
          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value) || 10)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading meeting notes...
        </div>
      ) : filteredEmpty ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No meeting notes found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Event</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Attendees</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Open Items</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Created By</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetingNotes.map((note) => (
                  <tr key={note.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">{note.title}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.eventName}</td>
                    <td className="px-4 py-3 text-zinc-700">{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(note.meetingDate))}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.meetingType}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.location ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.attendeeCount}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.openActionItemCount}</td>
                    <td className="px-4 py-3 text-zinc-700">{note.createdByUserName ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" href={`/meeting-notes/${note.id}`}>
                          View
                        </Link>
                        <Link className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" href={`/meeting-notes/${note.id}/edit`}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(note)}
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

      <ConfirmDeleteMeetingNoteDialog
        open={deleteTarget !== null}
        busy={busyDelete}
        title={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await onDelete();
        }}
      />
    </div>
  );
}

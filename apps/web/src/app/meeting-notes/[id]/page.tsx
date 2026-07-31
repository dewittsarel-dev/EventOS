'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { ConfirmDeleteMeetingNoteDialog } from '../../../components/meeting-notes/confirm-delete-meeting-note-dialog';
import { convertMeetingActionItemToTask, deleteMeetingNote, getMeetingNote } from '../../../lib/meeting-notes-api';
import type { MeetingNoteRecord } from '../../../lib/meeting-notes-types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(value));
}

export default function MeetingNoteDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = String(params.id);

  const { session } = useAppSession();
  const [note, setNote] = useState<MeetingNoteRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyActionId, setBusyActionId] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadNote() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getMeetingNote(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          noteId,
        );

        setNote(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Failed to load meeting note.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadNote();
  }, [noteId, session.baseUrl, session.token]);

  async function onDelete() {
    if (!session.token) {
      return;
    }

    setDeleting(true);

    try {
      await deleteMeetingNote(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        noteId,
      );

      router.push('/meeting-notes');
    } finally {
      setDeleting(false);
    }
  }

  async function onConvert(actionItemId: string) {
    if (!session.token) {
      return;
    }

    setBusyActionId(actionItemId);

    try {
      const response = await convertMeetingActionItemToTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        noteId,
        actionItemId,
      );

      setNote(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to convert action item to task.',
      );
    } finally {
      setBusyActionId('');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Meeting Note Details"
        actions={
          <>
            <Link
              href={note ? `/meeting-notes/${note.id}/edit` : '#'}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Meeting Note
            </Link>
            <button
              type="button"
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              disabled={!note}
            >
              Delete
            </button>
            <Link
              href="/meeting-notes"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading meeting note...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : note ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">{note.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {note.event.title} · {note.organization.name} · {note.meetingType}
            </p>

            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-700">Meeting Date</dt>
                <dd className="text-zinc-600">{formatDate(note.meetingDate)}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Location</dt>
                <dd className="text-zinc-600">{note.location ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Created By</dt>
                <dd className="text-zinc-600">{note.createdBy.name ?? note.createdBy.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Attendees</dt>
                <dd className="text-zinc-600">{note.attendeeCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Open Action Items</dt>
                <dd className="text-zinc-600">{note.openActionItemCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Next Meeting</dt>
                <dd className="text-zinc-600">{note.nextMeetingDate ? formatDate(note.nextMeetingDate) : '-'}</dd>
              </div>
            </dl>

            {note.summary ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-700">Summary</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{note.summary}</p>
              </div>
            ) : null}

            {note.discussionNotes ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-700">Discussion Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{note.discussionNotes}</p>
              </div>
            ) : null}

            {note.decisions ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-700">Decisions</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{note.decisions}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">Attendees</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {note.attendees.map((attendee) => (
                <li key={attendee.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <p className="font-medium text-zinc-900">{attendee.name}</p>
                  <p>{attendee.email ?? '-'}</p>
                  <p>{attendee.roleOrOrganization ?? '-'}</p>
                  <p>Status: {attendee.attendanceStatus}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">Action Items</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {note.actionItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900">{item.description}</p>
                      <p>Assigned: {item.assignedUserName ?? item.assignedContactName ?? '-'}</p>
                      <p>Due: {item.dueDate ? formatDate(item.dueDate) : '-'}</p>
                      <p>Priority: {item.priority}</p>
                      <p>Status: {item.status}</p>
                    </div>
                    <div className="text-right">
                      {item.linkedTask ? (
                        <p className="text-xs text-emerald-700">
                          Linked task: {item.linkedTask.title} ({item.linkedTask.status})
                        </p>
                      ) : (
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-2 text-xs hover:bg-zinc-100 disabled:opacity-60"
                          onClick={() => void onConvert(item.id)}
                          disabled={busyActionId === item.id}
                        >
                          {busyActionId === item.id ? 'Converting...' : 'Convert to Task'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Meeting note not found.
        </div>
      )}

      <ConfirmDeleteMeetingNoteDialog
        open={deleteOpen}
        busy={deleting}
        title={note?.title ?? ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await onDelete();
        }}
      />
    </div>
  );
}

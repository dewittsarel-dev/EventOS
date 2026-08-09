'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  MeetingNoteForm,
  meetingNoteToForm,
  type MeetingNoteFormValues,
} from '../../../../components/meeting-notes/meeting-note-form';
import {
  addMeetingActionItem,
  addMeetingAttendee,
  getMeetingNote,
  removeMeetingActionItem,
  removeMeetingAttendee,
  updateMeetingNote,
} from '../../../../lib/meeting-notes-api';
import type { MeetingNoteRecord } from '../../../../lib/meeting-notes-types';
import { listEvents } from '../../../../lib/events-api';
import { listOrganizationUsers } from '../../../../lib/organization-users-api';
import type { EventRecord } from '../../../../lib/events-types';
import type { OrganizationUserRecord } from '../../../../lib/organization-users-types';

function buildCorePayload(values: MeetingNoteFormValues) {
  return {
    eventId: values.eventId,
    title: values.title.trim(),
    meetingDate: new Date(`${values.meetingDate}T00:00:00.000Z`).toISOString(),
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    location: values.location || undefined,
    meetingType: values.meetingType,
    summary: values.summary || undefined,
    discussionNotes: values.discussionNotes || undefined,
    decisions: values.decisions || undefined,
    nextMeetingDate: values.nextMeetingDate
      ? new Date(`${values.nextMeetingDate}T00:00:00.000Z`).toISOString()
      : undefined,
  };
}

function buildAttendees(values: MeetingNoteFormValues) {
  return values.attendees
    .filter((attendee) => attendee.name.trim())
    .map((attendee) => ({
      name: attendee.name.trim(),
      email: attendee.email.trim() || undefined,
      roleOrOrganization: attendee.roleOrOrganization.trim() || undefined,
      attendanceStatus: attendee.attendanceStatus,
    }));
}

function buildActionItems(values: MeetingNoteFormValues) {
  return values.actionItems
    .filter((item) => item.description.trim())
    .map((item) => ({
      description: item.description.trim(),
      assignedUserId: item.assignedUserId || undefined,
      assignedContactName: item.assignedContactName.trim() || undefined,
      dueDate: item.dueDate ? new Date(`${item.dueDate}T00:00:00.000Z`).toISOString() : undefined,
      priority: item.priority,
      status: item.status,
      linkedTaskId: item.linkedTaskId || undefined,
    }));
}

export default function EditMeetingNotePage() {
  const params = useParams<{ id: string }>();
  const noteId = String(params.id);

  const { session } = useAppSession();
  const [note, setNote] = useState<MeetingNoteRecord | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<OrganizationUserRecord[]>([]);
  const [form, setForm] = useState<MeetingNoteFormValues>({} as MeetingNoteFormValues);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [noteResponse, eventsResponse, usersResponse] = await Promise.all([
          getMeetingNote(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            noteId,
          ),
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
          session.organizationId
            ? listOrganizationUsers(
                {
                  token: session.token,
                  baseUrl: session.baseUrl,
                },
                session.organizationId,
              )
            : Promise.resolve({ data: [] as OrganizationUserRecord[] }),
        ]);

        setNote(noteResponse);
        setEvents(eventsResponse.data);
        setUsers(usersResponse.data);
        setForm(meetingNoteToForm(noteResponse));
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Failed to load meeting note.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [noteId, session.baseUrl, session.organizationId, session.token]);

  async function refreshNote() {
    if (!session.token) {
      return;
    }

    const response = await getMeetingNote(
      {
        token: session.token,
        baseUrl: session.baseUrl,
      },
      noteId,
    );

    setNote(response);
    setForm(meetingNoteToForm(response));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please sign in before editing this meeting note.');
      return;
    }

    setSaving(true);

    try {
      const existingAttendees = note?.attendees ?? [];
      const existingActionItems = note?.actionItems ?? [];

      await updateMeetingNote(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        noteId,
        buildCorePayload(form),
      );

      await Promise.all(
        existingAttendees.map((attendee) =>
          removeMeetingAttendee(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            noteId,
            attendee.id,
          ),
        ),
      );

      await Promise.all(
        buildAttendees(form).map((attendee) =>
          addMeetingAttendee(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            noteId,
            attendee,
          ),
        ),
      );

      await Promise.all(
        existingActionItems.map((item) =>
          removeMeetingActionItem(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            noteId,
            item.id,
          ),
        ),
      );

      await Promise.all(
        buildActionItems(form).map((item) =>
          addMeetingActionItem(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            noteId,
            item,
          ),
        ),
      );

      setSuccess('Meeting note updated successfully.');
      await refreshNote();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to update meeting note.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Meeting Note"
        actions={
          <>
            <Link
              href={note ? `/meeting-notes/${note.id}` : '#'}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Details
            </Link>
            <Link
              href="/meeting-notes"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Meeting Notes
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading meeting note...
        </div>
      ) : note ? (
        <MeetingNoteForm
          mode="edit"
          values={form}
          events={events}
          users={users}
          saving={saving}
          error={error}
          success={success}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Meeting note not found.
        </div>
      )}
    </div>
  );
}

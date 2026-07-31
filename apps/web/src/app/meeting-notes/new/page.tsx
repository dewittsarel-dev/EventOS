'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { MeetingNoteForm, emptyMeetingNoteForm, type MeetingNoteFormValues } from '../../../components/meeting-notes/meeting-note-form';
import { createMeetingNote } from '../../../lib/meeting-notes-api';
import { listEvents } from '../../../lib/events-api';
import { listOrganizationUsers } from '../../../lib/organization-users-api';
import type { EventRecord } from '../../../lib/events-types';
import type { OrganizationUserRecord } from '../../../lib/organization-users-types';

function buildPayload(values: MeetingNoteFormValues) {
  return {
    organizationId: values.organizationId,
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
    attendees: values.attendees
      .filter((attendee) => attendee.name.trim())
      .map((attendee) => ({
        name: attendee.name.trim(),
        email: attendee.email.trim() || undefined,
        roleOrOrganization: attendee.roleOrOrganization.trim() || undefined,
        attendanceStatus: attendee.attendanceStatus,
      })),
    actionItems: values.actionItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        assignedUserId: item.assignedUserId || undefined,
        assignedContactName: item.assignedContactName.trim() || undefined,
        dueDate: item.dueDate ? new Date(`${item.dueDate}T00:00:00.000Z`).toISOString() : undefined,
        priority: item.priority,
        status: item.status,
        linkedTaskId: item.linkedTaskId || undefined,
      })),
  };
}

export default function NewMeetingNotePage() {
  const { session } = useAppSession();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<OrganizationUserRecord[]>([]);
  const [form, setForm] = useState<MeetingNoteFormValues>(emptyMeetingNoteForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hasEvents = events.length > 0;

  useEffect(() => {
    async function loadLookups() {
      if (!session.token || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [eventsResponse, usersResponse] = await Promise.all([
          listEvents(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            { organizationId: session.organizationId, page: 1, limit: 200 },
          ),
          listOrganizationUsers(
            {
              token: session.token,
              baseUrl: session.baseUrl,
            },
            session.organizationId,
          ),
        ]);

        setEvents(eventsResponse.data);
        setUsers(usersResponse.data);
        setForm(emptyMeetingNoteForm(session.organizationId));
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Failed to load lookup data.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLookups();
  }, [session.baseUrl, session.organizationId, session.token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    if (!form.eventId) {
      setError('You must first create at least one Event before creating a Meeting Note.');
      return;
    }

    setSaving(true);

    try {
      const created = await createMeetingNote(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        buildPayload(form),
      );

      setSuccess('Meeting note created successfully.');
      setForm(emptyMeetingNoteForm(session.organizationId));
      if (typeof window !== 'undefined') {
        window.location.assign(`/meeting-notes/${created.id}`);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to create meeting note.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Meeting Note"
        actions={
          <Link
            href="/meeting-notes"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Meeting Notes
          </Link>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Select an organization in the header to create meeting notes.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading lookup data...
        </div>
      ) : null}

      {!loading && hasEvents === false ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p>You must first create at least one Event before creating a Meeting Note.</p>
          <Link
            href="/events/new"
            className="mt-3 inline-flex rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Create Event
          </Link>
        </div>
      ) : null}

      <MeetingNoteForm
        mode="create"
        values={form}
        events={events}
        users={users}
        saving={saving}
        submitDisabled={!hasEvents || !form.eventId}
        error={error}
        success={success}
        onChange={setForm}
        onSubmit={onSubmit}
      />
    </div>
  );
}

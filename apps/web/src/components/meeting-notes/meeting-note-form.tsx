'use client';

import type { FormEvent } from 'react';
import { MEETING_ACTION_ITEM_PRIORITIES, MEETING_ACTION_ITEM_STATUSES, MEETING_ATTENDEE_STATUSES, MEETING_TYPES, type MeetingActionItemPriority, type MeetingActionItemStatus, type MeetingAttendeeStatus, type MeetingNoteRecord, type MeetingType } from '../../lib/meeting-notes-types';
import type { EventRecord } from '../../lib/events-types';
import type { OrganizationUserRecord } from '../../lib/organization-users-types';

export type MeetingAttendeeFormValue = {
  id?: string;
  name: string;
  email: string;
  roleOrOrganization: string;
  attendanceStatus: MeetingAttendeeStatus;
};

export type MeetingActionItemFormValue = {
  id?: string;
  description: string;
  assignedUserId: string;
  assignedContactName: string;
  dueDate: string;
  priority: MeetingActionItemPriority;
  status: MeetingActionItemStatus;
  linkedTaskId: string;
};

export type MeetingNoteFormValues = {
  organizationId: string;
  eventId: string;
  title: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: MeetingType;
  summary: string;
  discussionNotes: string;
  decisions: string;
  nextMeetingDate: string;
  attendees: MeetingAttendeeFormValue[];
  actionItems: MeetingActionItemFormValue[];
};

type MeetingNoteFormProps = {
  mode: 'create' | 'edit';
  values: MeetingNoteFormValues;
  events: EventRecord[];
  users: OrganizationUserRecord[];
  saving: boolean;
  submitDisabled?: boolean;
  error: string;
  success: string;
  onChange: (next: MeetingNoteFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function emptyAttendee(): MeetingAttendeeFormValue {
  return {
    name: '',
    email: '',
    roleOrOrganization: '',
    attendanceStatus: 'Invited',
  };
}

function emptyActionItem(): MeetingActionItemFormValue {
  return {
    description: '',
    assignedUserId: '',
    assignedContactName: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Open',
    linkedTaskId: '',
  };
}

function valueOrEmpty(value: string | null | undefined) {
  return value ?? '';
}

export function meetingNoteToForm(note: MeetingNoteRecord): MeetingNoteFormValues {
  return {
    organizationId: note.organizationId,
    eventId: note.eventId,
    title: note.title,
    meetingDate: note.meetingDate.slice(0, 10),
    startTime: valueOrEmpty(note.startTime),
    endTime: valueOrEmpty(note.endTime),
    location: valueOrEmpty(note.location),
    meetingType: note.meetingType,
    summary: valueOrEmpty(note.summary),
    discussionNotes: valueOrEmpty(note.discussionNotes),
    decisions: valueOrEmpty(note.decisions),
    nextMeetingDate: valueOrEmpty(note.nextMeetingDate)?.slice(0, 10),
    attendees: note.attendees.map((attendee) => ({
      id: attendee.id,
      name: attendee.name,
      email: valueOrEmpty(attendee.email),
      roleOrOrganization: valueOrEmpty(attendee.roleOrOrganization),
      attendanceStatus: attendee.attendanceStatus,
    })),
    actionItems: note.actionItems.map((item) => ({
      id: item.id,
      description: item.description,
      assignedUserId: valueOrEmpty(item.assignedUserId),
      assignedContactName: valueOrEmpty(item.assignedContactName),
      dueDate: valueOrEmpty(item.dueDate)?.slice(0, 10),
      priority: item.priority,
      status: item.status,
      linkedTaskId: valueOrEmpty(item.linkedTaskId),
    })),
  };
}

export function emptyMeetingNoteForm(organizationId = ''): MeetingNoteFormValues {
  return {
    organizationId,
    eventId: '',
    title: '',
    meetingDate: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingType: 'Client Meeting',
    summary: '',
    discussionNotes: '',
    decisions: '',
    nextMeetingDate: '',
    attendees: [emptyAttendee()],
    actionItems: [emptyActionItem()],
  };
}

export function MeetingNoteForm({
  mode,
  values,
  events,
  users,
  saving,
  submitDisabled,
  error,
  success,
  onChange,
  onSubmit,
}: MeetingNoteFormProps) {
  return (
    <form className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {mode === 'create' ? 'Create Meeting Note' : 'Edit Meeting Note'}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Capture discussion, attendees, decisions and follow-up work for an event.
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          1. Meeting Information
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Event
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.eventId}
              onChange={(event) => onChange({ ...values, eventId: event.target.value })}
              required
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-700">
            Meeting Type
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.meetingType}
              onChange={(event) =>
                onChange({ ...values, meetingType: event.target.value as MeetingType })
              }
              required
            >
              {MEETING_TYPES.map((meetingType) => (
                <option key={meetingType} value={meetingType}>
                  {meetingType}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Title
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.title}
              onChange={(event) => onChange({ ...values, title: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-zinc-700">
            Meeting Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.meetingDate}
              onChange={(event) => onChange({ ...values, meetingDate: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-zinc-700">
            Start Time
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.startTime}
              onChange={(event) => onChange({ ...values, startTime: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-700">
            End Time
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.endTime}
              onChange={(event) => onChange({ ...values, endTime: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Location
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.location}
              onChange={(event) => onChange({ ...values, location: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            2. Attendees
          </h3>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-xs hover:bg-zinc-100"
            onClick={() => onChange({ ...values, attendees: [...values.attendees, emptyAttendee()] })}
          >
            Add Attendee
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {values.attendees.map((attendee, index) => (
            <div key={attendee.id ?? index} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-4">
              <label className="text-sm text-zinc-700">
                Name
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={attendee.name}
                  onChange={(event) => {
                    const next = [...values.attendees];
                    next[index] = { ...attendee, name: event.target.value };
                    onChange({ ...values, attendees: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Email
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={attendee.email}
                  onChange={(event) => {
                    const next = [...values.attendees];
                    next[index] = { ...attendee, email: event.target.value };
                    onChange({ ...values, attendees: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Role / Organization
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={attendee.roleOrOrganization}
                  onChange={(event) => {
                    const next = [...values.attendees];
                    next[index] = { ...attendee, roleOrOrganization: event.target.value };
                    onChange({ ...values, attendees: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Attendance
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={attendee.attendanceStatus}
                  onChange={(event) => {
                    const next = [...values.attendees];
                    next[index] = {
                      ...attendee,
                      attendanceStatus: event.target.value as MeetingAttendeeStatus,
                    };
                    onChange({ ...values, attendees: next });
                  }}
                >
                  {MEETING_ATTENDEE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-4">
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => onChange({ ...values, attendees: values.attendees.filter((_, current) => current !== index) })}
                  disabled={values.attendees.length === 1}
                >
                  Remove Attendee
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          3. Discussion and Summary
        </h3>
        <div className="mt-4 grid gap-4">
          <label className="text-sm text-zinc-700">
            Summary
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              rows={3}
              value={values.summary}
              onChange={(event) => onChange({ ...values, summary: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-700">
            Discussion Notes
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              rows={5}
              value={values.discussionNotes}
              onChange={(event) => onChange({ ...values, discussionNotes: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">4. Decisions</h3>
        <textarea
          className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2"
          rows={4}
          value={values.decisions}
          onChange={(event) => onChange({ ...values, decisions: event.target.value })}
        />
      </section>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            5. Action Items
          </h3>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-xs hover:bg-zinc-100"
            onClick={() => onChange({ ...values, actionItems: [...values.actionItems, emptyActionItem()] })}
          >
            Add Action Item
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {values.actionItems.map((item, index) => (
            <div key={item.id ?? index} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-3">
              <label className="text-sm text-zinc-700 md:col-span-3">
                Description
                <textarea
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  rows={2}
                  value={item.description}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, description: event.target.value };
                    onChange({ ...values, actionItems: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Assigned User
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.assignedUserId}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, assignedUserId: event.target.value };
                    onChange({ ...values, actionItems: next });
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.name ?? user.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-zinc-700">
                Contact Name
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.assignedContactName}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, assignedContactName: event.target.value };
                    onChange({ ...values, actionItems: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Due Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.dueDate}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, dueDate: event.target.value };
                    onChange({ ...values, actionItems: next });
                  }}
                />
              </label>
              <label className="text-sm text-zinc-700">
                Priority
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.priority}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, priority: event.target.value as MeetingActionItemPriority };
                    onChange({ ...values, actionItems: next });
                  }}
                >
                  {MEETING_ACTION_ITEM_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-zinc-700">
                Status
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.status}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, status: event.target.value as MeetingActionItemStatus };
                    onChange({ ...values, actionItems: next });
                  }}
                >
                  {MEETING_ACTION_ITEM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-zinc-700 md:col-span-3">
                Linked Task ID
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={item.linkedTaskId}
                  onChange={(event) => {
                    const next = [...values.actionItems];
                    next[index] = { ...item, linkedTaskId: event.target.value };
                    onChange({ ...values, actionItems: next });
                  }}
                />
              </label>
              <div className="md:col-span-3">
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => onChange({ ...values, actionItems: values.actionItems.filter((_, current) => current !== index) })}
                  disabled={values.actionItems.length === 1}
                >
                  Remove Action Item
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          6. Follow-up
        </h3>
        <label className="mt-4 block text-sm text-zinc-700">
          Next Meeting Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.nextMeetingDate}
            onChange={(event) => onChange({ ...values, nextMeetingDate: event.target.value })}
          />
        </label>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={saving || submitDisabled}
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Meeting Note' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

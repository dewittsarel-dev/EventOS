import { describe, expect, it } from 'vitest';
import { emptyMeetingNoteForm, meetingNoteToForm } from './meeting-note-form';

describe('meeting note form helpers', () => {
  it('builds a blank form with one attendee and one action item row', () => {
    const form = emptyMeetingNoteForm('org-1');

    expect(form).toMatchObject({
      organizationId: 'org-1',
      eventId: '',
      title: '',
      attendees: [{ attendanceStatus: 'Invited' }],
      actionItems: [{ priority: 'Medium', status: 'Open' }],
    });
  });

  it('maps a meeting note record into form values', () => {
    const form = meetingNoteToForm({
      id: 'note-1',
      organizationId: 'org-1',
      organizationName: 'EventOS',
      eventId: 'event-1',
      eventName: 'Gamma Expo',
      title: 'Kickoff',
      meetingDate: '2026-12-20T00:00:00.000Z',
      startTime: '08:00',
      endTime: '09:00',
      location: 'Boardroom',
      meetingType: 'Client Meeting',
      summary: 'Summary',
      discussionNotes: 'Notes',
      decisions: 'Decisions',
      nextMeetingDate: '2026-12-27T00:00:00.000Z',
      createdByUserId: 'user-1',
      createdByUserName: 'Alice Admin',
      attendeeCount: 1,
      openActionItemCount: 1,
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
      organization: { id: 'org-1', name: 'EventOS' },
      event: { id: 'event-1', title: 'Gamma Expo' },
      createdBy: { id: 'user-1', name: 'Alice Admin', email: 'alice@example.com' },
      attendees: [
        {
          id: 'attendee-1',
          name: 'Bob Client',
          email: 'bob@example.com',
          roleOrOrganization: 'Client',
          attendanceStatus: 'Attended',
        },
      ],
      actionItems: [
        {
          id: 'action-1',
          description: 'Send quote',
          assignedUserId: 'user-1',
          assignedUserName: 'Alice Admin',
          assignedContactName: null,
          dueDate: '2026-12-21T00:00:00.000Z',
          priority: 'High',
          status: 'Open',
          linkedTaskId: null,
          linkedTask: null,
        },
      ],
    });

    expect(form).toMatchObject({
      organizationId: 'org-1',
      eventId: 'event-1',
      title: 'Kickoff',
      meetingDate: '2026-12-20',
      nextMeetingDate: '2026-12-27',
      attendees: [
        {
          name: 'Bob Client',
          email: 'bob@example.com',
          roleOrOrganization: 'Client',
          attendanceStatus: 'Attended',
        },
      ],
      actionItems: [
        {
          description: 'Send quote',
          assignedUserId: 'user-1',
          dueDate: '2026-12-21',
          priority: 'High',
          status: 'Open',
        },
      ],
    });
  });
});
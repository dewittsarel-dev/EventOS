export type MeetingType =
  | 'Client Meeting'
  | 'Internal Planning'
  | 'Supplier Meeting'
  | 'Site Visit'
  | 'Briefing'
  | 'Debrief'
  | 'Other';

export type MeetingAttendeeStatus = 'Attended' | 'Invited' | 'Apology' | 'Optional';

export type MeetingActionItemStatus = 'Open' | 'InProgress' | 'Completed' | 'Cancelled';

export type MeetingActionItemPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type MeetingAttendeeRecord = {
  id: string;
  name: string;
  email: string | null;
  roleOrOrganization: string | null;
  attendanceStatus: MeetingAttendeeStatus;
};

export type MeetingTaskRecord = {
  id: string;
  title: string;
  status: string;
};

export type MeetingActionItemRecord = {
  id: string;
  description: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedContactName: string | null;
  dueDate: string | null;
  priority: MeetingActionItemPriority;
  status: MeetingActionItemStatus;
  linkedTaskId: string | null;
  linkedTask: MeetingTaskRecord | null;
};

export type MeetingNoteListItemRecord = {
  id: string;
  organizationId: string;
  organizationName: string;
  eventId: string;
  eventName: string;
  title: string;
  meetingDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  meetingType: MeetingType;
  summary: string | null;
  discussionNotes: string | null;
  decisions: string | null;
  nextMeetingDate: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  attendeeCount: number;
  openActionItemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MeetingNoteRecord = MeetingNoteListItemRecord & {
  organization: { id: string; name: string };
  event: { id: string; title: string };
  createdBy: { id: string; name: string | null; email: string };
  attendees: MeetingAttendeeRecord[];
  actionItems: MeetingActionItemRecord[];
};

export type MeetingNoteListResponse = {
  data: MeetingNoteListItemRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type MeetingNotePayload = {
  organizationId: string;
  eventId: string;
  title: string;
  meetingDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingType: MeetingType;
  summary?: string;
  discussionNotes?: string;
  decisions?: string;
  nextMeetingDate?: string;
  attendees?: MeetingAttendeePayload[];
  actionItems?: MeetingActionItemPayload[];
};

export type MeetingAttendeePayload = {
  name: string;
  email?: string;
  roleOrOrganization?: string;
  attendanceStatus: MeetingAttendeeStatus;
};

export type MeetingActionItemPayload = {
  description: string;
  assignedUserId?: string;
  assignedContactName?: string;
  dueDate?: string;
  priority: MeetingActionItemPriority;
  status: MeetingActionItemStatus;
  linkedTaskId?: string;
};

export type MeetingActionItemUpdatePayload = MeetingActionItemPayload;

export type MeetingAttendeeUpdatePayload = MeetingAttendeePayload;

export const MEETING_TYPES: MeetingType[] = [
  'Client Meeting',
  'Internal Planning',
  'Supplier Meeting',
  'Site Visit',
  'Briefing',
  'Debrief',
  'Other',
];

export const MEETING_ATTENDEE_STATUSES: MeetingAttendeeStatus[] = [
  'Attended',
  'Invited',
  'Apology',
  'Optional',
];

export const MEETING_ACTION_ITEM_STATUSES: MeetingActionItemStatus[] = [
  'Open',
  'InProgress',
  'Completed',
  'Cancelled',
];

export const MEETING_ACTION_ITEM_PRIORITIES: MeetingActionItemPriority[] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];

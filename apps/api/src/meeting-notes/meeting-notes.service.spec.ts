import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MeetingNotesService } from './meeting-notes.service';

describe('MeetingNotesService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const eventId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const noteId = 'mmmmmmmm-mmmm-4mmm-8mmm-mmmmmmmmmmmm';
  const attendeeId = 'tttttttt-tttt-4ttt-8ttt-tttttttttttt';
  const actionItemId = 'iiiiiiii-iiii-4iii-8iii-iiiiiiiiiiii';

  const prisma = {
    membership: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    task: { create: jest.fn(), findUnique: jest.fn() },
    meetingNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    meetingAttendee: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    meetingActionItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: MeetingNotesService;

  function makeNote(overrides: Record<string, unknown> = {}) {
    return {
      id: noteId,
      organizationId,
      eventId,
      title: 'Planning Sync',
      meetingDate: new Date('2026-08-01T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '10:00',
      location: 'Boardroom',
      meetingType: 'ClientMeeting',
      summary: 'Summary',
      discussionNotes: 'Notes',
      decisions: 'Decisions',
      nextMeetingDate: null,
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: { id: organizationId, name: 'Org One' },
      event: { id: eventId, title: 'Launch Event' },
      createdBy: { id: userId, name: 'User One', email: 'user@example.com' },
      attendees: [],
      actionItems: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MeetingNotesService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.meetingNote.findUnique.mockResolvedValue(makeNote());
  });

  it('creates a meeting note when access checks pass', async () => {
    prisma.meetingNote.create.mockResolvedValue(makeNote());

    const result = await service.create(userId, {
      organizationId,
      eventId,
      title: 'Planning Sync',
      meetingDate: '2026-08-01T09:00:00.000Z',
      meetingType: 'Client Meeting',
    });

    expect(prisma.meetingNote.create).toHaveBeenCalled();
    expect(result.title).toBe('Planning Sync');
  });

  it('lists notes for the organization', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.meetingNote.findMany.mockResolvedValue([makeNote()]);
    prisma.meetingNote.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 1,
      limit: 10,
      search: 'Planning',
      sort: 'newest',
    });

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
    expect(result.data[0].title).toBe('Planning Sync');
  });

  it('throws forbidden if the user is outside the organization', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(service.findOne(userId, noteId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('prevents duplicate action item conversion', async () => {
    prisma.meetingNote.findUnique.mockResolvedValue(
      makeNote({
        actionItems: [
          {
            id: actionItemId,
            description: 'Confirm venue',
            assignedUserId: null,
            assignedContactName: null,
            dueDate: null,
            priority: 'High',
            status: 'Open',
            linkedTaskId: 'task-1',
            assignedUser: null,
            linkedTask: {
              id: 'task-1',
              title: 'Confirm venue',
              status: 'Todo',
            },
          },
        ],
      }),
    );
    prisma.meetingActionItem.findFirst.mockResolvedValue({
      id: actionItemId,
      meetingNoteId: noteId,
      linkedTaskId: 'task-1',
    });

    await expect(
      service.convertActionItemToTask(userId, noteId, actionItemId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws not found for missing attendee', async () => {
    prisma.meetingAttendee.findFirst.mockResolvedValue(null);

    await expect(
      service.updateAttendee(userId, noteId, attendeeId, {
        name: 'Guest',
        attendanceStatus: 'Attended',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

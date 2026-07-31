import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  MeetingActionItemPriority as PrismaMeetingActionItemPriority,
  MeetingActionItemStatus as PrismaMeetingActionItemStatus,
  MeetingType as PrismaMeetingType,
  Prisma,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMeetingNoteDto,
  MeetingActionItemInputDto,
  MeetingAttendeeInputDto,
} from './dto/create-meeting-note.dto';
import {
  FindMeetingNotesQueryDto,
  MeetingSortOrder,
} from './dto/find-meeting-notes-query.dto';
import { MeetingType } from './dto/meeting-note-type.enum';
import { UpdateMeetingNoteDto } from './dto/update-meeting-note.dto';

const MEETING_NOTE_INCLUDE = {
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
  event: {
    select: {
      id: true,
      title: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  attendees: true,
  actionItems: {
    include: {
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      linkedTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
} as const;

type MeetingNoteWithRelations = Prisma.MeetingNoteGetPayload<{
  include: typeof MEETING_NOTE_INCLUDE;
}>;

@Injectable()
export class MeetingNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateMeetingNoteDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);
    await this.ensureEventOwnership(data.eventId, data.organizationId);

    const created = await this.prisma.meetingNote.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId,
        title: data.title,
        meetingDate: new Date(data.meetingDate),
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        location: data.location ?? null,
        meetingType: this.toPrismaMeetingType(data.meetingType),
        summary: data.summary ?? null,
        discussionNotes: data.discussionNotes ?? null,
        decisions: data.decisions ?? null,
        nextMeetingDate: data.nextMeetingDate
          ? new Date(data.nextMeetingDate)
          : null,
        createdByUserId: userId,
        attendees: data.attendees
          ? {
              create: data.attendees.map((attendee) =>
                this.mapAttendeeInput(attendee),
              ),
            }
          : undefined,
        actionItems: data.actionItems
          ? {
              create: await this.mapActionItemInputs(
                data.actionItems,
                data.organizationId,
              ),
            }
          : undefined,
      },
      include: MEETING_NOTE_INCLUDE,
    });

    return this.toResponse(created);
  }

  async findAll(userId: string, query: FindMeetingNotesQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.MeetingNoteWhereInput = {
      organizationId: query.organizationId,
      ...(query.eventId ? { eventId: query.eventId } : {}),
      ...(query.meetingType
        ? { meetingType: this.toPrismaMeetingType(query.meetingType) }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            meetingDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                summary: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                discussionNotes: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                location: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const orderBy =
      query.sort === MeetingSortOrder.Oldest
        ? ({ createdAt: 'asc' } as const)
        : query.sort === MeetingSortOrder.Upcoming
          ? ({ meetingDate: 'asc' } as const)
          : ({ createdAt: 'desc' } as const);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.meetingNote.findMany({
        where,
        include: MEETING_NOTE_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.meetingNote.count({ where }),
    ]);

    return {
      data: data.map((note) => this.toListItem(note)),
      meta: { page, limit, total },
    };
  }

  async findOne(userId: string, id: string) {
    const note = await this.findMeetingNoteOrThrow(id);
    await this.ensureOrganizationAccess(userId, note.organizationId);
    return this.toResponse(note);
  }

  async update(userId: string, id: string, data: UpdateMeetingNoteDto) {
    const note = await this.findMeetingNoteOrThrow(id);
    await this.ensureOrganizationAccess(userId, note.organizationId);

    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, note.organizationId);
    }

    const updated = await this.prisma.meetingNote.update({
      where: { id },
      data: {
        eventId: data.eventId,
        title: data.title,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
        startTime:
          data.startTime === null ? null : (data.startTime ?? undefined),
        endTime: data.endTime === null ? null : (data.endTime ?? undefined),
        location: data.location === null ? null : (data.location ?? undefined),
        meetingType: data.meetingType
          ? this.toPrismaMeetingType(data.meetingType)
          : undefined,
        summary: data.summary === null ? null : (data.summary ?? undefined),
        discussionNotes:
          data.discussionNotes === null
            ? null
            : (data.discussionNotes ?? undefined),
        decisions:
          data.decisions === null ? null : (data.decisions ?? undefined),
        nextMeetingDate:
          data.nextMeetingDate === null
            ? null
            : data.nextMeetingDate
              ? new Date(data.nextMeetingDate)
              : undefined,
      },
      include: MEETING_NOTE_INCLUDE,
    });

    return this.toResponse(updated);
  }

  async remove(userId: string, id: string) {
    const note = await this.findMeetingNoteOrThrow(id);
    await this.ensureOrganizationAccess(userId, note.organizationId);
    await this.prisma.meetingNote.delete({ where: { id: note.id } });
  }

  async addAttendee(userId: string, id: string, data: MeetingAttendeeInputDto) {
    const note = await this.findNoteForMutation(userId, id);

    await this.prisma.meetingAttendee.create({
      data: {
        meetingNoteId: note.id,
        name: data.name,
        email: data.email ?? null,
        roleOrOrganization: data.roleOrOrganization ?? null,
        attendanceStatus: data.attendanceStatus,
      },
    });

    return this.findOne(userId, note.id);
  }

  async updateAttendee(
    userId: string,
    id: string,
    attendeeId: string,
    data: MeetingAttendeeInputDto,
  ) {
    const note = await this.findNoteForMutation(userId, id);
    const attendee = await this.prisma.meetingAttendee.findFirst({
      where: { id: attendeeId, meetingNoteId: note.id },
    });

    if (!attendee) {
      throw new NotFoundException(
        `Meeting attendee with id ${attendeeId} not found`,
      );
    }

    await this.prisma.meetingAttendee.update({
      where: { id: attendee.id },
      data: {
        name: data.name,
        email: data.email ?? null,
        roleOrOrganization: data.roleOrOrganization ?? null,
        attendanceStatus: data.attendanceStatus,
      },
    });

    return this.findOne(userId, note.id);
  }

  async removeAttendee(userId: string, id: string, attendeeId: string) {
    const note = await this.findNoteForMutation(userId, id);
    const attendee = await this.prisma.meetingAttendee.findFirst({
      where: { id: attendeeId, meetingNoteId: note.id },
    });

    if (!attendee) {
      throw new NotFoundException(
        `Meeting attendee with id ${attendeeId} not found`,
      );
    }

    await this.prisma.meetingAttendee.delete({ where: { id: attendee.id } });
  }

  async addActionItem(
    userId: string,
    id: string,
    data: MeetingActionItemInputDto,
  ) {
    const note = await this.findNoteForMutation(userId, id);

    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
        note.organizationId,
      );
    }

    if (data.linkedTaskId) {
      await this.ensureTaskOwnership(data.linkedTaskId, note.organizationId);
      await this.ensureLinkedTaskAvailable(data.linkedTaskId);
    }

    await this.prisma.meetingActionItem.create({
      data: {
        meetingNoteId: note.id,
        description: data.description,
        assignedUserId: data.assignedUserId ?? null,
        assignedContactName: data.assignedContactName ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
        linkedTaskId: data.linkedTaskId ?? null,
      },
    });

    return this.findOne(userId, note.id);
  }

  async updateActionItem(
    userId: string,
    id: string,
    actionItemId: string,
    data: MeetingActionItemInputDto,
  ) {
    const note = await this.findNoteForMutation(userId, id);
    const actionItem = await this.prisma.meetingActionItem.findFirst({
      where: { id: actionItemId, meetingNoteId: note.id },
    });

    if (!actionItem) {
      throw new NotFoundException(
        `Meeting action item with id ${actionItemId} not found`,
      );
    }

    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
        note.organizationId,
      );
    }

    if (data.linkedTaskId && data.linkedTaskId !== actionItem.linkedTaskId) {
      await this.ensureTaskOwnership(data.linkedTaskId, note.organizationId);
      await this.ensureLinkedTaskAvailable(data.linkedTaskId);
    }

    await this.prisma.meetingActionItem.update({
      where: { id: actionItem.id },
      data: {
        description: data.description,
        assignedUserId: data.assignedUserId ?? null,
        assignedContactName: data.assignedContactName ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
        linkedTaskId: data.linkedTaskId ?? actionItem.linkedTaskId,
      },
    });

    return this.findOne(userId, note.id);
  }

  async removeActionItem(userId: string, id: string, actionItemId: string) {
    const note = await this.findNoteForMutation(userId, id);
    const actionItem = await this.prisma.meetingActionItem.findFirst({
      where: { id: actionItemId, meetingNoteId: note.id },
    });

    if (!actionItem) {
      throw new NotFoundException(
        `Meeting action item with id ${actionItemId} not found`,
      );
    }

    await this.prisma.meetingActionItem.delete({
      where: { id: actionItem.id },
    });
  }

  async convertActionItemToTask(
    userId: string,
    id: string,
    actionItemId: string,
  ) {
    const note = await this.findNoteForMutation(userId, id);
    const actionItem = await this.prisma.meetingActionItem.findFirst({
      where: { id: actionItemId, meetingNoteId: note.id },
    });

    if (!actionItem) {
      throw new NotFoundException(
        `Meeting action item with id ${actionItemId} not found`,
      );
    }

    if (actionItem.linkedTaskId) {
      throw new BadRequestException(
        'Action item has already been converted to a task',
      );
    }

    const status = this.mapActionItemStatusToTaskStatus(actionItem.status);
    const priority = this.mapActionItemPriorityToTaskPriority(
      actionItem.priority,
    );

    const createdTask = await this.prisma.task.create({
      data: {
        organizationId: note.organizationId,
        eventId: note.eventId,
        assignedUserId: actionItem.assignedUserId,
        createdByUserId: userId,
        title: actionItem.description,
        description: actionItem.assignedContactName
          ? `Action item for ${actionItem.assignedContactName}`
          : actionItem.description,
        dueDate: actionItem.dueDate,
        priority,
        status,
        completedAt: status === 'Completed' ? new Date() : null,
      },
    });

    await this.prisma.meetingActionItem.update({
      where: { id: actionItem.id },
      data: {
        linkedTaskId: createdTask.id,
        status: 'Completed',
      },
    });

    return this.findOne(userId, note.id);
  }

  private async findNoteForMutation(userId: string, id: string) {
    const note = await this.findMeetingNoteOrThrow(id);
    await this.ensureOrganizationAccess(userId, note.organizationId);
    return note;
  }

  private async findMeetingNoteOrThrow(id: string) {
    const note = await this.prisma.meetingNote.findUnique({
      where: { id },
      include: MEETING_NOTE_INCLUDE,
    });

    if (!note) {
      throw new NotFoundException(`Meeting note with id ${id} not found`);
    }

    return note;
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (!membership) {
      throw new ForbiddenException(
        `No access to organization ${organizationId}`,
      );
    }
  }

  private async ensureEventOwnership(eventId: string, organizationId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    });

    if (!event || event.organizationId !== organizationId) {
      throw new ForbiddenException(`No access to event ${eventId}`);
    }
  }

  private async ensureAssignedUserInOrganization(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (!membership) {
      throw new ForbiddenException(`No access to user ${userId}`);
    }
  }

  private async ensureTaskOwnership(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, organizationId: true },
    });

    if (!task || task.organizationId !== organizationId) {
      throw new ForbiddenException(`No access to task ${taskId}`);
    }
  }

  private async ensureLinkedTaskAvailable(taskId: string) {
    const existing = await this.prisma.meetingActionItem.findFirst({
      where: { linkedTaskId: taskId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Task has already been linked to another meeting action item',
      );
    }
  }

  private mapAttendeeInput(data: MeetingAttendeeInputDto) {
    return {
      name: data.name,
      email: data.email ?? null,
      roleOrOrganization: data.roleOrOrganization ?? null,
      attendanceStatus: data.attendanceStatus,
    };
  }

  private async mapActionItemInputs(
    items: MeetingActionItemInputDto[],
    organizationId: string,
  ) {
    return Promise.all(
      items.map(async (item) => {
        if (item.assignedUserId) {
          await this.ensureAssignedUserInOrganization(
            item.assignedUserId,
            organizationId,
          );
        }

        if (item.linkedTaskId) {
          await this.ensureTaskOwnership(item.linkedTaskId, organizationId);
          await this.ensureLinkedTaskAvailable(item.linkedTaskId);
        }

        return {
          description: item.description,
          assignedUserId: item.assignedUserId ?? null,
          assignedContactName: item.assignedContactName ?? null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          priority: item.priority,
          status: item.status,
          linkedTaskId: item.linkedTaskId ?? null,
        };
      }),
    );
  }

  private toListItem(note: MeetingNoteWithRelations) {
    return {
      id: note.id,
      organizationId: note.organizationId,
      organizationName: note.organization.name,
      eventId: note.eventId,
      eventName: note.event.title,
      title: note.title,
      meetingDate: note.meetingDate,
      startTime: note.startTime,
      endTime: note.endTime,
      location: note.location,
      meetingType: this.fromPrismaMeetingType(note.meetingType),
      summary: note.summary,
      discussionNotes: note.discussionNotes,
      decisions: note.decisions,
      nextMeetingDate: note.nextMeetingDate,
      createdByUserId: note.createdByUserId,
      createdByUserName: note.createdBy.name,
      attendeeCount: note.attendees.length,
      openActionItemCount: note.actionItems.filter(
        (item) => item.status !== 'Completed' && item.status !== 'Cancelled',
      ).length,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  private toResponse(note: MeetingNoteWithRelations) {
    return {
      ...this.toListItem(note),
      organization: note.organization,
      event: note.event,
      createdBy: note.createdBy,
      attendees: note.attendees.map((attendee) => ({
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        roleOrOrganization: attendee.roleOrOrganization,
        attendanceStatus: attendee.attendanceStatus,
      })),
      actionItems: note.actionItems.map((item) => ({
        id: item.id,
        description: item.description,
        assignedUserId: item.assignedUserId,
        assignedUserName:
          item.assignedUser?.name ?? item.assignedUser?.email ?? null,
        assignedContactName: item.assignedContactName,
        dueDate: item.dueDate,
        priority: item.priority,
        status: item.status,
        linkedTaskId: item.linkedTaskId,
        linkedTask: item.linkedTask,
      })),
    };
  }

  private toPrismaMeetingType(value: MeetingType): PrismaMeetingType {
    if (value === MeetingType.ClientMeeting) return 'ClientMeeting';
    if (value === MeetingType.InternalPlanning) return 'InternalPlanning';
    if (value === MeetingType.SupplierMeeting) return 'SupplierMeeting';
    if (value === MeetingType.SiteVisit) return 'SiteVisit';
    if (value === MeetingType.Briefing) return 'Briefing';
    if (value === MeetingType.Debrief) return 'Debrief';
    return 'Other';
  }

  private fromPrismaMeetingType(value: PrismaMeetingType) {
    if (value === 'ClientMeeting') return MeetingType.ClientMeeting;
    if (value === 'InternalPlanning') return MeetingType.InternalPlanning;
    if (value === 'SupplierMeeting') return MeetingType.SupplierMeeting;
    if (value === 'SiteVisit') return MeetingType.SiteVisit;
    if (value === 'Briefing') return MeetingType.Briefing;
    if (value === 'Debrief') return MeetingType.Debrief;
    return MeetingType.Other;
  }

  private mapActionItemStatusToTaskStatus(
    status: PrismaMeetingActionItemStatus,
  ): TaskStatus {
    if (status === 'InProgress') return 'InProgress';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    return 'Todo';
  }

  private mapActionItemPriorityToTaskPriority(
    priority: PrismaMeetingActionItemPriority,
  ): TaskPriority {
    if (priority === 'Low') return 'Low';
    if (priority === 'Medium') return 'Medium';
    if (priority === 'High') return 'High';
    return 'Critical';
  }
}

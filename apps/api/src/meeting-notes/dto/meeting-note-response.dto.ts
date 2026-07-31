import { ApiProperty } from '@nestjs/swagger';
import { MeetingActionItemPriority } from './meeting-action-item-priority.enum';
import { MeetingActionItemStatus } from './meeting-action-item-status.enum';
import { MeetingAttendeeStatus } from './meeting-attendee-status.enum';
import { MeetingType } from './meeting-note-type.enum';

export class MeetingNoteOrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class MeetingNoteEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class MeetingNoteUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty()
  email: string;
}

export class MeetingNoteTaskDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  status: string;
}

export class MeetingAttendeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  roleOrOrganization: string | null;

  @ApiProperty({ enum: MeetingAttendeeStatus })
  attendanceStatus: MeetingAttendeeStatus;
}

export class MeetingActionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  assignedUserId: string | null;

  @ApiProperty({ nullable: true })
  assignedUserName: string | null;

  @ApiProperty({ nullable: true })
  assignedContactName: string | null;

  @ApiProperty({ nullable: true })
  dueDate: Date | null;

  @ApiProperty({ enum: MeetingActionItemPriority })
  priority: MeetingActionItemPriority;

  @ApiProperty({ enum: MeetingActionItemStatus })
  status: MeetingActionItemStatus;

  @ApiProperty({ nullable: true })
  linkedTaskId: string | null;

  @ApiProperty({ nullable: true, type: MeetingNoteTaskDto })
  linkedTask: MeetingNoteTaskDto | null;
}

export class MeetingNoteListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  organizationName: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  meetingDate: Date;

  @ApiProperty({ nullable: true })
  startTime: string | null;

  @ApiProperty({ nullable: true })
  endTime: string | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ enum: MeetingType })
  meetingType: MeetingType;

  @ApiProperty({ nullable: true })
  summary: string | null;

  @ApiProperty({ nullable: true })
  discussionNotes: string | null;

  @ApiProperty({ nullable: true })
  decisions: string | null;

  @ApiProperty({ nullable: true })
  nextMeetingDate: Date | null;

  @ApiProperty()
  createdByUserId: string;

  @ApiProperty({ nullable: true })
  createdByUserName: string | null;

  @ApiProperty()
  attendeeCount: number;

  @ApiProperty()
  openActionItemCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MeetingNoteResponseDto extends MeetingNoteListItemDto {
  @ApiProperty({ type: MeetingNoteOrganizationDto })
  organization: MeetingNoteOrganizationDto;

  @ApiProperty({ type: MeetingNoteEventDto })
  event: MeetingNoteEventDto;

  @ApiProperty({ type: MeetingNoteUserDto })
  createdBy: MeetingNoteUserDto;

  @ApiProperty({ type: MeetingAttendeeResponseDto, isArray: true })
  attendees: MeetingAttendeeResponseDto[];

  @ApiProperty({ type: MeetingActionItemResponseDto, isArray: true })
  actionItems: MeetingActionItemResponseDto[];
}

export class MeetingNoteListResponseDto {
  @ApiProperty({ type: MeetingNoteListItemDto, isArray: true })
  data: MeetingNoteListItemDto[];

  @ApiProperty({ example: { page: 1, limit: 10, total: 42 } })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

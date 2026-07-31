import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MeetingActionItemPriority } from './meeting-action-item-priority.enum';
import { MeetingActionItemStatus } from './meeting-action-item-status.enum';
import { MeetingAttendeeStatus } from './meeting-attendee-status.enum';
import { MeetingType } from './meeting-note-type.enum';

export class MeetingAttendeeInputDto {
  @ApiProperty({ example: 'Lara Croft' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'lara@example.com', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Client', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  roleOrOrganization?: string;

  @ApiProperty({ enum: MeetingAttendeeStatus })
  @IsEnum(MeetingAttendeeStatus)
  attendanceStatus: MeetingAttendeeStatus;
}

export class MeetingActionItemInputDto {
  @ApiProperty({ example: 'Confirm venue load-in window' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ example: 'Lara Croft', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedContactName?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ enum: MeetingActionItemPriority })
  @IsEnum(MeetingActionItemPriority)
  priority: MeetingActionItemPriority;

  @ApiProperty({ enum: MeetingActionItemStatus })
  @IsEnum(MeetingActionItemStatus)
  status: MeetingActionItemStatus;

  @ApiPropertyOptional({ example: 'task-id', nullable: true })
  @IsOptional()
  @IsUUID()
  linkedTaskId?: string;
}

export class CreateMeetingNoteDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 'Kickoff Planning Meeting' })
  @IsString()
  @MaxLength(180)
  title: string;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z' })
  @IsDateString()
  meetingDate: string;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  startTime?: string;

  @ApiPropertyOptional({ example: '10:30', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  endTime?: string;

  @ApiPropertyOptional({ example: 'Boardroom', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string;

  @ApiProperty({ enum: MeetingType })
  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  discussionNotes?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  decisions?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;

  @ApiPropertyOptional({ type: MeetingAttendeeInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MeetingAttendeeInputDto)
  attendees?: MeetingAttendeeInputDto[];

  @ApiPropertyOptional({ type: MeetingActionItemInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MeetingActionItemInputDto)
  actionItems?: MeetingActionItemInputDto[];
}

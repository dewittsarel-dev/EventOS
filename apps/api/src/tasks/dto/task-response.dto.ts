import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';

export class TaskResponseDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'event-1' })
  eventId: string;

  @ApiProperty({ example: 'contact-1', nullable: true })
  assignedContactId: string | null;

  @ApiProperty({ example: 'quote-1', nullable: true })
  quotationId: string | null;

  @ApiProperty({ example: 'Confirm florist logistics' })
  title: string;

  @ApiProperty({
    example: 'Ensure setup is complete by 14:00.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '2026-11-10T12:00:00.000Z' })
  dueDate: Date;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.Normal })
  priority: TaskPriority;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.Todo })
  status: TaskStatus;

  @ApiProperty({ example: null, nullable: true })
  completedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class TaskListResponseDto {
  @ApiProperty({ type: TaskResponseDto, isArray: true })
  data: TaskResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 42,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

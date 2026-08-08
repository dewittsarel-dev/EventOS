import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../events/dto/event-status.enum';
import { TaskPriority } from '../../tasks/dto/task-priority.enum';
import { TaskStatus } from '../../tasks/dto/task-status.enum';

export class DashboardStatsDto {
  @ApiProperty({ example: 4 })
  eventsThisMonth: number;

  @ApiProperty({ example: 9 })
  upcomingEvents: number;

  @ApiProperty({ example: 5 })
  openQuotations: number;

  @ApiProperty({ example: 3 })
  tasksDueToday: number;

  @ApiProperty({ example: 2 })
  overdueTasks: number;

  @ApiProperty({ example: 8 })
  activeSuppliers: number;

  @ApiProperty({ example: 24 })
  totalContacts: number;
}

export class DashboardAttentionItemDto {
  @ApiProperty({ example: 'task-overdue-task-1' })
  id: string;

  @ApiProperty({ example: 'Attention' })
  severity: string;

  @ApiProperty({ example: 'Confirm venue access' })
  title: string;

  @ApiProperty({ example: 'This assigned task is overdue since 2026-08-01.' })
  explanation: string;

  @ApiProperty({ example: 'Open task' })
  actionLabel: string;

  @ApiProperty({ example: '/tasks/task-1' })
  actionHref: string;

  @ApiProperty({ example: 'Work' })
  source: string;
}

export class DashboardAttentionDto {
  @ApiProperty({ enum: ['Clear', 'NeedsAttention'] })
  status: 'Clear' | 'NeedsAttention';

  @ApiProperty({ example: '2 items need your attention.' })
  summary: string;

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  items: DashboardAttentionItemDto[];

  @ApiProperty({ example: '2026-08-08T08:00:00.000Z' })
  generatedAt: Date;

  @ApiProperty({ example: false })
  automatedActionsPerformed: false;
}

export class DashboardUpcomingEventDto {
  @ApiProperty({ example: 'event-1' })
  id: string;

  @ApiProperty({ example: 'Summer Gala' })
  event: string;

  @ApiProperty({ example: 'Alicia Keys' })
  client: string;

  @ApiProperty({ example: '2026-08-10T11:00:00.000Z' })
  date: Date;

  @ApiProperty({ enum: EventStatus, example: EventStatus.Planned })
  status: EventStatus;
}

export class DashboardTaskItemDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'Confirm venue access' })
  title: string;

  @ApiProperty({ example: '2026-08-01T08:00:00.000Z', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.Todo })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.High })
  priority: TaskPriority;
}

export class DashboardMyTasksDto {
  @ApiProperty({ type: [DashboardTaskItemDto] })
  dueToday: DashboardTaskItemDto[];

  @ApiProperty({ type: [DashboardTaskItemDto] })
  overdue: DashboardTaskItemDto[];

  @ApiProperty({ type: [DashboardTaskItemDto] })
  dueThisWeek: DashboardTaskItemDto[];
}

export class DashboardActivityItemDto {
  @ApiProperty({ example: 'event-created' })
  type: string;

  @ApiProperty({ example: 'Event created' })
  action: string;

  @ApiProperty({ example: 'Summer Gala' })
  subject: string;

  @ApiProperty({ example: '2026-08-01T12:30:00.000Z' })
  occurredAt: Date;
}

export class DashboardCalendarEventDto {
  @ApiProperty({ example: 'event-1' })
  id: string;

  @ApiProperty({ example: 'Summer Gala' })
  title: string;

  @ApiProperty({ example: 'Alicia Keys' })
  client: string;

  @ApiProperty({ example: '2026-08-10T11:00:00.000Z' })
  date: Date;

  @ApiProperty({ enum: EventStatus, example: EventStatus.Planned })
  status: EventStatus;
}

export class DashboardCalendarDayDto {
  @ApiProperty({ example: '2026-08-10' })
  date: string;

  @ApiProperty({ type: [DashboardCalendarEventDto] })
  events: DashboardCalendarEventDto[];
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: DashboardAttentionDto })
  attention: DashboardAttentionDto;

  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [DashboardUpcomingEventDto] })
  upcomingEvents: DashboardUpcomingEventDto[];

  @ApiProperty({ type: DashboardMyTasksDto })
  myTasks: DashboardMyTasksDto;

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentActivity: DashboardActivityItemDto[];

  @ApiProperty({ type: [DashboardCalendarDayDto] })
  calendarPreview: DashboardCalendarDayDto[];
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import type {
  EventStatus,
  Prisma,
  QuotationStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';

const UPCOMING_EVENT_STATUSES: EventStatus[] = [
  'Draft',
  'Planned',
  'Confirmed',
];
const OPEN_QUOTATION_STATUSES: QuotationStatus[] = ['Draft', 'Sent'];
const OPEN_TASK_STATUSES: TaskStatus[] = ['Todo', 'InProgress', 'Waiting'];

type ActivityItem = {
  type: string;
  action: string;
  subject: string;
  occurredAt: Date;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, query: GetDashboardQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );
    const dayStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const nextDayStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    const weekEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 7,
        23,
        59,
        59,
        999,
      ),
    );

    const upcomingLimit = query.upcomingLimit ?? 5;
    const tasksLimit = query.tasksLimit ?? 6;
    const activityLimit = query.activityLimit ?? 12;

    const [
      eventsThisMonth,
      upcomingEventsCount,
      openQuotations,
      tasksDueToday,
      overdueTasks,
      activeSuppliers,
      totalContacts,
      upcomingEvents,
      myTasksDueToday,
      myTasksOverdue,
      myTasksDueThisWeek,
      recentEvents,
      recentSuppliers,
      recentContacts,
      recentQuotations,
      recentlyCompletedTasks,
      calendarEvents,
    ] = await Promise.all([
      this.prisma.event.count({
        where: {
          organizationId: query.organizationId,
          eventDate: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      }),
      this.prisma.event.count({
        where: {
          organizationId: query.organizationId,
          status: { in: UPCOMING_EVENT_STATUSES },
          startDateTime: { gte: now },
        },
      }),
      this.prisma.quotation.count({
        where: {
          organizationId: query.organizationId,
          status: { in: OPEN_QUOTATION_STATUSES },
          archivedAt: null,
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId: query.organizationId,
          status: { in: OPEN_TASK_STATUSES },
          archivedAt: null,
          dueDate: {
            gte: dayStart,
            lt: nextDayStart,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId: query.organizationId,
          status: { in: OPEN_TASK_STATUSES },
          archivedAt: null,
          dueDate: { lt: now },
        },
      }),
      this.prisma.supplier.count({
        where: {
          organizationId: query.organizationId,
          active: true,
        },
      }),
      this.prisma.contact.count({
        where: {
          organizationId: query.organizationId,
        },
      }),
      this.prisma.event.findMany({
        where: {
          organizationId: query.organizationId,
          status: { in: UPCOMING_EVENT_STATUSES },
          startDateTime: { gte: now },
        },
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startDateTime: 'asc' },
        take: upcomingLimit,
      }),
      this.prisma.task.findMany({
        where: {
          organizationId: query.organizationId,
          assignedUserId: userId,
          status: { in: OPEN_TASK_STATUSES },
          archivedAt: null,
          dueDate: {
            gte: dayStart,
            lt: nextDayStart,
          },
        },
        orderBy: { dueDate: 'asc' },
        take: tasksLimit,
      }),
      this.prisma.task.findMany({
        where: {
          organizationId: query.organizationId,
          assignedUserId: userId,
          status: { in: OPEN_TASK_STATUSES },
          archivedAt: null,
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
        take: tasksLimit,
      }),
      this.prisma.task.findMany({
        where: {
          organizationId: query.organizationId,
          assignedUserId: userId,
          status: { in: OPEN_TASK_STATUSES },
          archivedAt: null,
          dueDate: {
            gte: now,
            lte: weekEnd,
          },
        },
        orderBy: { dueDate: 'asc' },
        take: tasksLimit,
      }),
      this.prisma.event.findMany({
        where: { organizationId: query.organizationId },
        orderBy: { createdAt: 'desc' },
        take: activityLimit,
      }),
      this.prisma.supplier.findMany({
        where: { organizationId: query.organizationId },
        orderBy: { createdAt: 'desc' },
        take: activityLimit,
      }),
      this.prisma.contact.findMany({
        where: { organizationId: query.organizationId },
        orderBy: { createdAt: 'desc' },
        take: activityLimit,
      }),
      this.prisma.quotation.findMany({
        where: { organizationId: query.organizationId },
        orderBy: { createdAt: 'desc' },
        take: activityLimit,
      }),
      this.prisma.task.findMany({
        where: {
          organizationId: query.organizationId,
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: activityLimit,
      }),
      this.prisma.event.findMany({
        where: {
          organizationId: query.organizationId,
          status: { in: UPCOMING_EVENT_STATUSES },
          startDateTime: { gte: now },
        },
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startDateTime: 'asc' },
        take: 50,
      }),
    ]);

    return {
      stats: {
        eventsThisMonth,
        upcomingEvents: upcomingEventsCount,
        openQuotations,
        tasksDueToday,
        overdueTasks,
        activeSuppliers,
        totalContacts,
      },
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event.id,
        event: event.title,
        client: this.contactFullName(
          event.contact?.firstName,
          event.contact?.lastName,
        ),
        date: event.startDateTime,
        status: event.status,
      })),
      myTasks: {
        dueToday: myTasksDueToday.map((task) => this.mapTask(task)),
        overdue: myTasksOverdue.map((task) => this.mapTask(task)),
        dueThisWeek: myTasksDueThisWeek.map((task) => this.mapTask(task)),
      },
      recentActivity: this.buildRecentActivity({
        recentEvents,
        recentSuppliers,
        recentContacts,
        recentQuotations,
        recentlyCompletedTasks,
        limit: activityLimit,
      }),
      calendarPreview: this.buildCalendarPreview(calendarEvents),
    };
  }

  private mapTask(task: Prisma.TaskGetPayload<Record<string, never>>) {
    return {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    };
  }

  private buildRecentActivity(input: {
    recentEvents: Prisma.EventGetPayload<Record<string, never>>[];
    recentSuppliers: Prisma.SupplierGetPayload<Record<string, never>>[];
    recentContacts: Prisma.ContactGetPayload<Record<string, never>>[];
    recentQuotations: Prisma.QuotationGetPayload<Record<string, never>>[];
    recentlyCompletedTasks: Prisma.TaskGetPayload<Record<string, never>>[];
    limit: number;
  }) {
    const items: ActivityItem[] = [];

    items.push(
      ...input.recentEvents.map((event) => ({
        type: 'event-created',
        action: 'Event created',
        subject: event.title,
        occurredAt: event.createdAt,
      })),
    );

    items.push(
      ...input.recentSuppliers.map((supplier) => ({
        type: 'supplier-added',
        action: 'Supplier added',
        subject: supplier.companyName,
        occurredAt: supplier.createdAt,
      })),
    );

    items.push(
      ...input.recentContacts.map((contact) => ({
        type: 'contact-created',
        action: 'Contact created',
        subject: this.contactFullName(contact.firstName, contact.lastName),
        occurredAt: contact.createdAt,
      })),
    );

    items.push(
      ...input.recentQuotations.map((quotation) => ({
        type: 'quotation-created',
        action: 'Quotation created',
        subject: `${quotation.quoteNumber} ${quotation.title}`,
        occurredAt: quotation.createdAt,
      })),
    );

    items.push(
      ...input.recentlyCompletedTasks
        .filter((task) => task.completedAt)
        .map((task) => ({
          type: 'task-completed',
          action: 'Task completed',
          subject: task.title,
          occurredAt: task.completedAt as Date,
        })),
    );

    return items
      .sort(
        (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
      )
      .slice(0, input.limit);
  }

  private buildCalendarPreview(
    events: Array<
      Prisma.EventGetPayload<{
        include: {
          contact: {
            select: {
              firstName: true;
              lastName: true;
            };
          };
        };
      }>
    >,
  ) {
    const dayMap = new Map<string, typeof events>();

    for (const event of events) {
      const day = event.startDateTime.toISOString().slice(0, 10);
      const bucket = dayMap.get(day) ?? [];
      bucket.push(event);
      dayMap.set(day, bucket);
    }

    return Array.from(dayMap.entries())
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .slice(0, 7)
      .map(([date, dayEvents]) => ({
        date,
        events: dayEvents
          .sort(
            (left, right) =>
              left.startDateTime.getTime() - right.startDateTime.getTime(),
          )
          .map((event) => ({
            id: event.id,
            title: event.title,
            client: this.contactFullName(
              event.contact?.firstName,
              event.contact?.lastName,
            ),
            date: event.startDateTime,
            status: event.status,
          })),
      }));
  }

  private contactFullName(firstName?: string | null, lastName?: string | null) {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName.length > 0 ? fullName : 'Unknown client';
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}

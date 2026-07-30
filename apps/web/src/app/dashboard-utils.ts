import type { ContactRecord } from '@/lib/contacts-types';
import type { EventRecord } from '@/lib/events-types';
import type { QuotationRecord } from '@/lib/quotations-types';
import type { TaskRecord } from '@/lib/tasks-types';

export const ACTIVE_EVENT_STATUSES = ['Draft', 'Planned', 'Confirmed'] as const;
export const OPEN_QUOTATION_STATUSES = ['Draft', 'Sent'] as const;
export const OPEN_TASK_STATUSES = ['Todo', 'InProgress', 'Waiting'] as const;

const activeEventStatusSet = new Set<string>(ACTIVE_EVENT_STATUSES);

type DashboardSectionInput = {
  events: EventRecord[];
  tasks: TaskRecord[];
  quotations: QuotationRecord[];
  contacts: ContactRecord[];
  now?: Date;
};

type DashboardMetricInput = {
  activeEventsTotal: number;
  upcomingEventsTotal: number;
  openQuotationsTotal: number;
  overdueTasksTotal: number;
  dueTodayTasksTotal: number;
  contacts: ContactRecord[];
  now?: Date;
};

export type EventTimelineDay = {
  date: string;
  events: EventRecord[];
};

function time(value: string) {
  return new Date(value).getTime();
}

function isSameUtcDay(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function isClosedTask(task: TaskRecord) {
  return task.status === 'Completed' || task.status === 'Cancelled';
}

export function getUpcomingEvents(
  events: EventRecord[],
  now = new Date(),
  limit = 6,
) {
  return events
    .filter(
      (event) =>
        activeEventStatusSet.has(event.status) &&
        time(event.startDateTime) >= now.getTime(),
    )
    .sort((left, right) => time(left.startDateTime) - time(right.startDateTime))
    .slice(0, limit);
}

export function getOverdueAndUrgentTasks(
  tasks: TaskRecord[],
  now = new Date(),
  limit = 8,
) {
  return tasks
    .filter((task) => {
      if (isClosedTask(task)) {
        return false;
      }

      if (!task.dueDate) {
        return false;
      }

      const overdue = time(task.dueDate) < now.getTime();
      const urgent = task.priority === 'Critical';

      return overdue || urgent;
    })
    .sort((left, right) => {
      const leftDueTime = left.dueDate ? time(left.dueDate) : Number.MAX_SAFE_INTEGER;
      const rightDueTime = right.dueDate ? time(right.dueDate) : Number.MAX_SAFE_INTEGER;
      const leftOverdue = leftDueTime < now.getTime() ? 1 : 0;
      const rightOverdue = rightDueTime < now.getTime() ? 1 : 0;

      if (leftOverdue !== rightOverdue) {
        return rightOverdue - leftOverdue;
      }

      return leftDueTime - rightDueTime;
    })
    .slice(0, limit);
}

export function getRecentQuotations(quotations: QuotationRecord[], limit = 6) {
  return quotations
    .slice()
    .sort((left, right) => time(right.updatedAt) - time(left.updatedAt))
    .slice(0, limit);
}

export function getRecentContacts(contacts: ContactRecord[], limit = 6) {
  return contacts
    .slice()
    .sort((left, right) => time(right.createdAt) - time(left.createdAt))
    .slice(0, limit);
}

export function countRecentContacts(contacts: ContactRecord[], now = new Date()) {
  const threshold = new Date(now);
  threshold.setUTCDate(threshold.getUTCDate() - 30);

  return contacts.filter((contact) => time(contact.createdAt) >= threshold.getTime())
    .length;
}

export function countOverdueTasks(tasks: TaskRecord[], now = new Date()) {
  return tasks.filter(
    (task) => !isClosedTask(task) && task.dueDate && time(task.dueDate) < now.getTime(),
  ).length;
}

export function countTasksDueToday(tasks: TaskRecord[], now = new Date()) {
  return tasks.filter((task) => {
    if (isClosedTask(task)) {
      return false;
    }

    if (!task.dueDate) {
      return false;
    }

    return isSameUtcDay(new Date(task.dueDate), now);
  }).length;
}

export function buildEventTimelinePreview(
  events: EventRecord[],
  now = new Date(),
  maxDays = 5,
) {
  const dayMap = new Map<string, EventRecord[]>();

  for (const event of getUpcomingEvents(events, now, 30)) {
    const day = event.startDateTime.slice(0, 10);
    const dayList = dayMap.get(day) ?? [];
    dayList.push(event);
    dayMap.set(day, dayList);
  }

  return Array.from(dayMap.entries())
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .slice(0, maxDays)
    .map(([date, dayEvents]) => ({
      date,
      events: dayEvents.sort(
        (left, right) => time(left.startDateTime) - time(right.startDateTime),
      ),
    }));
}

export function buildDashboardSections(input: DashboardSectionInput) {
  const now = input.now ?? new Date();

  return {
    upcomingEvents: getUpcomingEvents(input.events, now),
    overdueAndUrgentTasks: getOverdueAndUrgentTasks(input.tasks, now),
    recentQuotations: getRecentQuotations(input.quotations),
    recentContacts: getRecentContacts(input.contacts),
    eventTimeline: buildEventTimelinePreview(input.events, now),
  };
}

export function buildDashboardMetrics(input: DashboardMetricInput) {
  return {
    totalActiveEvents: input.activeEventsTotal,
    upcomingEvents: input.upcomingEventsTotal,
    openQuotations: input.openQuotationsTotal,
    overdueTasks: input.overdueTasksTotal,
    tasksDueToday: input.dueTodayTasksTotal,
    recentContacts: countRecentContacts(input.contacts, input.now),
  };
}

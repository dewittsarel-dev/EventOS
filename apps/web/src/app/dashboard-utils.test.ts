import { describe, expect, it } from 'vitest';
import {
  buildDashboardMetrics,
  buildDashboardSections,
  countOverdueTasks,
  countTasksDueToday,
} from './dashboard-utils';
import type { ContactRecord } from '@/lib/contacts-types';
import type { EventRecord } from '@/lib/events-types';
import type { QuotationRecord } from '@/lib/quotations-types';
import type { TaskRecord } from '@/lib/tasks-types';

const now = new Date('2026-07-30T10:00:00.000Z');

function event(partial: Partial<EventRecord>): EventRecord {
  return {
    id: 'event-1',
    organizationId: 'org-1',
    contactId: 'contact-1',
    title: 'Event',
    description: null,
    startDateTime: '2026-07-31T09:00:00.000Z',
    endDateTime: '2026-07-31T12:00:00.000Z',
    location: null,
    status: 'Planned',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

function task(partial: Partial<TaskRecord>): TaskRecord {
  return {
    id: 'task-1',
    organizationId: 'org-1',
    eventId: 'event-1',
    assignedContactId: null,
    quotationId: null,
    title: 'Task',
    description: null,
    dueDate: '2026-07-30T15:00:00.000Z',
    priority: 'Normal',
    status: 'Todo',
    completedAt: null,
    archivedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

function quotation(partial: Partial<QuotationRecord>): QuotationRecord {
  return {
    id: 'quote-1',
    quoteNumber: 'Q-001',
    organizationId: 'org-1',
    contactId: 'contact-1',
    eventId: 'event-1',
    title: 'Quote',
    notes: null,
    status: 'Draft',
    issueDate: '2026-07-01T00:00:00.000Z',
    expiryDate: null,
    subtotalCents: 1000,
    discountCents: 0,
    taxRatePercent: 0,
    taxCents: 0,
    totalCents: 1000,
    archivedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    items: [],
    ...partial,
  };
}

function contact(partial: Partial<ContactRecord>): ContactRecord {
  return {
    id: 'contact-1',
    organizationId: 'org-1',
    firstName: 'Alex',
    lastName: 'Meyer',
    email: null,
    phone: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

describe('dashboard-utils', () => {
  it('counts overdue tasks excluding completed and cancelled', () => {
    const tasks = [
      task({ dueDate: '2026-07-29T12:00:00.000Z', status: 'Todo' }),
      task({ id: 'task-2', dueDate: '2026-07-29T12:00:00.000Z', status: 'Completed' }),
      task({ id: 'task-3', dueDate: '2026-07-28T12:00:00.000Z', status: 'InProgress' }),
      task({ id: 'task-4', dueDate: '2026-08-01T12:00:00.000Z', status: 'Todo' }),
    ];

    expect(countOverdueTasks(tasks, now)).toBe(2);
  });

  it('counts tasks due today for open statuses only', () => {
    const tasks = [
      task({ dueDate: '2026-07-30T01:00:00.000Z', status: 'Todo' }),
      task({ id: 'task-2', dueDate: '2026-07-30T22:00:00.000Z', status: 'Waiting' }),
      task({ id: 'task-3', dueDate: '2026-07-30T12:00:00.000Z', status: 'Completed' }),
      task({ id: 'task-4', dueDate: '2026-07-31T01:00:00.000Z', status: 'Todo' }),
    ];

    expect(countTasksDueToday(tasks, now)).toBe(2);
  });

  it('builds sections with upcoming events, urgent tasks, and sorted recent records', () => {
    const sections = buildDashboardSections({
      now,
      events: [
        event({ id: 'e-1', title: 'Past Event', startDateTime: '2026-07-01T09:00:00.000Z' }),
        event({ id: 'e-2', title: 'Upcoming A', startDateTime: '2026-08-01T09:00:00.000Z' }),
        event({ id: 'e-3', title: 'Cancelled Upcoming', status: 'Cancelled', startDateTime: '2026-08-02T09:00:00.000Z' }),
        event({ id: 'e-4', title: 'Upcoming B', startDateTime: '2026-08-01T11:00:00.000Z' }),
      ],
      tasks: [
        task({ id: 't-1', dueDate: '2026-07-29T09:00:00.000Z', priority: 'Normal', status: 'Todo' }),
        task({ id: 't-2', dueDate: '2026-08-02T09:00:00.000Z', priority: 'Urgent', status: 'InProgress' }),
        task({ id: 't-3', dueDate: '2026-08-03T09:00:00.000Z', priority: 'High', status: 'Todo' }),
      ],
      quotations: [
        quotation({ id: 'q-1', updatedAt: '2026-07-29T00:00:00.000Z' }),
        quotation({ id: 'q-2', updatedAt: '2026-07-30T00:00:00.000Z' }),
      ],
      contacts: [
        contact({ id: 'c-1', createdAt: '2026-07-10T00:00:00.000Z' }),
        contact({ id: 'c-2', createdAt: '2026-07-28T00:00:00.000Z' }),
      ],
    });

    expect(sections.upcomingEvents.map((item) => item.id)).toEqual(['e-2', 'e-4']);
    expect(sections.overdueAndUrgentTasks.map((item) => item.id)).toEqual(['t-1', 't-2']);
    expect(sections.recentQuotations.map((item) => item.id)).toEqual(['q-2', 'q-1']);
    expect(sections.recentContacts.map((item) => item.id)).toEqual(['c-2', 'c-1']);
    expect(sections.eventTimeline[0]?.events.map((item) => item.id)).toEqual(['e-2', 'e-4']);
  });

  it('builds summary metrics including recent contacts window', () => {
    const metrics = buildDashboardMetrics({
      now,
      activeEventsTotal: 12,
      upcomingEventsTotal: 5,
      openQuotationsTotal: 7,
      overdueTasksTotal: 3,
      dueTodayTasksTotal: 2,
      contacts: [
        contact({ id: 'c-1', createdAt: '2026-07-29T00:00:00.000Z' }),
        contact({ id: 'c-2', createdAt: '2026-06-01T00:00:00.000Z' }),
      ],
    });

    expect(metrics).toEqual({
      totalActiveEvents: 12,
      upcomingEvents: 5,
      openQuotations: 7,
      overdueTasks: 3,
      tasksDueToday: 2,
      recentContacts: 1,
    });
  });
});

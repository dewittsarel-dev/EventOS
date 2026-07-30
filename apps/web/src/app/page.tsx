'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ACTIVE_EVENT_STATUSES,
  OPEN_QUOTATION_STATUSES,
  OPEN_TASK_STATUSES,
  buildDashboardMetrics,
  buildDashboardSections,
  getUpcomingEvents,
} from './dashboard-utils';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listContacts } from '@/lib/contacts-api';
import { listEvents } from '@/lib/events-api';
import type { ContactRecord } from '@/lib/contacts-types';
import type { EventRecord, EventStatus } from '@/lib/events-types';
import { listQuotations } from '@/lib/quotations-api';
import type { QuotationRecord, QuotationStatus } from '@/lib/quotations-types';
import { listTasks } from '@/lib/tasks-api';
import type { TaskRecord, TaskStatus } from '@/lib/tasks-types';

type DashboardData = {
  contacts: ContactRecord[];
  activeEvents: EventRecord[];
  tasks: TaskRecord[];
  recentQuotations: QuotationRecord[];
  snapshotNow: number;
  metrics: {
    totalActiveEvents: number;
    upcomingEvents: number;
    openQuotations: number;
    overdueTasks: number;
    tasksDueToday: number;
    recentContacts: number;
  };
};

const defaultData: DashboardData = {
  contacts: [],
  activeEvents: [],
  tasks: [],
  recentQuotations: [],
  snapshotNow: 0,
  metrics: {
    totalActiveEvents: 0,
    upcomingEvents: 0,
    openQuotations: 0,
    overdueTasks: 0,
    tasksDueToday: 0,
    recentContacts: 0,
  },
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function fullContactName(contact: ContactRecord) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
}

function quotationStatusClass(status: QuotationStatus) {
  if (status === 'Accepted') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Sent') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'Rejected' || status === 'Expired') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-zinc-100 text-zinc-700';
}

function taskPriorityClass(priority: TaskRecord['priority']) {
  if (priority === 'Urgent') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'High') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-zinc-100 text-zinc-700';
}

function eventStatusClass(status: EventStatus) {
  if (status === 'Confirmed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Planned') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'Draft') {
    return 'bg-zinc-100 text-zinc-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function utcDayBounds(now: Date) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

async function fetchAllActiveEvents(
  options: { token: string; baseUrl: string },
  organizationId: string,
) {
  const all: EventRecord[] = [];

  for (const status of ACTIVE_EVENT_STATUSES) {
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await listEvents(options, {
        organizationId,
        status,
        page,
        limit,
        sort: 'asc',
      });

      all.push(...response.data);

      if (response.data.length < limit || page * limit >= response.meta.total) {
        break;
      }

      page += 1;
    }
  }

  return all;
}

async function countOpenTasks(
  options: { token: string; baseUrl: string },
  organizationId: string,
  range?: { dueFrom?: string; dueTo?: string },
) {
  const counts = await Promise.all(
    OPEN_TASK_STATUSES.map(async (status) => {
      const response = await listTasks(options, {
        organizationId,
        status: status as TaskStatus,
        page: 1,
        limit: 1,
        includeArchived: false,
        dueFrom: range?.dueFrom,
        dueTo: range?.dueTo,
      });

      return response.meta.total;
    }),
  );

  return counts.reduce((total, count) => total + count, 0);
}

async function countOpenQuotations(
  options: { token: string; baseUrl: string },
  organizationId: string,
) {
  const counts = await Promise.all(
    OPEN_QUOTATION_STATUSES.map(async (status) => {
      const response = await listQuotations(options, {
        organizationId,
        status: status as QuotationStatus,
        page: 1,
        limit: 1,
        includeArchived: false,
      });

      return response.meta.total;
    }),
  );

  return counts.reduce((total, count) => total + count, 0);
}

export default function DashboardPage() {
  const { session, user, activeOrganization } = useAppSession();
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      if (!session.token || !session.organizationId) {
        setData(defaultData);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const now = new Date();
        const dueDay = utcDayBounds(now);
        const options = {
          token: session.token,
          baseUrl: session.baseUrl,
        };

        const [contactsResponse, activeEvents, tasksResponse, recentQuotationsResponse] =
          await Promise.all([
            listContacts(options, session.organizationId),
            fetchAllActiveEvents(options, session.organizationId),
            listTasks(options, {
              organizationId: session.organizationId,
              page: 1,
              limit: 200,
              sortBy: 'dueDate',
              sort: 'asc',
              includeArchived: false,
            }),
            listQuotations(options, {
              organizationId: session.organizationId,
              page: 1,
              limit: 6,
              sortBy: 'updatedAt',
              sort: 'desc',
              includeArchived: false,
            }),
          ]);

        const [openQuotationsTotal, overdueTasksTotal, dueTodayTasksTotal] =
          await Promise.all([
            countOpenQuotations(options, session.organizationId),
            countOpenTasks(options, session.organizationId, {
              dueTo: now.toISOString(),
            }),
            countOpenTasks(options, session.organizationId, {
              dueFrom: dueDay.startIso,
              dueTo: dueDay.endIso,
            }),
          ]);

        const upcomingEventsTotal = getUpcomingEvents(
          activeEvents,
          now,
          Number.MAX_SAFE_INTEGER,
        ).length;

        setData({
          contacts: contactsResponse.data,
          activeEvents,
          tasks: tasksResponse.data,
          recentQuotations: recentQuotationsResponse.data,
          snapshotNow: now.getTime(),
          metrics: buildDashboardMetrics({
            activeEventsTotal: activeEvents.length,
            upcomingEventsTotal,
            openQuotationsTotal,
            overdueTasksTotal,
            dueTodayTasksTotal,
            contacts: contactsResponse.data,
            now,
          }),
        });
      } catch (requestError) {
        setData(defaultData);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load dashboard insights.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [session.baseUrl, session.organizationId, session.token]);

  const sections = useMemo(
    () =>
      buildDashboardSections({
        contacts: data.contacts,
        events: data.activeEvents,
        tasks: data.tasks,
        quotations: data.recentQuotations,
      }),
    [data],
  );

  const hasAnyData =
    data.contacts.length > 0 ||
    data.activeEvents.length > 0 ||
    data.tasks.length > 0 ||
    data.recentQuotations.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description="Command center for live ClientOS operations."
      />

      {!session.token || !session.organizationId ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Connect Workspace Context</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Save your bearer token and organization in the user menu to load real
            dashboard insights.
          </p>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_65%,#334155_100%)] p-5 text-zinc-100 shadow-sm md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  EventOS ClientOS
                </p>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                  Welcome back{user?.name ? `, ${user.name}` : ''}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {activeOrganization
                    ? `Operating in ${activeOrganization.name}.`
                    : `Organization ${session.organizationId}.`}
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                <Link
                  href="/contacts/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  New Contact
                </Link>
                <Link
                  href="/events/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  New Event
                </Link>
                <Link
                  href="/quotations/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  New Quotation
                </Link>
                <Link
                  href="/tasks/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  New Task
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total Active Events</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.totalActiveEvents}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Upcoming Events</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.upcomingEvents}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Open Quotations</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.openQuotations}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Overdue Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.overdueTasks}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Tasks Due Today</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.tasksDueToday}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Recent Contacts (30d)</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {data.metrics.recentContacts}
              </p>
            </article>
          </section>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
              Loading dashboard insights...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && !hasAnyData ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              No contacts, events, quotations, or tasks exist yet for this organization.
              Use the quick actions above to create your first records.
            </div>
          ) : null}

          <section className="grid min-w-0 gap-4 xl:grid-cols-2">
            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">Upcoming Events</h3>
                <Link href="/events" className="text-xs text-zinc-600 hover:text-zinc-900">
                  View all
                </Link>
              </div>
              {sections.upcomingEvents.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No upcoming events scheduled.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sections.upcomingEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {formatDateTime(event.startDateTime)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${eventStatusClass(event.status)}`}
                        >
                          {event.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">Overdue and Urgent Tasks</h3>
                <Link href="/tasks" className="text-xs text-zinc-600 hover:text-zinc-900">
                  View all
                </Link>
              </div>
              {sections.overdueAndUrgentTasks.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No overdue or urgent tasks right now.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sections.overdueAndUrgentTasks.map((task) => {
                    const overdue =
                      data.snapshotNow > 0 &&
                      new Date(task.dueDate).getTime() < data.snapshotNow;

                    return (
                      <li
                        key={task.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {task.title}
                            </p>
                            <p className="text-xs text-zinc-600">Due {formatDateTime(task.dueDate)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {overdue ? (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
                                Overdue
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] ${taskPriorityClass(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">Recent Quotations</h3>
                <Link href="/quotations" className="text-xs text-zinc-600 hover:text-zinc-900">
                  View all
                </Link>
              </div>
              {sections.recentQuotations.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No quotations created yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sections.recentQuotations.map((quotation) => (
                    <li
                      key={quotation.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {quotation.title}
                          </p>
                          <p className="text-xs text-zinc-600">{quotation.quoteNumber}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${quotationStatusClass(quotation.status)}`}
                        >
                          {quotation.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">Recent Contacts</h3>
                <Link href="/contacts" className="text-xs text-zinc-600 hover:text-zinc-900">
                  View all
                </Link>
              </div>
              {sections.recentContacts.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No contacts added yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sections.recentContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {fullContactName(contact) || 'Unnamed contact'}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {contact.email || contact.phone || 'No contact details'}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Added {formatDate(contact.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-zinc-900">Event Timeline Preview</h3>
              <Link href="/tasks/timeline" className="text-xs text-zinc-600 hover:text-zinc-900">
                Open timeline view
              </Link>
            </div>

            {sections.eventTimeline.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No upcoming event timeline entries.</p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sections.eventTimeline.map((day) => (
                  <article
                    key={day.date}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {formatDate(day.date)}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {day.events.map((event) => (
                        <li key={event.id} className="text-sm text-zinc-700">
                          <span className="font-medium text-zinc-900">{event.title}</span>
                          <span className="ml-2 text-xs text-zinc-500">
                            {new Date(event.startDateTime).toLocaleTimeString('en-ZA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

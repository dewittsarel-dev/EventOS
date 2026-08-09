'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/app-shell/page-header';
import { useAppSession } from '../components/app-shell/session-context';
import { getDashboardOverview } from '../lib/dashboard-api';
import type {
  DashboardOverviewResponse,
  DashboardTaskItem,
} from '../lib/dashboard-types';

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

function eventStatusClass(status: string) {
  if (status === 'Confirmed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Planned') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'Draft') {
    return 'bg-zinc-100 text-zinc-700';
  }

  if (status === 'Cancelled') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-amber-100 text-amber-700';
}

function taskPriorityClass(priority: DashboardTaskItem['priority']) {
  if (priority === 'Critical') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'High') {
    return 'bg-amber-100 text-amber-700';
  }

  if (priority === 'Medium') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-zinc-100 text-zinc-700';
}

function taskStatusClass(status: DashboardTaskItem['status']) {
  if (status === 'Completed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'InProgress') {
    return 'bg-sky-100 text-sky-700';
  }

  if (status === 'Waiting') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'Todo') {
    return 'bg-zinc-100 text-zinc-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function taskDueLabel(task: DashboardTaskItem) {
  if (!task.dueDate) {
    return 'No due date';
  }

  return formatDateTime(task.dueDate);
}

export default function DashboardPage() {
  const { session, user, activeOrganization } = useAppSession();
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!session.token || !session.organizationId) {
        if (!cancelled) {
          setOverview(null);
          setError('');
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError('');
      }

      try {
        const response = await getDashboardOverview(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          {
            organizationId: session.organizationId,
            upcomingLimit: 6,
            tasksLimit: 6,
            activityLimit: 12,
          },
        );

        if (!cancelled) {
          setOverview(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setOverview(null);
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load dashboard insights.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [session.baseUrl, session.organizationId, session.token]);

  const hasAnyData =
    !!overview &&
    (overview.upcomingEvents.length > 0 ||
      overview.myTasks.dueToday.length > 0 ||
      overview.myTasks.overdue.length > 0 ||
      overview.myTasks.dueThisWeek.length > 0 ||
      overview.recentActivity.length > 0 ||
      overview.calendarPreview.length > 0);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Home"
        description="What matters now, why it matters, and what to do next."
      />

      {!session.organizationId ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Choose your organization</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Select the organization you want to work in to see its events, tasks and priorities.
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

              <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
                <Link
                  href="/events/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Create Event
                </Link>
                <Link
                  href="/quotations/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Create Quotation
                </Link>
                <Link
                  href="/contacts/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Add Contact
                </Link>
                <Link
                  href="/suppliers/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Add Supplier
                </Link>
                <Link
                  href="/tasks/new"
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Create Task
                </Link>
              </div>
            </div>
          </section>

          {overview ? (
            <section
              className={`rounded-2xl border p-5 shadow-sm md:p-6 ${
                overview.attention.status === 'Clear'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
              aria-labelledby="attention-heading"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Today
                  </p>
                  <h2 id="attention-heading" className="mt-1 text-xl font-semibold text-zinc-900">
                    {overview.attention.summary}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    EventOS has not taken any action or approval on your behalf.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${overview.attention.status === 'Clear' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {overview.attention.status === 'Clear' ? 'All clear' : 'Needs attention'}
                </span>
              </div>

              {overview.attention.items.length ? (
                <ol className="mt-5 grid gap-3">
                  {overview.attention.items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                              {item.severity}
                            </span>
                            <span className="text-xs text-zinc-500">Source: {item.source}</span>
                          </div>
                          <h3 className="mt-2 font-semibold text-zinc-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-zinc-600">{item.explanation}</p>
                        </div>
                        <Link href={item.actionHref} className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700">
                          {item.actionLabel}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Events This Month</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.eventsThisMonth ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Upcoming Events</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.upcomingEvents ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Open Quotations</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.openQuotations ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Tasks Due Today</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.tasksDueToday ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Overdue Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.overdueTasks ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Active Suppliers</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.activeSuppliers ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total Contacts</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {overview?.stats.totalContacts ?? 0}
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
              No dashboard activity available for this organization yet. Use quick actions
              above to create your first event, quotation, contact, supplier, or task.
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
              {!overview || overview.upcomingEvents.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No upcoming events scheduled.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {overview.upcomingEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {event.event}
                          </p>
                          <p className="text-xs text-zinc-600">Client: {event.client}</p>
                          <p className="text-xs text-zinc-600">{formatDateTime(event.date)}</p>
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
                <h3 className="text-base font-semibold text-zinc-900">My Tasks</h3>
                <Link href="/tasks" className="text-xs text-zinc-600 hover:text-zinc-900">
                  View all
                </Link>
              </div>
              {!overview ? (
                <p className="mt-3 text-sm text-zinc-600">No tasks to display.</p>
              ) : (
                <>
                  <div className="grid gap-2 text-xs text-zinc-700 sm:grid-cols-3">
                    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                      Due today: {overview.myTasks.dueToday.length}
                    </div>
                    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                      Overdue: {overview.myTasks.overdue.length}
                    </div>
                    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                      Due this week: {overview.myTasks.dueThisWeek.length}
                    </div>
                  </div>

                  {overview.myTasks.dueThisWeek.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600">
                      No assigned tasks due in the next week.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {overview.myTasks.dueThisWeek.map((task) => (
                        <li
                          key={task.id}
                          className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-900">
                                {task.title}
                              </p>
                              <p className="text-xs text-zinc-600">Due {taskDueLabel(task)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] ${taskStatusClass(task.status)}`}
                              >
                                {task.status}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] ${taskPriorityClass(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">Recent Activity</h3>
              </div>
              {!overview || overview.recentActivity.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No recent activity available.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {overview.recentActivity.map((activity, index) => (
                    <li
                      key={`${activity.type}-${activity.occurredAt}-${index}`}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {activity.action}
                          </p>
                          <p className="text-xs text-zinc-600">{activity.subject}</p>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {formatDateTime(activity.occurredAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">My Task Focus</h3>
              </div>
              {!overview || overview.myTasks.overdue.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No overdue assigned tasks.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {overview.myTasks.overdue.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <p className="truncate text-sm font-medium text-zinc-900">{task.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Due {taskDueLabel(task)}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {task.status} - {task.priority}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-zinc-900">Calendar Preview</h3>
              <Link href="/events" className="text-xs text-zinc-600 hover:text-zinc-900">
                Open events
              </Link>
            </div>

            {!overview || overview.calendarPreview.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No upcoming calendar entries.</p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {overview.calendarPreview.map((day) => (
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
                          <span className="ml-2 text-xs text-zinc-500">{event.client}</span>
                          <span className="ml-2 text-xs text-zinc-500">
                            {new Date(event.date).toLocaleTimeString('en-ZA', {
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

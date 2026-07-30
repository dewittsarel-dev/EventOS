'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listEvents, listTasks } from '@/lib/tasks-api';
import type { EventOption, TaskRecord, TaskStatus } from '@/lib/tasks-types';

type TimelineItem = {
  day: string;
  tasks: TaskRecord[];
};

function normalizeDay(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function statusPill(status: TaskStatus) {
  if (status === 'Completed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Cancelled') {
    return 'bg-rose-100 text-rose-700';
  }

  if (status === 'InProgress') {
    return 'bg-sky-100 text-sky-700';
  }

  if (status === 'Waiting') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-zinc-100 text-zinc-700';
}

export default function TasksTimelinePage() {
  const { session } = useAppSession();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventId, setEventId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const params = new URLSearchParams(window.location.search);
    return params.get('eventId') ?? '';
  });
  const [includeCompleted, setIncludeCompleted] = useState(true);

  const timeline = useMemo(() => {
    const grouped = new Map<string, TaskRecord[]>();

    for (const task of tasks) {
      if (!includeCompleted && task.status === 'Completed') {
        continue;
      }

      if (!task.dueDate) {
        continue;
      }

      const day = normalizeDay(task.dueDate);
      const list = grouped.get(day) ?? [];
      list.push(task);
      grouped.set(day, list);
    }

    const items: TimelineItem[] = Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([day, groupedTasks]) => ({
        day,
        tasks: groupedTasks.sort((left, right) => {
          const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : 0;
          const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : 0;
          return leftDue - rightDue;
        }),
      }));

    return items;
  }, [tasks, includeCompleted]);

  async function loadTimelineData() {
    setError('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    setLoading(true);

    try {
      const [eventsResponse, tasksResponse] = await Promise.all([
        listEvents(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
        ),
        listTasks(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            eventId: eventId || undefined,
            sortBy: 'dueDate',
            sort: 'asc',
          },
        ),
      ]);

      setEvents(eventsResponse.data);
      setTasks(tasksResponse.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load timeline.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.token || !session.organizationId) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTimelineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, session.organizationId, eventId]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tasks Timeline"
        description="Chronological view of operational delivery tasks."
        actions={
          <>
            <Link
              href="/tasks"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Tasks
            </Link>
            <Link
              href="/tasks/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Create Task
            </Link>
          </>
        }
      />

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm text-zinc-700">
          Event filter
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm md:mt-6">
          <input
            type="checkbox"
            checked={includeCompleted}
            onChange={(event) => setIncludeCompleted(event.target.checked)}
          />
          Show completed tasks
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading timeline...
        </div>
      ) : timeline.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No tasks scheduled for this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((item) => (
            <section
              key={item.day}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-zinc-900">
                {new Date(item.day).toLocaleDateString()}
              </h2>

              <div className="mt-3 space-y-3">
                {item.tasks.map((task) => {
                  const overdue =
                    !!task.dueDate &&
                    task.status !== 'Completed' &&
                    task.status !== 'Cancelled' &&
                    new Date(task.dueDate).getTime() < Date.now();

                  return (
                    <article
                      key={task.id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900">{task.title}</h3>
                          <p className="text-xs text-zinc-600">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleTimeString()
                              : '-'}{' '}
                            - Priority {task.priority}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs ${statusPill(task.status)}`}
                          >
                            {task.status}
                          </span>
                          {overdue ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                              Overdue
                            </span>
                          ) : null}
                          <Link
                            href={`/tasks/${task.id}`}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            Open
                          </Link>
                        </div>
                      </div>

                      {task.description ? (
                        <p className="mt-2 text-sm text-zinc-600">{task.description}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

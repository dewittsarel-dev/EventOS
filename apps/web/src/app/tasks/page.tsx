'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  archiveTask,
  completeTask,
  deleteTask,
  listEvents,
  listTasks,
} from '@/lib/tasks-api';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type EventOption,
  type TaskPriority,
  type TaskRecord,
  type TaskSortBy,
  type TaskSortOrder,
  type TaskStatus,
} from '@/lib/tasks-types';

function priorityClass(priority: TaskPriority) {
  if (priority === 'Urgent') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'High') {
    return 'bg-amber-100 text-amber-700';
  }

  if (priority === 'Normal') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-zinc-100 text-zinc-700';
}

function statusClass(status: TaskStatus) {
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

export default function TasksPage() {
  const { session } = useAppSession();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortBy>('dueDate');
  const [sort, setSort] = useState<TaskSortOrder>('asc');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  async function loadTasks() {
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    setLoading(true);

    try {
      const response = await listTasks(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          page,
          limit,
          search,
          eventId: eventId || undefined,
          status,
          priority,
          dueFrom: dueFrom
            ? new Date(`${dueFrom}T00:00:00.000Z`).toISOString()
            : undefined,
          dueTo: dueTo
            ? new Date(`${dueTo}T23:59:59.000Z`).toISOString()
            : undefined,
          sortBy,
          sort,
          includeArchived,
        },
      );

      setTasks(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load tasks.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadEventOptions() {
      if (!session.token || !session.organizationId) {
        return;
      }

      try {
        const response = await listEvents(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
        );

        setEvents(response.data);
      } catch {
        // Keep filters usable even if event labels fail to load.
      }
    }

    void loadEventOptions();
  }, [session]);

  useEffect(() => {
    if (!session.token || !session.organizationId) {
      return;
    }

    // Query-driven refresh from pager and sort controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, session.organizationId, page, limit, sortBy, sort, includeArchived]);

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadTasks();
  }

  async function onComplete(task: TaskRecord) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await completeTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        task.id,
      );
      setSuccess('Task marked as completed.');
      await loadTasks();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to complete task.',
      );
    }
  }

  async function onArchive(task: TaskRecord) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await archiveTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        task.id,
      );
      setSuccess('Task archived.');
      await loadTasks();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive task.',
      );
    }
  }

  async function onDelete(task: TaskRecord) {
    if (!session.token) {
      setError('Please save Bearer token first.');
      return;
    }

    const confirmed = window.confirm('Delete this task permanently?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        task.id,
      );
      setSuccess('Task deleted.');
      await loadTasks();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete task.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tasks"
        description="Track execution work across events, contacts and quotations."
        actions={
          <>
            <Link
              href="/tasks/timeline"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
            >
              Open Timeline
            </Link>
            <Link
              href="/tasks/new"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Create Task
            </Link>
          </>
        }
      />

      <form
        onSubmit={onSearchSubmit}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-9"
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search title / description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
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

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {TASK_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as TaskPriority | 'ALL')
          }
        >
          <option value="ALL">All priorities</option>
          {TASK_PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dueFrom}
          onChange={(event) => setDueFrom(event.target.value)}
        />

        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dueTo}
          onChange={(event) => setDueTo(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as TaskSortBy)}
        >
          <option value="dueDate">Sort by due date</option>
          <option value="createdAt">Sort by created</option>
          <option value="updatedAt">Sort by updated</option>
          <option value="priority">Sort by priority</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as TaskSortOrder)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <input
          type="number"
          min={1}
          max={100}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value) || 10)}
        />

        <label className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Include archived
        </label>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No tasks found yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Due</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">{task.title}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {new Date(task.dueDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${priorityClass(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${statusClass(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/tasks/${task.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          href={`/tasks/${task.id}/edit`}
                        >
                          Edit
                        </Link>
                        {task.status === 'Completed' ? null : (
                          <button
                            type="button"
                            className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            onClick={() => void onComplete(task)}
                          >
                            Complete
                          </button>
                        )}
                        {task.archivedAt ? null : (
                          <button
                            type="button"
                            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => void onArchive(task)}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => void onDelete(task)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
            <p>
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

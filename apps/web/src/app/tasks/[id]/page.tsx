'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { archiveTask, completeTask, getTask } from '@/lib/tasks-api';
import type { TaskRecord } from '@/lib/tasks-types';

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const taskId = String(params.id);

  const { session } = useAppSession();
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOverdue = useMemo(() => {
    if (!task || task.status === 'Completed' || task.status === 'Cancelled') {
      return false;
    }

    // eslint-disable-next-line react-hooks/purity
    return new Date(task.dueDate).getTime() < Date.now();
  }, [task]);

  useEffect(() => {
    async function loadTask() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getTask(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          taskId,
        );

        setTask(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load task.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTask();
  }, [taskId, session]);

  async function onComplete() {
    if (!session.token || !task) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const updated = await completeTask(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        task.id,
      );

      setTask(updated);
      setSuccess('Task marked as completed.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to complete task.',
      );
    }
  }

  async function onArchive() {
    if (!session.token || !task) {
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

      setTask({ ...task, archivedAt: new Date().toISOString() });
      setSuccess('Task archived.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to archive task.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Task Details"
        actions={
          <>
            <Link
              href={`/tasks/${taskId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Task
            </Link>
            <Link
              href={`/tasks/timeline?eventId=${task?.eventId ?? ''}`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Open Timeline
            </Link>
            <Link
              href="/tasks"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading task...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : task ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{task.title}</h2>
              <p className="text-sm text-zinc-600">Status: {task.status}</p>
              {isOverdue ? (
                <p className="text-xs font-medium text-red-700">Overdue</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {task.status === 'Completed' ? null : (
                <button
                  type="button"
                  className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                  onClick={() => void onComplete()}
                >
                  Mark Completed
                </button>
              )}
              {task.archivedAt ? null : (
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  onClick={() => void onArchive()}
                >
                  Archive
                </button>
              )}
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-700">Due</dt>
              <dd className="text-zinc-600">{new Date(task.dueDate).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Priority</dt>
              <dd className="text-zinc-600">{task.priority}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Event ID</dt>
              <dd className="break-all text-zinc-600">{task.eventId}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Assigned Contact ID</dt>
              <dd className="break-all text-zinc-600">{task.assignedContactId ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Quotation ID</dt>
              <dd className="break-all text-zinc-600">{task.quotationId ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700">Completed At</dt>
              <dd className="text-zinc-600">
                {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {task.description || 'No description provided.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Task not found.
        </div>
      )}

      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { listOrganizationUsers } from '../../lib/organization-users-api';
import type { OrganizationUserRecord } from '../../lib/organization-users-types';
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from '../../lib/tasks-api';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskRecord,
  type TaskSortBy,
  type TaskSortOrder,
  type TaskStatus,
} from '../../lib/tasks-types';
import { ConfirmDeleteTaskDialog } from './components/confirm-delete-task-dialog';
import { TaskDialogForm } from './components/task-dialog-form';
import { humanizeLabel } from '../../lib/ui-labels';

function priorityClass(priority: TaskPriority) {
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

function toDateInputValue(isoValue: string | null) {
  if (!isoValue) {
    return '';
  }

  return isoValue.slice(0, 10);
}

export default function TasksPage() {
  const { session, activeOrganization } = useAppSession();

  const [users, setUsers] = useState<OrganizationUserRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskRecord | null>(null);

  const [busyAction, setBusyAction] = useState<
    'create' | 'edit' | 'delete' | 'complete' | 'reopen' | null
  >(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortBy>('dueDate');
  const [sort, setSort] = useState<TaskSortOrder>('asc');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({
      token: session.token,
      baseUrl: session.baseUrl,
    }),
    [session.baseUrl, session.token],
  );

  async function loadPageData() {
    if (!session.organizationId || !canLoad) {
      setTasks([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dueFrom = dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : undefined;
      const dueTo = dueDate ? new Date(`${dueDate}T23:59:59.999Z`).toISOString() : undefined;

      const [usersResponse, tasksResponse] = await Promise.all([
        listOrganizationUsers(requestOptions, session.organizationId),
        listTasks(requestOptions, {
          organizationId: session.organizationId,
          page: 1,
          limit: 200,
          search,
          status,
          priority,
          assignedUserId: assignedUserId || undefined,
          dueFrom,
          dueTo,
          sortBy,
          sort,
          includeArchived: false,
        }),
      ]);

      setUsers(usersResponse.data);
      setTasks(tasksResponse.data);
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
    let cancelled = false;

    async function runLoad() {
      if (!session.organizationId || !canLoad) {
        if (!cancelled) {
          setTasks([]);
          setUsers([]);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError('');
      }

      try {
        const dueFrom = dueDate
          ? new Date(`${dueDate}T00:00:00.000Z`).toISOString()
          : undefined;
        const dueTo = dueDate
          ? new Date(`${dueDate}T23:59:59.999Z`).toISOString()
          : undefined;

        const [usersResponse, tasksResponse] = await Promise.all([
          listOrganizationUsers(requestOptions, session.organizationId),
          listTasks(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 200,
            search,
            status,
            priority,
            assignedUserId: assignedUserId || undefined,
            dueFrom,
            dueTo,
            sortBy,
            sort,
            includeArchived: false,
          }),
        ]);

        if (!cancelled) {
          setUsers(usersResponse.data);
          setTasks(tasksResponse.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load tasks.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canLoad,
    session.organizationId,
    search,
    status,
    priority,
    assignedUserId,
    dueDate,
    sortBy,
    sort,
  ]);

  async function handleCreate(payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedUserId?: string;
    dueDate?: string;
  }) {
    if (!session.organizationId) {
      return;
    }

    setBusyAction('create');
    setError('');

    try {
      await createTask(requestOptions, {
        organizationId: session.organizationId,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignedUserId: payload.assignedUserId,
        dueDate: payload.dueDate,
      });

      setSuccess('Task created successfully.');
      await loadPageData();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEdit(payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedUserId?: string;
    dueDate?: string;
  }) {
    if (!editTarget) {
      return;
    }

    setBusyAction('edit');
    setBusyTaskId(editTarget.id);
    setError('');

    try {
      await updateTask(requestOptions, editTarget.id, {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignedUserId: payload.assignedUserId ?? null,
        dueDate: payload.dueDate ?? null,
      });

      setSuccess('Task updated successfully.');
      await loadPageData();
    } finally {
      setBusyAction(null);
      setBusyTaskId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setBusyAction('delete');
    setBusyTaskId(deleteTarget.id);
    setError('');

    try {
      await deleteTask(requestOptions, deleteTarget.id);
      setDeleteTarget(null);
      setSuccess('Task deleted.');
      await loadPageData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete task.',
      );
    } finally {
      setBusyAction(null);
      setBusyTaskId(null);
    }
  }

  async function handleComplete(task: TaskRecord) {
    setBusyAction('complete');
    setBusyTaskId(task.id);
    setError('');

    try {
      await updateTaskStatus(requestOptions, task.id, { status: 'Completed' });
      setSuccess('Task marked as completed.');
      await loadPageData();
    } finally {
      setBusyAction(null);
      setBusyTaskId(null);
    }
  }

  async function handleReopen(task: TaskRecord) {
    setBusyAction('reopen');
    setBusyTaskId(task.id);
    setError('');

    try {
      await updateTaskStatus(requestOptions, task.id, { status: 'Todo' });
      setSuccess('Task reopened.');
      await loadPageData();
    } finally {
      setBusyAction(null);
      setBusyTaskId(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Tasks"
        description="Manage operational tasks for your organization."
        actions={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => {
              setSuccess('');
              setCreateOpen(true);
            }}
            disabled={!canLoad}
          >
            Create Task
          </button>
        }
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Sign in and select an organization to manage tasks.
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-6">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="Search tasks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {TASK_STATUSES.map((item) => (
            <option key={item} value={item}>
              {humanizeLabel(item)}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority | 'ALL')}
        >
          <option value="ALL">All priorities</option>
          {TASK_PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={assignedUserId}
          onChange={(event) => setAssignedUserId(event.target.value)}
        >
          <option value="">All assigned users</option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.name || user.email}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as TaskSortBy)}
        >
          <option value="dueDate">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="createdAt">Sort by Created Date</option>
          <option value="status">Sort by Status</option>
        </select>

        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as TaskSortOrder)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading tasks...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {canLoad && !loading && tasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No tasks found for {activeOrganization?.name ?? 'this organization'}.
        </div>
      ) : null}

      {canLoad && !loading && tasks.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Task Title</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Assigned User</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Organization</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Created By</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const rowBusy = busyTaskId === task.id;
                    return (
                      <tr key={task.id} className="border-t border-zinc-200">
                        <td className="px-4 py-3 text-zinc-900">{task.title}</td>
                        <td className="px-4 py-3 text-zinc-700">{task.description || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass(task.status)}`}>
                            {humanizeLabel(task.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${priorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{task.assignedUserName || '-'}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{task.organizationName}</td>
                        <td className="px-4 py-3 text-zinc-700">{task.createdByName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                              onClick={() => {
                                setSuccess('');
                                setEditTarget(task);
                              }}
                              disabled={rowBusy}
                            >
                              Edit Task
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSuccess('');
                                setDeleteTarget(task);
                              }}
                              disabled={rowBusy}
                            >
                              Delete Task
                            </button>
                            {task.status === 'Completed' ? (
                              <button
                                type="button"
                                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                                onClick={() => {
                                  void handleReopen(task);
                                }}
                                disabled={rowBusy}
                              >
                                Reopen Task
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  void handleComplete(task);
                                }}
                                disabled={rowBusy}
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {tasks.map((task) => {
              const rowBusy = busyTaskId === task.id;

              return (
                <article key={task.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{task.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{task.description || '-'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass(task.status)}`}>
                      {humanizeLabel(task.status)}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <div>Priority: {task.priority}</div>
                    <div>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</div>
                    <div>Assigned: {task.assignedUserName || '-'}</div>
                    <div>Created By: {task.createdByName || '-'}</div>
                    <div className="col-span-2">Organization: {task.organizationName}</div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      onClick={() => setEditTarget(task)}
                      disabled={rowBusy}
                    >
                      Edit Task
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(task)}
                      disabled={rowBusy}
                    >
                      Delete Task
                    </button>
                    {task.status === 'Completed' ? (
                      <button
                        type="button"
                        className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                        onClick={() => {
                          void handleReopen(task);
                        }}
                        disabled={rowBusy}
                      >
                        Reopen Task
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          void handleComplete(task);
                        }}
                        disabled={rowBusy}
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <TaskDialogForm
        key="create-task"
        title="Create Task"
        description="Create a task for your organization."
        submitLabel="Create Task"
        busyLabel="Creating..."
        open={createOpen}
        busy={busyAction === 'create'}
        users={users}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <TaskDialogForm
        key={editTarget?.id ?? 'edit-task-none'}
        title="Edit Task"
        description="Update task details and ownership."
        submitLabel="Save Changes"
        busyLabel="Saving..."
        open={Boolean(editTarget)}
        busy={busyAction === 'edit'}
        users={users}
        initialValues={
          editTarget
            ? {
                title: editTarget.title,
                description: editTarget.description || '',
                status: editTarget.status,
                priority: editTarget.priority,
                assignedUserId: editTarget.assignedUserId || '',
                dueDate: toDateInputValue(editTarget.dueDate),
              }
            : undefined
        }
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDeleteTaskDialog
        open={Boolean(deleteTarget)}
        busy={busyAction === 'delete'}
        taskTitle={deleteTarget?.title || 'this task'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

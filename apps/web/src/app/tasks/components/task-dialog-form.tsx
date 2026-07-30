import { useState } from 'react';
import { DialogShell } from '../../settings/users/components/dialog-shell';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../../../lib/tasks-types';
import type { OrganizationUserRecord } from '../../../lib/organization-users-types';

type TaskDialogFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
  open: boolean;
  busy: boolean;
  users: OrganizationUserRecord[];
  initialValues?: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedUserId: string;
    dueDate: string;
  };
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedUserId?: string;
    dueDate?: string;
  }) => Promise<void>;
};

export function TaskDialogForm({
  title,
  description,
  submitLabel,
  busyLabel,
  open,
  busy,
  users,
  initialValues,
  onClose,
  onSubmit,
}: TaskDialogFormProps) {
  const [taskTitle, setTaskTitle] = useState(initialValues?.title ?? '');
  const [taskDescription, setTaskDescription] = useState(
    initialValues?.description ?? '',
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialValues?.status ?? 'Todo',
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialValues?.priority ?? 'Medium',
  );
  const [assignedUserId, setAssignedUserId] = useState(
    initialValues?.assignedUserId ?? '',
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!taskTitle.trim()) {
      setError('Task title is required.');
      return;
    }

    setError('');

    try {
      await onSubmit({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        status,
        priority,
        assignedUserId: assignedUserId || undefined,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`).toISOString() : undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save task.');
    }
  }

  return (
    <DialogShell
      title={title}
      description={description}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={busy}
          >
            {busy ? busyLabel : submitLabel}
          </button>
        </>
      }
    >
      <label className="block text-sm text-zinc-700">
        Task Title
        <input
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          required
        />
      </label>

      <label className="block text-sm text-zinc-700">
        Description
        <textarea
          value={taskDescription}
          onChange={(event) => setTaskDescription(event.target.value)}
          className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
          maxLength={1500}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm text-zinc-700">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-zinc-700">
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-zinc-700">
          Assigned User
          <select
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-zinc-700">
          Due Date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </DialogShell>
  );
}

import { useState } from 'react';
import type {
  OrganizationUserRecord,
  OrganizationUserRole,
  UpdateOrganizationUserPayload,
} from '../../../../lib/organization-users-types';
import { DialogShell } from './dialog-shell';

type EditUserDialogProps = {
  open: boolean;
  busy: boolean;
  user: OrganizationUserRecord | null;
  onClose: () => void;
  onSubmit: (payload: UpdateOrganizationUserPayload) => Promise<void>;
};

const roles: OrganizationUserRole[] = ['Administrator', 'Manager', 'Staff'];

export function EditUserDialog({
  open,
  busy,
  user,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<OrganizationUserRole>(user?.role ?? 'Staff');
  const [error, setError] = useState('');

  if (!open || !user) {
    return null;
  }

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setError('');

    try {
      await onSubmit({
        name: name.trim() || undefined,
        email: email.trim(),
        role,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to update user.',
      );
    }
  }

  return (
    <DialogShell
      title="Edit User"
      description="Update user profile details and role for this organization."
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
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      <label className="block text-sm text-zinc-700">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-zinc-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          required
        />
      </label>
      <label className="block text-sm text-zinc-700">
        Role
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as OrganizationUserRole)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </DialogShell>
  );
}

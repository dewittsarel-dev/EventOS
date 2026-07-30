import { useState } from 'react';
import type {
  InviteOrganizationUserPayload,
  OrganizationUserRole,
} from '../../../../lib/organization-users-types';
import { DialogShell } from './dialog-shell';

type InviteUserDialogProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: InviteOrganizationUserPayload) => Promise<void>;
};

const roles: OrganizationUserRole[] = ['Administrator', 'Manager', 'Staff'];

export function InviteUserDialog({
  open,
  busy,
  onClose,
  onSubmit,
}: InviteUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationUserRole>('Staff');
  const [error, setError] = useState('');

  if (!open) {
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
      setName('');
      setEmail('');
      setRole('Staff');
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to invite user.',
      );
    }
  }

  return (
    <DialogShell
      title="Invite User"
      description="Add a user to this organization and assign their operational role."
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
            {busy ? 'Inviting...' : 'Invite User'}
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
          placeholder="Optional display name"
        />
      </label>
      <label className="block text-sm text-zinc-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          placeholder="user@example.com"
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

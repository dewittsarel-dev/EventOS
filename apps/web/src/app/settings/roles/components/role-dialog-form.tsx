import { useState } from 'react';
import { DialogShell } from '../../users/components/dialog-shell';
import { emptyPermissions, type RolePermissions } from '../../../../lib/roles-types';
import { PermissionsGrid } from './permissions-grid';

type RoleDialogFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
  open: boolean;
  busy: boolean;
  initialName?: string;
  initialDescription?: string;
  initialPermissions?: RolePermissions;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    permissions: RolePermissions;
  }) => Promise<void>;
};

export function RoleDialogForm({
  title,
  description,
  submitLabel,
  busyLabel,
  open,
  busy,
  initialName,
  initialDescription,
  initialPermissions,
  onClose,
  onSubmit,
}: RoleDialogFormProps) {
  const [name, setName] = useState(initialName ?? '');
  const [roleDescription, setRoleDescription] = useState(initialDescription ?? '');
  const [permissions, setPermissions] = useState<RolePermissions>(
    initialPermissions ?? emptyPermissions(),
  );
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Role name is required.');
      return;
    }

    setError('');

    try {
      await onSubmit({
        name: name.trim(),
        description: roleDescription.trim() || undefined,
        permissions,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save role.');
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
        Role Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          required
        />
      </label>
      <label className="block text-sm text-zinc-700">
        Description
        <textarea
          value={roleDescription}
          onChange={(event) => setRoleDescription(event.target.value)}
          className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <PermissionsGrid permissions={permissions} onChange={setPermissions} />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </DialogShell>
  );
}

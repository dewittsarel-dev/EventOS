import { DialogShell } from '../../users/components/dialog-shell';

type ConfirmDeleteRoleDialogProps = {
  open: boolean;
  busy: boolean;
  roleName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmDeleteRoleDialog({
  open,
  busy,
  roleName,
  onClose,
  onConfirm,
}: ConfirmDeleteRoleDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <DialogShell
      title="Confirm Delete"
      description={`Delete custom role ${roleName}. This action cannot be undone.`}
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
            className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
            onClick={() => {
              void onConfirm();
            }}
            disabled={busy}
          >
            {busy ? 'Deleting...' : 'Delete Role'}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">
        System roles cannot be deleted. Only custom roles can be removed.
      </p>
    </DialogShell>
  );
}

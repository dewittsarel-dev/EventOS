import { DialogShell } from './dialog-shell';

type ConfirmDeleteUserDialogProps = {
  open: boolean;
  busy: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmDeleteUserDialog({
  open,
  busy,
  userName,
  onClose,
  onConfirm,
}: ConfirmDeleteUserDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <DialogShell
      title="Confirm Delete"
      description={`Remove ${userName} from this organization. This does not delete their account in other organizations.`}
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
            {busy ? 'Deleting...' : 'Delete User'}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">
        This action removes organization access, role, and status assignment for this user.
      </p>
    </DialogShell>
  );
}

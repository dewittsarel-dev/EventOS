import { DialogShell } from '../../settings/users/components/dialog-shell';

type ConfirmDeleteTaskDialogProps = {
  open: boolean;
  busy: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmDeleteTaskDialog({
  open,
  busy,
  taskTitle,
  onClose,
  onConfirm,
}: ConfirmDeleteTaskDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <DialogShell
      title="Confirm Delete"
      description={`Delete task ${taskTitle}. This action cannot be undone.`}
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
            {busy ? 'Deleting...' : 'Delete Task'}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">Deleted tasks cannot be recovered.</p>
    </DialogShell>
  );
}

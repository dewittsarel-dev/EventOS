import { DialogShell } from '../../app/settings/users/components/dialog-shell';

type ConfirmDeleteMeetingNoteDialogProps = {
	open: boolean;
	busy: boolean;
	title: string;
	onClose: () => void;
	onConfirm: () => Promise<void>;
};

export function ConfirmDeleteMeetingNoteDialog({
	open,
	busy,
	title,
	onClose,
	onConfirm,
}: ConfirmDeleteMeetingNoteDialogProps) {
	if (!open) {
		return null;
	}

	return (
		<DialogShell
			title="Confirm Delete"
			description={`Delete meeting note ${title}. This action cannot be undone.`}
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
						{busy ? 'Deleting...' : 'Delete Meeting Note'}
					</button>
				</>
			}
		>
			<p className="text-sm text-zinc-700">Deleted meeting notes cannot be recovered.</p>
		</DialogShell>
	);
}

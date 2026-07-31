import { DialogShell } from '../../users/components/dialog-shell';
import type { QuotationRecord } from '../../../../lib/quotations-types';

type ConfirmDeleteQuotationDialogProps = {
  quotation: QuotationRecord;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteQuotationDialog({
  quotation,
  busy,
  onCancel,
  onConfirm,
}: ConfirmDeleteQuotationDialogProps) {
  return (
    <DialogShell
      title="Confirm Delete"
      description="This action permanently removes the quotation and line items."
      onClose={onCancel}
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Deleting...' : 'Delete Quotation'}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">
        Delete <span className="font-semibold text-zinc-900">{quotation.quoteNumber}</span>?
      </p>
      <p className="text-xs text-zinc-500">{quotation.title}</p>
    </DialogShell>
  );
}

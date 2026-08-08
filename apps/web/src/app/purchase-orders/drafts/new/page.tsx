'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { createPurchaseOrderDraft } from '../../../../lib/purchase-orders-api';

export default function NewPurchaseOrderDraftPage() {
  const router = useRouter();
  const { session } = useAppSession();
  const [sourceText, setSourceText] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!session.organizationId) {
      setError('Select an organization first.');
      return;
    }

    if (!sourceFile && sourceText.trim().length === 0) {
      setError('Upload a quotation source or paste quotation text.');
      return;
    }

    setSaving(true);

    try {
      const draft = await createPurchaseOrderDraft(requestOptions, {
        organizationId: session.organizationId,
        sourceText: sourceText.trim() || undefined,
        sourceFile: sourceFile ?? undefined,
      });

      router.push(`/purchase-orders/drafts/${draft.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create purchase order draft.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Purchase Order Draft"
        description="Upload a supplier quotation or paste quotation text. The system creates a reviewable draft only; nothing becomes a live purchase order until you approve it."
        actions={
          <div className="flex gap-2">
            <Link
              href="/purchase-orders/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Manual Purchase Order
            </Link>
            <Link
              href="/purchase-orders"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Purchase Orders
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Deterministic extraction is active for this workflow. Pasted quotation text is parsed most accurately.
        Uploaded PDFs and images are stored and routed through the same draft-review workflow, and fields can always be completed manually before commit.
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <label className="grid gap-2 text-sm text-zinc-700">
          Upload quotation PDF or image
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="grid gap-2 text-sm text-zinc-700">
          Paste quotation text
          <textarea
            className="min-h-48 rounded-md border border-zinc-300 px-3 py-2"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Paste supplier quotation text here for deterministic extraction."
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? 'Creating Draft...' : 'Create Review Draft'}
        </button>
      </form>
    </div>
  );
}
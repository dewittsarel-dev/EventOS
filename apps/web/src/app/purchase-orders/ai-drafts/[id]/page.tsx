'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  getAIPurchaseOrderUploadDocumentBlob,
  getAIPurchaseOrderUploadDraft,
} from '../../../../lib/purchase-orders-api';
import type { AIPurchaseOrderUploadDraftRecord } from '../../../../lib/purchase-orders-types';

export default function PurchaseOrderAiDraftPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const queryDocumentId = searchParams.get('documentId');
  const { session } = useAppSession();

  const [draft, setDraft] = useState<AIPurchaseOrderUploadDraftRecord | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;
    let localUrl = '';

    async function load() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getAIPurchaseOrderUploadDraft(requestOptions, id);

        if (cancelled) {
          return;
        }

        setDraft(response);

        const documentId = queryDocumentId || response.sourceDocument?.id;
        if (!documentId) {
          setError('No draft source document is available.');
          return;
        }

        const blob = await getAIPurchaseOrderUploadDocumentBlob(
          requestOptions,
          response.id,
          documentId,
        );

        if (cancelled) {
          return;
        }

        localUrl = URL.createObjectURL(blob);
        setPdfUrl(localUrl);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load AI purchase-order draft.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [id, queryDocumentId, requestOptions, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Purchase Order Draft"
        description="Phase 1 AI workflow: source document is stored and draft workspace is initialized."
        actions={
          <div className="flex gap-2">
            <Link
              href="/purchase-orders"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Purchase Orders
            </Link>
          </div>
        }
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          Loading AI purchase-order draft...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-zinc-800">Original PDF</h2>
            <div className="mt-3 h-[70vh] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
              {pdfUrl ? (
                <iframe
                  title="Purchase order source PDF"
                  src={pdfUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  PDF preview unavailable.
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">AI Processing</h2>
              <p className="mt-2 text-sm text-zinc-600">AI Processing...</p>
              <p className="mt-1 text-xs text-zinc-500">
                Extraction is not enabled in this phase.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Extracted Fields</h2>
              <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
                No extracted fields yet.
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
              <p>Draft ID: {draft?.id ?? '-'}</p>
              <p>Document ID: {draft?.sourceDocument?.id ?? '-'}</p>
              <p>Status: {draft?.status ?? '-'}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

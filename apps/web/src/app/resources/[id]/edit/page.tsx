'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { ResourceForm } from '@/components/resources/resource-form';
import { getResource, updateResource, type ResourcePayload, type ResourceRecord } from '@/lib/resource-api';

export default function EditResourcePage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppSession();
  const options = useMemo(() => ({ baseUrl: session.baseUrl, token: session.token }), [session.baseUrl, session.token]);
  const [resource, setResource] = useState<ResourceRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session.token) return;
    const timer = window.setTimeout(() => void getResource(options, id).then(setResource).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Resource could not be loaded.')), 0);
    return () => window.clearTimeout(timer);
  }, [id, options, session.token]);

  async function save(payload: Omit<ResourcePayload, 'organizationId'>) {
    setBusy(true); setError(''); setMessage('');
    try { const updated = await updateResource(options, id, payload); setResource(updated); setMessage('Resource saved. Marketplace visibility is now synchronized.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Resource could not be saved.'); }
    finally { setBusy(false); }
  }

  return <div className="flex flex-col gap-4"><PageHeader title="Edit Resource" description="Maintain the live operational record and its explicit Marketplace publication state." actions={<div className="flex gap-2"><Link href="/inventory" className="rounded-md border px-3 py-2 text-sm">Back to Resources</Link>{resource?.visibility === 'MARKETPLACE' ? <Link href="/marketplace" target="_blank" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Preview Marketplace</Link> : null}</div>} />{error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}{message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}{resource ? <ResourceForm initial={resource} busy={busy} submitLabel="Save resource" onSubmit={save} /> : !error ? <p className="rounded-xl border bg-white p-5 text-sm text-zinc-500">Loading resource…</p> : null}</div>;
}

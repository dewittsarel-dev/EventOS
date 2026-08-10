'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { ResourceForm } from '@/components/resources/resource-form';
import { createResource, type ResourcePayload } from '@/lib/resource-api';

export default function NewResourcePage() {
  const router = useRouter();
  const { session } = useAppSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(payload: Omit<ResourcePayload, 'organizationId'>) {
    if (!session.organizationId) { setError('Select an organization first.'); return; }
    setBusy(true); setError('');
    try {
      const created = await createResource({ baseUrl: session.baseUrl, token: session.token }, { ...payload, organizationId: session.organizationId });
      router.push(`/resources/${created.id}/edit`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Resource could not be created.'); }
    finally { setBusy(false); }
  }

  return <div className="flex flex-col gap-4"><PageHeader title="Add a product or service" description="A guided ClientOS form that prepares supplier inventory for search and optional Marketplace publication." actions={<Link href="/inventory" className="rounded-md border px-3 py-2 text-sm">Back to inventory</Link>} />{error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<ResourceForm busy={busy} submitLabel="Save privately" onSubmit={save} /></div>;
}

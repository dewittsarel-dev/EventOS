'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listInventoryItems } from '@/lib/inventory-api';
import type { InventoryItemRecord } from '@/lib/inventory-types';
import { listMarketplaceEnquiries } from '@/lib/marketplace-public-api';
import type { MarketplaceEnquiry } from '@/lib/marketplace-public-types';

export default function MarketplaceManagementPage() {
  const { session } = useAppSession();
  const [published, setPublished] = useState<InventoryItemRecord[]>([]);
  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const options = useMemo(() => ({ baseUrl: session.baseUrl, token: session.token }), [session.baseUrl, session.token]);

  useEffect(() => {
    if (!session.token || !session.organizationId) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [items, inbox] = await Promise.all([
          listInventoryItems(options, { organizationId: session.organizationId, marketplaceVisibility: 'Public', limit: 100 }),
          listMarketplaceEnquiries({ ...options, organizationId: session.organizationId }),
        ]);
        setPublished(items.data);
        setEnquiries(inbox);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Marketplace management could not be loaded.');
      } finally { setLoading(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [options, session.organizationId, session.token]);

  return <div className="flex flex-col gap-5">
    <PageHeader title="Marketplace Management" description="Control published catalogue items and respond to customer enquiries from ClientOS." actions={<Link href="/marketplace" target="_blank" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Open public Marketplace</Link>} />
    {!session.organizationId ? <p className="rounded-xl border bg-white p-5 text-sm text-zinc-600">Select an organization to manage its Marketplace presence.</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {loading ? <p className="rounded-xl border bg-white p-5 text-sm text-zinc-600">Loading Marketplace management…</p> : null}
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between"><div><h2 className="font-semibold">Published listings</h2><p className="text-sm text-zinc-500">Only these items are visible to customers.</p></div><Link href="/inventory/items" className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">Manage catalogue</Link></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{published.map((item) => <Link key={item.id} href={`/inventory/items/${item.id}/edit`} className="rounded-lg border p-4 hover:bg-zinc-50"><p className="font-medium">{item.marketplaceTitle || item.publicName || item.name}</p><p className="mt-1 text-xs text-zinc-500">Edit publication, images and customer-facing details</p></Link>)}{!loading && published.length === 0 ? <p className="text-sm text-zinc-500">No items are currently published.</p> : null}</div>
    </section>
    <section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Customer enquiry inbox</h2><p className="text-sm text-zinc-500">Requests sent from the public Marketplace.</p><div className="mt-4 space-y-3">{enquiries.map((entry) => <article key={entry.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-medium">{entry.customerName} — {entry.inventoryItem.marketplaceTitle || entry.inventoryItem.publicName || 'Published item'}</p><p className="text-xs text-zinc-500">{entry.customerEmail}{entry.customerPhone ? ` · ${entry.customerPhone}` : ''}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">{entry.status}</span></div><p className="mt-3 text-sm text-zinc-700">{entry.message}</p><p className="mt-2 text-xs text-zinc-500">{entry.quantity ? `Quantity ${entry.quantity} · ` : ''}{entry.eventLocation || 'Location not supplied'}{entry.eventDate ? ` · ${new Date(entry.eventDate).toLocaleDateString('en-ZA')}` : ''}</p></article>)}{!loading && enquiries.length === 0 ? <p className="text-sm text-zinc-500">No customer enquiries yet.</p> : null}</div></section>
  </div>;
}

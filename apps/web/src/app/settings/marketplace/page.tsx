'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listResourceWorkspaceCards, updateResourceMarketplaceVisibility } from '@/lib/inventory-api';
import type { ResourceWorkspaceCard } from '@/lib/inventory-types';
import { listMarketplaceEnquiries, sendMarketplaceEnquiryMessage, updateMarketplaceEnquiryStatus } from '@/lib/marketplace-public-api';
import type { MarketplaceEnquiry } from '@/lib/marketplace-public-types';
import { PreliminaryQuotePanel } from './preliminary-quote-panel';
import { SalesOpportunityPanel } from './sales-opportunity-panel';

export default function MarketplaceManagementPage() {
  const { session } = useAppSession();
  const [published, setPublished] = useState<ResourceWorkspaceCard[]>([]);
  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const options = useMemo(() => ({ baseUrl: session.baseUrl, token: session.token }), [session.baseUrl, session.token]);

  useEffect(() => {
    if (!session.token || !session.organizationId) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [items, inbox] = await Promise.all([
          listResourceWorkspaceCards(options, {
            organizationId: session.organizationId,
            marketplacePublished: true,
            limit: 100,
          }),
          listMarketplaceEnquiries({
            ...options,
            organizationId: session.organizationId,
          }),
        ]);
        setPublished(items.data);
        setEnquiries(inbox);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Marketplace management could not be loaded.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [options, session.organizationId, session.token]);

  async function updateStatus(entry: MarketplaceEnquiry, status: MarketplaceEnquiry['status']) {
    setUpdatingId(entry.id);
    setError('');
    try {
      const updated = await updateMarketplaceEnquiryStatus({
        ...options,
        organizationId: session.organizationId,
        enquiryId: entry.id,
        status,
      });
      setEnquiries((current) => current.map((item) => (item.id === entry.id ? { ...item, status: updated.status } : item)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Marketplace enquiry could not be updated.');
    } finally {
      setUpdatingId('');
    }
  }

  async function unpublish(item: ResourceWorkspaceCard) {
    try {
      await updateResourceMarketplaceVisibility(options, item.id, 'PRIVATE');
      setPublished((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Publication could not be updated.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketplace Management"
        description="Control what customers can discover and turn incoming interest into operational work."
        actions={
          <Link href="/marketplace" target="_blank" className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-300 hover:text-zinc-950">
            Open public Marketplace ↗
          </Link>
        }
      />
      {!session.organizationId ? <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">Select an organization to manage its Marketplace presence.</p> : null}
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">Loading Marketplace management…</p> : null}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Supplier setup</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Set up your Marketplace presence</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">Complete these steps in ClientOS. Products remain private until somebody in your business explicitly publishes them.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/settings/organization" className="rounded-xl border border-amber-200 bg-white p-4 hover:border-amber-400">
            <span className="text-xs font-semibold text-amber-700">Step 1</span>
            <strong className="mt-1 block text-sm">Complete business profile</strong>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">Business name, contact details, location, website and logo.</span>
          </Link>
          <Link href="/resources/new" className="rounded-xl border border-amber-200 bg-white p-4 hover:border-amber-400">
            <span className="text-xs font-semibold text-amber-700">Step 2</span>
            <strong className="mt-1 block text-sm">Add products and services</strong>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">Use the guided form. Photographs may be added now or later.</span>
          </Link>
          <Link href="/inventory" className="rounded-xl border border-amber-200 bg-white p-4 hover:border-amber-400">
            <span className="text-xs font-semibold text-amber-700">Step 3</span>
            <strong className="mt-1 block text-sm">Review and publish</strong>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">Control exactly which records become visible to customers.</span>
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Customer catalogue</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Published resources</h2>
            <p className="mt-1 text-sm text-zinc-500">Resource Engine remains the live source for customer-visible availability.</p>
          </div>
          <Link href="/inventory" className="self-start rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:border-zinc-950">
            Manage resources
          </Link>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {published.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.category} · {item.availableQuantity === null ? 'Unlimited' : `${item.availableQuantity} currently available`}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Live</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/resources/${item.id}/edit`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:border-zinc-400">
                  Edit listing
                </Link>
                <button type="button" onClick={() => void unpublish(item)} className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-700">
                  Unpublish
                </button>
              </div>
            </article>
          ))}
          {!loading && published.length === 0 ? <p className="text-sm text-zinc-500">No resources are currently published.</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50/70 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Incoming demand</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Customer enquiry inbox</h2>
          <p className="mt-1 text-sm text-zinc-500">Requests sent from the public Marketplace, ready for your team to follow up.</p>
        </div>
        <div className="space-y-3 p-5">
          {enquiries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-300">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-950">
                    {entry.customerName} — {entry.listing.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {entry.customerEmail}
                    {entry.customerPhone ? ` · ${entry.customerPhone}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">{entry.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{entry.message}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {entry.quantity ? `Quantity ${entry.quantity} · ` : ''}
                {entry.eventLocation || 'Location not supplied'}
                {entry.eventDate ? ` · ${new Date(entry.eventDate).toLocaleDateString('en-ZA')}` : ''}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={`mailto:${entry.customerEmail}?subject=${encodeURIComponent(`Marketplace enquiry: ${entry.listing.name}`)}`} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700">
                  Reply by email
                </a>
                <select aria-label={`Status for ${entry.customerName}`} value={entry.status} disabled={updatingId === entry.id} onChange={(event) => void updateStatus(entry, event.target.value as MarketplaceEnquiry['status'])} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs">
                  <option>New</option>
                  <option>Acknowledged</option>
                  <option>Closed</option>
                </select>
                {updatingId === entry.id ? <span className="text-xs text-zinc-500">Saving…</span> : null}
              </div>
              {entry.messages?.length ? (
                <div className="mt-4 space-y-2 rounded-xl bg-zinc-50 p-3">
                  {entry.messages.map((message) => (
                    <p key={message.id} className={`rounded-lg p-2 text-sm ${message.authorRole === 'Supplier' ? 'ml-8 bg-white' : 'mr-8 bg-amber-50'}`}>
                      <strong>{message.authorRole}:</strong> {message.body}
                    </p>
                  ))}
                </div>
              ) : null}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const body = String(new FormData(form).get('body'));
                  void sendMarketplaceEnquiryMessage({ ...options, organizationId: session.organizationId }, entry.id, body).then(async () => {
                    form.reset();
                    setEnquiries(await listMarketplaceEnquiries({ ...options, organizationId: session.organizationId }));
                  });
                }}
                className="mt-3 flex gap-2"
              >
                <input required name="body" aria-label={`Message ${entry.customerName}`} placeholder="Reply in the customer workspace" className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <button className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white">Send message</button>
              </form>
              <PreliminaryQuotePanel
                entry={entry}
                options={{ ...options, organizationId: session.organizationId }}
                onChanged={async () => {
                  setEnquiries(await listMarketplaceEnquiries({ ...options, organizationId: session.organizationId }));
                }}
              />
              <SalesOpportunityPanel
                entry={entry}
                options={{ ...options, organizationId: session.organizationId }}
                onChanged={async () => {
                  setEnquiries(
                    await listMarketplaceEnquiries({
                      ...options,
                      organizationId: session.organizationId,
                    }),
                  );
                }}
              />
            </article>
          ))}
          {!loading && enquiries.length === 0 ? <p className="text-sm text-zinc-500">No customer enquiries yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

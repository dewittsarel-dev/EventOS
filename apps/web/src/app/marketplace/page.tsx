'use client';
/* eslint-disable @next/next/no-img-element -- supplier image hosts are dynamic */

import { FormEvent, useEffect, useState } from 'react';
import { createMarketplaceEnquiry, listMarketplaceListings } from '@/lib/marketplace-public-api';
import type { MarketplaceListing } from '@/lib/marketplace-public-types';

function money(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [sentReference, setSentReference] = useState('');

  async function load(query = '') {
    setLoading(true);
    setError('');
    try {
      const response = await listMarketplaceListings({ search: query || undefined });
      setListings(response.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Marketplace could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setError('');
    try {
      const response = await createMarketplaceEnquiry({
        inventoryItemId: selected.id,
        customerName: String(form.get('customerName')),
        customerEmail: String(form.get('customerEmail')),
        customerPhone: String(form.get('customerPhone')) || undefined,
        eventDate: String(form.get('eventDate')) || undefined,
        eventLocation: String(form.get('eventLocation')) || undefined,
        quantity: form.get('quantity') ? Number(form.get('quantity')) : undefined,
        message: String(form.get('message')),
      });
      setSentReference(response.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your enquiry could not be sent.');
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f2ea] text-stone-900">
      <header className="border-b border-stone-300 bg-white/90 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div><p className="text-xl font-semibold tracking-tight">EventOS Marketplace</p><p className="text-xs text-stone-500">Discover trusted event suppliers</p></div>
          <a href="/login" className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">Supplier & planner sign in</a>
        </div>
      </header>

      <section className="bg-stone-950 px-5 py-16 text-white md:px-10 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">One marketplace. Many possibilities.</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Build an event people remember.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-stone-300">Browse items published directly by event suppliers, then send an enquiry without exposing their private operating information.</p>
          <form className="mx-auto mt-9 flex max-w-2xl gap-2" onSubmit={(event) => { event.preventDefault(); void load(search); }}>
            <input aria-label="Search Marketplace" className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-stone-900 outline-none ring-amber-400 focus:ring-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chairs, flowers, tables, themes…" />
            <button className="rounded-full bg-amber-300 px-6 py-3 font-medium text-stone-950 hover:bg-amber-200">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-10">
        <div className="mb-6 flex items-end justify-between"><div><p className="text-sm text-stone-500">Published supplier catalogue</p><h2 className="text-2xl font-semibold">Explore the Marketplace</h2></div><span className="text-sm text-stone-500">{listings.length} result{listings.length === 1 ? '' : 's'}</span></div>
        {error ? <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="py-16 text-center text-stone-500">Loading published listings…</p> : null}
        {!loading && listings.length === 0 ? <div className="rounded-2xl border border-stone-300 bg-white p-12 text-center"><h3 className="text-lg font-medium">No published listings yet</h3><p className="mt-2 text-stone-500">Suppliers control what appears here from their private ClientOS workspace.</p></div> : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-stone-200">{item.primaryPhotoUrl || item.photoUrls[0] ? <img className="h-full w-full object-cover" src={item.primaryPhotoUrl || item.photoUrls[0]} alt={item.title || 'Marketplace item'} /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">Supplier image coming soon</div>}</div>
              <div className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-stone-500">{item.categoryName}</p><h3 className="mt-1 text-lg font-semibold">{item.title || 'Untitled listing'}</h3><p className="mt-1 text-sm text-stone-500">by {item.supplierName}</p><p className="mt-3 line-clamp-2 text-sm text-stone-600">{item.description || 'Contact the supplier for details.'}</p><div className="mt-5 flex items-end justify-between"><div className="text-sm">{item.rentalPrice !== null ? <p><span className="font-semibold">{money(item.rentalPrice)}</span> rental</p> : null}{item.sellingPrice !== null ? <p><span className="font-semibold">{money(item.sellingPrice)}</span> sale</p> : null}</div><button onClick={() => { setSelected(item); setSentReference(''); }} className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700">Enquire</button></div></div>
            </article>
          ))}
        </div>
      </section>

      {selected ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`Enquire about ${selected.title}`}><div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-stone-500">Marketplace enquiry</p><h2 className="text-xl font-semibold">{selected.title}</h2><p className="text-sm text-stone-500">Your request goes directly into {selected.supplierName}&apos;s ClientOS workflow.</p></div><button aria-label="Close enquiry" onClick={() => setSelected(null)} className="h-9 w-9 rounded-full border text-lg">×</button></div>{sentReference ? <div className="mt-8 rounded-xl bg-emerald-50 p-5 text-emerald-800"><p className="font-semibold">Enquiry sent</p><p className="mt-1 text-sm">Reference: {sentReference}</p></div> : <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submitEnquiry}><input required name="customerName" placeholder="Your name" className="rounded-lg border p-3" /><input required type="email" name="customerEmail" placeholder="Email address" className="rounded-lg border p-3" /><input name="customerPhone" placeholder="Phone (optional)" className="rounded-lg border p-3" /><input type="date" name="eventDate" className="rounded-lg border p-3" /><input name="eventLocation" placeholder="Event location" className="rounded-lg border p-3" /><input min="1" type="number" name="quantity" placeholder="Quantity" className="rounded-lg border p-3" /><textarea required name="message" placeholder="Tell the supplier what you need" className="min-h-28 rounded-lg border p-3 sm:col-span-2" /><button className="rounded-full bg-amber-300 px-5 py-3 font-medium text-stone-950 sm:col-span-2">Send enquiry</button></form>}</div></div> : null}
    </main>
  );
}

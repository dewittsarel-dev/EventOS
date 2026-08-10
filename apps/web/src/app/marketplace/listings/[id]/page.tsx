'use client';
/* eslint-disable @next/next/no-img-element -- supplier image hosts are dynamic */

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createMarketplaceEnquiry, getMarketplaceListing } from '../../../../lib/marketplace-public-api';
import type { MarketplaceListing } from '../../../../lib/marketplace-public-types';
import { MarketplaceFooter, MarketplaceHeader } from '../../../../components/marketplace/marketplace-shell';

function money(value: number | null) {
  return value === null ? null : new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
}

export default function MarketplaceListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [activeImage, setActiveImage] = useState('');
  const [error, setError] = useState('');
  const [sentReference, setSentReference] = useState('');

  useEffect(() => {
    void getMarketplaceListing(String(id)).then((item) => { setListing(item); setActiveImage(item.primaryPhotoUrl || item.photoUrls[0] || ''); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Listing could not be loaded.'));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing) return;
    const form = new FormData(event.currentTarget);
    try {
      const response = await createMarketplaceEnquiry({ resourceId: listing.id, customerName: String(form.get('customerName')), customerEmail: String(form.get('customerEmail')), customerPhone: String(form.get('customerPhone')) || undefined, eventDate: String(form.get('eventDate')) || undefined, eventLocation: String(form.get('eventLocation')) || undefined, quantity: form.get('quantity') ? Number(form.get('quantity')) : undefined, message: String(form.get('message')) });
      setSentReference(response.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your enquiry could not be sent.'); }
  }

  return <><MarketplaceHeader compact /><main className="min-h-screen bg-[#f5f1e9] text-stone-950">
    {error ? <p role="alert" className="mx-auto mt-6 max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {!listing && !error ? <p className="p-12 text-center text-stone-500">Loading listing…</p> : null}
    {listing ? <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-10 lg:grid-cols-[1.3fr_0.7fr] lg:py-12">
      <section>
        <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-stone-200">{activeImage ? <img src={activeImage} alt={listing.title || 'Marketplace listing'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#e7dfd2,#faf7f1)] text-sm text-stone-500">Supplier imagery coming soon</div>}</div>
        {listing.photoUrls.length > 1 ? <div className="mt-3 flex gap-3 overflow-x-auto pb-2">{listing.photoUrls.map((url, index) => <button key={url} type="button" onClick={() => setActiveImage(url)} className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === url ? 'border-amber-500' : 'border-transparent'}`}><img src={url} alt={`${listing.title} view ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div> : null}
        <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{listing.categoryName} · {listing.resourceType.replaceAll('_', ' ')}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{listing.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">{listing.description || 'Contact the supplier for full details.'}</p>{listing.tags.length ? <div className="mt-5 flex flex-wrap gap-2">{listing.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-600">{tag}</span>)}</div> : null}</div>
      </section>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-3xl border border-stone-200 bg-[#fffdf9] p-6 shadow-sm"><div className="flex items-center gap-3">{listing.supplierLogoUrl ? <img src={listing.supplierLogoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-950 text-xs font-semibold text-white">EO</span>}<div><p className="text-xs text-stone-400">Published by</p><a href={`/marketplace/suppliers/${listing.supplierSlug}`} className="font-semibold hover:underline">{listing.supplierName}</a></div></div><div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-5"><div><p className="text-xs text-stone-400">From</p><p className="font-semibold">{listing.rentalPrice === null ? 'Price on request' : `${money(listing.rentalPrice)} / ${listing.unitOfMeasure}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${listing.availabilityStatus === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{listing.availabilityStatus}</span></div></section>
        <section className="rounded-3xl bg-stone-950 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Ask the supplier</p><h2 className="mt-2 text-xl font-semibold">Tell us about your event</h2>{sentReference ? <div className="mt-5 rounded-2xl bg-emerald-950 p-4 text-sm text-emerald-100"><p className="font-semibold">Enquiry sent successfully</p><p className="mt-1">Reference: {sentReference}</p></div> : <form onSubmit={submit} className="mt-5 grid gap-3"><input required name="customerName" placeholder="Your name" className="rounded-xl bg-white p-3 text-sm text-stone-950" /><input required type="email" name="customerEmail" placeholder="Email address" className="rounded-xl bg-white p-3 text-sm text-stone-950" /><div className="grid gap-3 sm:grid-cols-2"><input name="customerPhone" placeholder="Phone" className="rounded-xl bg-white p-3 text-sm text-stone-950" /><input type="number" min="1" name="quantity" placeholder="Quantity" className="rounded-xl bg-white p-3 text-sm text-stone-950" /></div><input name="eventLocation" placeholder="Event location" className="rounded-xl bg-white p-3 text-sm text-stone-950" /><input type="date" name="eventDate" className="rounded-xl bg-white p-3 text-sm text-stone-950" /><textarea required name="message" placeholder="What do you need?" className="min-h-28 rounded-xl bg-white p-3 text-sm text-stone-950" /><button className="rounded-full bg-amber-300 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-200">Send enquiry</button></form>}</section>
      </aside>
    </div> : null}
  </main><MarketplaceFooter /></>;
}

'use client';
/* eslint-disable @next/next/no-img-element -- supplier image hosts are dynamic */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { listMarketplaceListings } from '../../../../lib/marketplace-public-api';
import type { MarketplaceListing } from '../../../../lib/marketplace-public-types';
import { MarketplaceFooter, MarketplaceHeader } from '../../../../components/marketplace/marketplace-shell';

export default function MarketplaceSupplierPage() {
  const { slug } = useParams<{ slug: string }>();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void listMarketplaceListings({ supplier: String(slug), limit: 48 }).then((result) => setListings(result.items)).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Supplier could not be loaded.')).finally(() => setLoaded(true)); }, [slug]);
  const supplier = listings[0];

  return <><MarketplaceHeader compact /><main className="min-h-screen bg-[#f5f1e9] text-stone-950">
    {error ? <p role="alert" className="mx-auto mt-6 max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {loaded && !supplier && !error ? <div className="p-12 text-center"><h1 className="text-2xl font-semibold">Supplier not found</h1><a href="/marketplace" className="mt-4 inline-block underline">Return to Marketplace</a></div> : null}
    {supplier ? <><section className="bg-stone-950 px-5 py-12 text-white md:px-10 md:py-16"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center">{supplier.supplierLogoUrl ? <img src={supplier.supplierLogoUrl} alt="" className="h-20 w-20 rounded-2xl bg-white object-contain p-2" /> : <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-stone-950">EO</span>}<div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Marketplace supplier</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{supplier.supplierName}</h1><p className="mt-2 text-stone-400">{listings.length} published listing{listings.length === 1 ? '' : 's'}</p></div>{supplier.supplierWebsite ? <a href={supplier.supplierWebsite} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-4 py-2 text-sm sm:ml-auto">Visit supplier website ↗</a> : null}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-10"><h2 className="text-2xl font-semibold">Published catalogue</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((item) => <a key={item.id} href={`/marketplace/listings/${item.id}`} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl"><div className="aspect-[4/3] bg-stone-200">{item.primaryPhotoUrl ? <img src={item.primaryPhotoUrl} alt={item.title || ''} className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center p-5 text-center text-sm font-medium text-stone-500">Supplier imagery coming soon</div>}</div><div className="p-5"><p className="text-xs uppercase tracking-wide text-stone-400">{item.categoryName}</p><h3 className="mt-1 font-semibold">{item.title}</h3><p className="mt-3 text-sm text-stone-500">{item.availabilityStatus}</p></div></a>)}</div></section></> : null}
  </main><MarketplaceFooter /></>;
}

'use client';
/* eslint-disable @next/next/no-img-element -- supplier image hosts are dynamic */

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MarketplaceEventWorkspace } from '@/components/marketplace/marketplace-event-workspace';
import { MarketplaceFooter, MarketplaceHeader } from '@/components/marketplace/marketplace-shell';
import {
  addCustomerEventConceptSelection,
  addCustomerShortlist,
  createCustomerEnquiry,
  createCustomerEventConcept,
  createMarketplaceEnquiry,
  listCustomerEventConcepts,
  listMarketplaceListings,
  removeCustomerEventConceptSelection,
  updateCustomerEventConcept,
} from '@/lib/marketplace-public-api';
import { readMarketplaceCustomerSession } from '@/lib/marketplace-customer-session';
import type { MarketplaceCustomerSession, MarketplaceDiscoveryPath, MarketplaceEventConcept, MarketplaceEventConceptInput, MarketplaceListing } from '@/lib/marketplace-public-types';

function money(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
}

function ListingPlaceholder() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#ebe5da,#f8f5ef)] text-stone-500">
      <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full border border-stone-300/70" />
      <div className="absolute -bottom-10 -right-4 h-32 w-32 rounded-full bg-amber-200/35" />
      <div className="relative text-center">
        <span className="mx-auto mb-2 block h-8 w-8 rounded-full border border-stone-400/60 bg-white/60" />
        <span className="text-xs font-medium uppercase tracking-[0.16em]">EventOS supplier</span>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [sentReference, setSentReference] = useState('');
  const [customerSession] = useState<MarketplaceCustomerSession | null>(() => readMarketplaceCustomerSession());
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [concepts, setConcepts] = useState<MarketplaceEventConcept[]>([]);
  const [activeConceptId, setActiveConceptId] = useState('');
  const [conceptBusy, setConceptBusy] = useState(false);
  const activeConcept = concepts.find((concept) => concept.id === activeConceptId) ?? concepts[0] ?? null;

  const load = useCallback(async (query = '', categoryFilter = '', typeFilter = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await listMarketplaceListings({ search: query || undefined, category: categoryFilter || undefined, resourceType: typeFilter || undefined, limit: 48 });
      setListings(response.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Marketplace could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!customerSession) return;
    let cancelled = false;
    void listCustomerEventConcepts(customerSession.accessToken)
      .then((items) => {
        if (cancelled) return;
        setConcepts(items);
        setActiveConceptId((current) => current || items[0]?.id || '');
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Saved events could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [customerSession]);

  function storeConcept(concept: MarketplaceEventConcept) {
    setConcepts((current) => current.some((item) => item.id === concept.id) ? current.map((item) => item.id === concept.id ? concept : item) : [concept, ...current]);
    setActiveConceptId(concept.id);
  }

  async function createConcept(title: string) {
    if (!customerSession) return;
    setConceptBusy(true);
    try {
      storeConcept(await createCustomerEventConcept(customerSession.accessToken, title));
    } finally {
      setConceptBusy(false);
    }
  }

  async function updateConcept(input: MarketplaceEventConceptInput) {
    if (!customerSession || !activeConcept) return;
    setConceptBusy(true);
    try {
      storeConcept(await updateCustomerEventConcept(customerSession.accessToken, activeConcept.id, input));
    } finally {
      setConceptBusy(false);
    }
  }

  async function discover(input: { search: string; category?: string; resourceType?: string; path: MarketplaceDiscoveryPath }) {
    setSearch(input.search);
    setCategory(input.category ?? '');
    setResourceType(input.resourceType ?? '');
    await load(input.search, input.category ?? '', input.resourceType ?? '');
    window.setTimeout(() => document.getElementById('marketplace-catalogue')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  async function addToConcept(item: MarketplaceListing) {
    if (!customerSession || !activeConcept) return;
    setConceptBusy(true);
    try {
      storeConcept(await addCustomerEventConceptSelection(customerSession.accessToken, activeConcept.id, {
        resourceId: item.id,
        discoveryPath: activeConcept.lastDiscoveryPath,
        quantity: 1,
      }));
    } finally {
      setConceptBusy(false);
    }
  }

  async function removeFromConcept(resourceId: string) {
    if (!customerSession || !activeConcept) return;
    setConceptBusy(true);
    try {
      storeConcept(await removeCustomerEventConceptSelection(customerSession.accessToken, activeConcept.id, resourceId));
    } finally {
      setConceptBusy(false);
    }
  }

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setError('');
    try {
      const enquiryInput = {
        resourceId: selected.id,
        eventDate: String(form.get('eventDate')) || undefined,
        eventLocation: String(form.get('eventLocation')) || undefined,
        quantity: form.get('quantity') ? Number(form.get('quantity')) : undefined,
        message: String(form.get('message')),
      };
      const response = customerSession ? await createCustomerEnquiry(customerSession.accessToken, enquiryInput) : await createMarketplaceEnquiry({ ...enquiryInput, customerName: String(form.get('customerName')), customerEmail: String(form.get('customerEmail')), customerPhone: String(form.get('customerPhone')) || undefined });
      setSentReference(response.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your enquiry could not be sent.');
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e9] text-stone-950">
      <MarketplaceHeader />

      <section className="relative overflow-hidden bg-stone-950 px-5 py-16 text-white md:px-10 md:py-24">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_15%_10%,#b48a34_0,transparent_25%),radial-gradient(circle_at_85%_70%,#625340_0,transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Plan beautifully. Source confidently.</p>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] md:text-6xl lg:text-7xl">Build an event people remember.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-300 md:text-lg">Discover items and services published directly by trusted event suppliers, then send your requirements straight to their team.</p>
          <form
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row sm:rounded-full"
            onSubmit={(event) => {
              event.preventDefault();
              if (activeConcept) void updateConcept({ lastDiscoveryPath: 'ManualSearch', searchTerms: search.split(/\s+/).filter(Boolean) });
              void discover({ search, category, resourceType, path: 'ManualSearch' });
            }}
          >
            <input aria-label="Search Marketplace" className="min-w-0 flex-1 rounded-xl px-4 py-3 text-stone-950 outline-none placeholder:text-stone-400 sm:rounded-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chairs, flowers, tables or themes…" />
            <button className="rounded-xl bg-amber-300 px-7 py-3 font-semibold text-stone-950 hover:bg-amber-200 sm:rounded-full">Search</button>
          </form>
          <div className="mt-7 flex flex-wrap justify-center gap-x-7 gap-y-2 text-xs text-stone-400">
            <span>Supplier-managed listings</span>
            <span>Direct enquiries</span>
            <span>Live availability guidance</span>
          </div>
        </div>
      </section>

      <MarketplaceEventWorkspace
        signedIn={Boolean(customerSession)}
        concepts={concepts}
        active={activeConcept}
        busy={conceptBusy}
        onCreate={createConcept}
        onSelect={setActiveConceptId}
        onUpdate={updateConcept}
        onDiscover={discover}
        onRemoveSelection={removeFromConcept}
      />

      <section className="sticky top-[4.5rem] z-30 border-b border-stone-200 bg-[#fffdf9]/95 px-5 py-3 backdrop-blur-xl md:static md:px-10 md:py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Explore</span>
          {['Furniture', 'Décor', 'Florals', 'Venues', 'Catering', 'Production'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setCategory(option);
                if (activeConcept) void updateConcept({ lastDiscoveryPath: 'ManualSearch' });
                void discover({ search, category: option, resourceType, path: 'ManualSearch' });
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm ${category === option ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section id="marketplace-catalogue" className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Published supplier catalogue</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Explore the Marketplace</h2>
          </div>
          <span className="shrink-0 text-sm text-stone-500">
            {listings.length} result{listings.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="mb-7 grid gap-3 rounded-2xl border border-stone-200 bg-[#fffdf9] p-3 sm:grid-cols-[minmax(0,15rem)_auto_1fr] sm:items-center">
          <select
            aria-label="Filter by resource type"
            value={resourceType}
            onChange={(event) => {
              const value = event.target.value;
              setResourceType(value);
              void load(search, category, value);
            }}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All listing types</option>
            <option value="ASSET">Hire items</option>
            <option value="SERVICE">Services</option>
            <option value="VENUE">Venues</option>
            <option value="STAFF">Staff</option>
            <option value="VEHICLE">Vehicles</option>
            <option value="CONSUMABLE">Consumables</option>
            <option value="BULK_ITEM">Bulk items</option>
          </select>
          {search || category || resourceType ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('');
                setResourceType('');
                void load('', '', '');
              }}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              Clear all filters
            </button>
          ) : null}
          <p className="text-xs text-stone-400 sm:justify-self-end">Only supplier-published information is shown</p>
        </div>
        {error ? (
          <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[26rem] animate-pulse rounded-3xl bg-white/70" />
            ))}
          </div>
        ) : null}
        {!loading && listings.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-[#fffdf9] p-12 text-center shadow-sm">
            <p className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl">⌕</p>
            <h3 className="text-lg font-semibold">No published listings found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">Try a broader search. Suppliers control what appears here from their private ClientOS workspace.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                void load();
              }}
              className="mt-5 rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-medium hover:border-stone-950"
            >
              Clear search
            </button>
          </div>
        ) : null}
        {!loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-[#fffdf9] shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10">
                <div className="aspect-[4/3] overflow-hidden bg-stone-200">{item.primaryPhotoUrl || item.photoUrls[0] ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={item.primaryPhotoUrl || item.photoUrls[0]} alt={item.title || 'Marketplace item'} /> : <ListingPlaceholder />}</div>
                <div className="flex min-h-64 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{item.categoryName}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.availabilityStatus === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{item.availabilityStatus}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    <a href={`/marketplace/listings/${item.id}`} className="hover:text-amber-700">
                      {item.title || 'Untitled listing'}
                    </a>
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500">
                    by{' '}
                    <a href={`/marketplace/suppliers/${item.supplierSlug}`} className="font-medium hover:text-stone-950 hover:underline">
                      {item.supplierName}
                    </a>
                  </p>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">{item.description || 'Contact the supplier for details.'}</p>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-stone-100 pt-4">
                    <div className="text-sm">
                      {item.rentalPrice !== null ? (
                        <p>
                          <span className="font-semibold">{money(item.rentalPrice)}</span>
                          <span className="text-stone-500"> / {item.unitOfMeasure}</span>
                        </p>
                      ) : (
                        <p className="font-medium">Price on request</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {customerSession && activeConcept ? (
                        <button disabled={conceptBusy || activeConcept.selections.some((selection) => selection.resourceId === item.id)} onClick={() => void addToConcept(item)} className="text-xs font-semibold text-amber-700 disabled:text-emerald-700">
                          {activeConcept.selections.some((selection) => selection.resourceId === item.id) ? 'In event' : 'Add to event'}
                        </button>
                      ) : null}
                      {customerSession ? (
                        <button disabled={savedIds.includes(item.id)} onClick={() => void addCustomerShortlist(customerSession.accessToken, item.id).then(() => setSavedIds((ids) => [...ids, item.id]))} className="text-xs font-medium text-stone-500 disabled:text-emerald-700">
                          {savedIds.includes(item.id) ? 'Saved' : 'Save'}
                        </button>
                      ) : null}
                      <a href={`/marketplace/listings/${item.id}`} className="text-xs font-medium text-stone-500 hover:text-stone-950">
                        Details
                      </a>
                      <button
                        onClick={() => {
                          setSelected(item);
                          setSentReference('');
                        }}
                        className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white hover:bg-amber-300 hover:text-stone-950"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <MarketplaceFooter />

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`Enquire about ${selected.title}`}>
          <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#fffdf9] p-6 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Marketplace enquiry</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{selected.title}</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">Your request goes directly into {selected.supplierName}&apos;s ClientOS workflow.</p>
              </div>
              <button aria-label="Close enquiry" onClick={() => setSelected(null)} className="h-10 w-10 shrink-0 rounded-full border border-stone-300 text-xl hover:border-stone-950 hover:bg-stone-950 hover:text-white">
                ×
              </button>
            </div>
            {sentReference ? (
              <div role="status" className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <p className="font-semibold">Enquiry sent successfully</p>
                <p className="mt-1 text-sm">The supplier can now respond through ClientOS.{customerSession ? ' Track replies in My planning.' : ''}</p>
                <p className="mt-3 text-xs">Reference: {sentReference}</p>
                {customerSession ? <a href="/marketplace/account" className="mt-4 inline-block text-sm font-semibold underline">Open My planning</a> : null}
              </div>
            ) : (
              <form className="mt-7 grid gap-3 sm:grid-cols-2" onSubmit={submitEnquiry}>
                {customerSession ? (
                  <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-700 sm:col-span-2">Sending as <strong>{customerSession.customer.name}</strong> ({customerSession.customer.email}). Supplier replies will appear in My planning.</p>
                ) : (
                  <>
                    <input required aria-label="Your name" name="customerName" placeholder="Your name" className="rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-amber-500" />
                    <input required aria-label="Email address" type="email" name="customerEmail" placeholder="Email address" className="rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-amber-500" />
                    <input aria-label="Phone" name="customerPhone" placeholder="Phone (optional)" className="rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-amber-500" />
                  </>
                )}
                <input aria-label="Event location" name="eventLocation" placeholder="Event location" className="rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-amber-500" />
                <label className="text-xs text-stone-500">
                  Event date
                  <input type="date" name="eventDate" className="mt-1 block w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-800" />
                </label>
                <input aria-label="Quantity" min="1" type="number" name="quantity" placeholder="Quantity" className="self-end rounded-xl border border-stone-300 bg-white p-3 text-sm" />
                <textarea required aria-label="Enquiry details" name="message" placeholder="Tell the supplier what you need, including your event style and timing." className="min-h-28 rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-amber-500 sm:col-span-2" />
                <button className="mt-2 rounded-full bg-amber-300 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-200 sm:col-span-2">Send enquiry to supplier</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

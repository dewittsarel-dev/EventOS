'use client';

import { useEffect, useMemo, useState } from 'react';
import { MarketplaceFooter, MarketplaceHeader } from '@/components/marketplace/marketplace-shell';
import {
  eventCategories,
  guidedEventSearchTerms,
  interpretEventRequest,
  type MarketplaceDiscoveryMode,
} from '@/lib/marketplace-event-discovery';
import {
  matchesSimulationCategories,
  normalizeSimulationSearch,
  simulationSearchScore,
} from '@/lib/simulation-marketplace-search';

interface SimulationListing {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  supplierName: string;
  supplierKind: string;
  city: string;
  unit: string;
  quantityMode: 'QUANTITY' | 'CAPACITY' | 'UNLIMITED';
  quantity: number | null;
  sellingPrice: number;
  imagePath: string;
  availability: string;
  synthetic: true;
}

const quantityModeLabels: Record<SimulationListing['quantityMode'], string> = {
  QUANTITY: 'Stocked item',
  CAPACITY: 'Capacity-based',
  UNLIMITED: 'Service / quoted',
};

function money(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value);
}

function SimulationImage({ listing }: { listing: SimulationListing }) {
  const [failed, setFailed] = useState(false);
  if (!listing.imagePath || failed) {
    return (
      <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#e8e1d4,#faf7f1)] p-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
        Image awaiting operator upload
      </div>
    );
  }
  return (
    // Dynamic simulator assets are validated by the catalogue audit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={listing.imagePath}
      alt={listing.title.replace(' [SYNTHETIC]', '')}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
}

export default function SimulationMarketplacePage() {
  const [listings, setListings] = useState<SimulationListing[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [recommendedCategories, setRecommendedCategories] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantityMode, setQuantityMode] = useState('');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [visible, setVisible] = useState(48);
  const [mode, setMode] = useState<MarketplaceDiscoveryMode>('assistant');
  const [assistantRequest, setAssistantRequest] = useState('');
  const [assistantBrief, setAssistantBrief] = useState<ReturnType<typeof interpretEventRequest> | null>(null);
  const [guidedType, setGuidedType] = useState('Wedding');
  const [guidedGuests, setGuidedGuests] = useState('100');
  const [guidedDate, setGuidedDate] = useState('');
  const [guidedTheme, setGuidedTheme] = useState('');
  const [guidedCity, setGuidedCity] = useState('Pretoria');
  const [guidedArea, setGuidedArea] = useState('');
  const [guidedRadius, setGuidedRadius] = useState('30');
  const [guidedVenueStatus, setGuidedVenueStatus] = useState('needed');
  const [guidedVenueName, setGuidedVenueName] = useState('');
  const [guidedSetting, setGuidedSetting] = useState('Either');
  const [guidedStyle, setGuidedStyle] = useState('Elegant');
  const [guidedColour, setGuidedColour] = useState('Neutral');
  const [guidedBudget, setGuidedBudget] = useState('');
  const [guidedRequirements, setGuidedRequirements] = useState<string[]>(() =>
    eventCategories('Wedding'),
  );
  const [guidedSubstitutions, setGuidedSubstitutions] = useState(true);

  useEffect(() => {
    fetch('/simulation/eventos-marketplace-catalogue.json')
      .then((response) => {
        if (!response.ok) throw new Error('Simulator catalogue could not be loaded.');
        return response.json() as Promise<SimulationListing[]>;
      })
      .then(setListings)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : 'Simulator catalogue could not be loaded.'),
      );
  }, []);

  const options = useMemo(
    () => ({
      categories: [...new Set(listings.map((listing) => listing.category))].sort(),
      cities: [...new Set(listings.map((listing) => listing.city))].sort(),
      suppliers: [...new Set(listings.map((listing) => listing.supplierName))].sort(),
    }),
    [listings],
  );
  const filtered = useMemo(() => {
    const query = normalizeSimulationSearch(search);
    const ceiling = maximumPrice ? Number(maximumPrice) : null;
    return listings
      .map((listing) => ({ listing, score: simulationSearchScore(listing, query) }))
      .filter(
        ({ listing, score }) =>
        score > 0 &&
        matchesSimulationCategories(listing.category, category, recommendedCategories) &&
        (!city || listing.city === city) &&
        (!supplier || listing.supplierName === supplier) &&
        (!quantityMode || listing.quantityMode === quantityMode) &&
        (ceiling === null || listing.sellingPrice <= ceiling),
      )
      .sort(
        (left, right) =>
          right.score - left.score || left.listing.title.localeCompare(right.listing.title),
      )
      .map(({ listing }) => listing);
  }, [category, city, listings, maximumPrice, quantityMode, recommendedCategories, search, supplier]);

  function reset() {
    setSearch('');
    setCategory('');
    setRecommendedCategories([]);
    setCity('');
    setSupplier('');
    setQuantityMode('');
    setMaximumPrice('');
    setVisible(48);
  }

  function applyAssistantRequest() {
    const brief = interpretEventRequest(assistantRequest);
    setAssistantBrief(brief);
    setCity(brief.city);
    setMaximumPrice('');
    setSearch('');
    setCategory('');
    setRecommendedCategories([...new Set(brief.categories)]);
    setVisible(48);
  }

  function applyGuidedRequest() {
    setSearch('');
    setCity(guidedCity);
    setMaximumPrice('');
    setCategory('');
    setRecommendedCategories([
      ...new Set(guidedRequirements.length ? guidedRequirements : eventCategories(guidedType)),
    ]);
    setVisible(48);
  }

  function toggleGuidedRequirement(value: string) {
    setGuidedRequirements((current) => {
      return current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f1e9] text-stone-950">
      <MarketplaceHeader browseHref="/marketplace/simulation" />
      <section className="border-b border-amber-300 bg-amber-100 px-5 py-4 text-amber-950 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em]">Isolated EventOS simulator</p>
          <p className="mt-1 text-sm">All businesses, stock, prices and availability on this page are synthetic and cannot be purchased.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">150 synthetic businesses</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">Marketplace test catalogue</h1>
          </div>
          <p className="text-sm text-stone-500">{filtered.length} of {listings.length} offerings</p>
        </div>
        <div className="mt-7 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Ways to find event suppliers">
            {([
              ['assistant', 'AI Event Assistant', 'Describe the event in your own words'],
              ['guided', 'Guided Event Builder', 'Answer a few simple questions'],
              ['catalogue', 'Direct Catalogue Search', 'Search and filter every listing'],
            ] as const).map(([value, label, detail]) => (
              <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`rounded-2xl border p-4 text-left transition ${mode === value ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-400'}`}>
                <span className="block font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-stone-500">{detail}</span>
              </button>
            ))}
          </div>

          {mode === 'assistant' ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_22rem]">
              <div>
                <label htmlFor="assistant-request" className="text-sm font-semibold">Tell us what you are planning</label>
                <textarea id="assistant-request" value={assistantRequest} onChange={(event) => setAssistantRequest(event.target.value)} placeholder="For example: Elegant outdoor wedding for 120 guests in Pretoria, neutral colours, budget R180,000" className="mt-2 min-h-28 w-full rounded-2xl border border-stone-200 p-4 text-sm outline-none focus:border-amber-400" />
                <button type="button" disabled={!assistantRequest.trim()} onClick={applyAssistantRequest} className="mt-3 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Build my starting shortlist</button>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4 text-sm">
                <p className="font-semibold">What the assistant will do</p>
                <p className="mt-2 leading-6 text-stone-600">Understand the event, highlight missing essentials, and suggest useful categories and search terms. It never confirms stock or pricing without the supplier.</p>
              </div>
              {assistantBrief ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 lg:col-span-2" role="status">
                  <p className="font-semibold">Event brief understood</p>
                  <p className="mt-1 text-sm text-stone-700">{[assistantBrief.eventType, assistantBrief.guests ? `${assistantBrief.guests} guests` : '', assistantBrief.city, assistantBrief.budget ? money(assistantBrief.budget) : ''].filter(Boolean).join(' · ') || 'More information is needed.'}</p>
                  {assistantBrief.categories.length ? <div className="mt-3 flex flex-wrap gap-2">{assistantBrief.categories.map((value) => <button key={value} type="button" onClick={() => { setCategory(value); setRecommendedCategories([]); setSearch(''); }} className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium">Explore {value}</button>)}</div> : null}
                  {assistantBrief.followUpQuestions.length ? <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">A planner would ask next</p><ul className="mt-1 list-disc pl-5 text-sm text-stone-700">{assistantBrief.followUpQuestions.map((value) => <li key={value}>{value}</li>)}</ul></div> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === 'guided' ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <p className="text-sm font-semibold sm:col-span-2 lg:col-span-4">1. Event basics</p>
              <label className="text-xs font-semibold text-stone-600">Event type<select value={guidedType} onChange={(event) => { const value = event.target.value; setGuidedType(value); setGuidedRequirements(eventCategories(value)); }} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950">{['Wedding', 'Birthday', 'Party', 'Corporate', 'Conference', 'Product launch', 'Funeral'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-stone-600">Event date<input type="date" value={guidedDate} onChange={(event) => setGuidedDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <label className="text-xs font-semibold text-stone-600">Guests<input type="number" min="1" value={guidedGuests} onChange={(event) => setGuidedGuests(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <label className="text-xs font-semibold text-stone-600">Theme or occasion<input value={guidedTheme} onChange={(event) => setGuidedTheme(event.target.value)} placeholder="Garden, heritage, awards..." className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <p className="mt-2 border-t border-stone-200 pt-4 text-sm font-semibold sm:col-span-2 lg:col-span-4">2. Location and venue</p>
              <label className="text-xs font-semibold text-stone-600">Venue status<select value={guidedVenueStatus} onChange={(event) => setGuidedVenueStatus(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950"><option value="needed">Help me find a venue</option><option value="selected">Venue already selected</option><option value="undecided">Not decided yet</option></select></label>
              {guidedVenueStatus === 'selected' ? <label className="text-xs font-semibold text-stone-600">Venue name<input value={guidedVenueName} onChange={(event) => setGuidedVenueName(event.target.value)} placeholder="Enter the selected venue" className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label> : null}
              <label className="text-xs font-semibold text-stone-600">City<select value={guidedCity} onChange={(event) => setGuidedCity(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950">{(options.cities.length ? options.cities : ['Pretoria', 'Johannesburg', 'Cape Town', 'Durban']).map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-stone-600">Preferred area<input value={guidedArea} onChange={(event) => setGuidedArea(event.target.value)} placeholder="Suburb or district" className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <label className="text-xs font-semibold text-stone-600">Travel radius (km)<input type="number" min="0" value={guidedRadius} onChange={(event) => setGuidedRadius(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <label className="text-xs font-semibold text-stone-600">Setting<select value={guidedSetting} onChange={(event) => setGuidedSetting(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950">{['Either', 'Indoor', 'Outdoor', 'Mixed indoor and outdoor'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <p className="mt-2 border-t border-stone-200 pt-4 text-sm font-semibold sm:col-span-2 lg:col-span-4">3. Look, budget and flexibility</p>
              <label className="text-xs font-semibold text-stone-600">Style<select value={guidedStyle} onChange={(event) => setGuidedStyle(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950">{['Elegant', 'Modern', 'Classic', 'Rustic', 'Vintage', 'Old fashioned', 'Bohemian', 'Minimalist', 'Luxury', 'Romantic'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-stone-600">Main colour<select value={guidedColour} onChange={(event) => setGuidedColour(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950">{['Neutral', 'White', 'Black', 'Gold', 'Silver', 'Green', 'Blue', 'Pink', 'Red', 'Pastel'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-stone-600">Total event budget (ZAR)<input type="number" min="0" value={guidedBudget} onChange={(event) => setGuidedBudget(event.target.value)} placeholder="Optional" className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-950" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm"><input type="checkbox" checked={guidedSubstitutions} onChange={(event) => setGuidedSubstitutions(event.target.checked)} className="h-4 w-4 accent-amber-400" /><span><strong className="block">Allow close alternatives</strong><span className="text-xs text-stone-500">Show suitable substitutions when needed</span></span></label>
              <div className="mt-2 border-t border-stone-200 pt-4 sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-semibold">4. What do you need?</p>
                <p className="mt-1 text-xs text-stone-500">Select any event areas to include. You can change these later.</p>
                <div className="mt-3 flex flex-wrap gap-2">{options.categories.map((value) => { const selected = guidedRequirements.includes(value); return <button key={value} type="button" aria-pressed={selected} onClick={() => toggleGuidedRequirement(value)} className={`rounded-full border px-3 py-2 text-xs ${selected ? 'border-amber-400 bg-amber-50 font-semibold' : 'border-stone-300'}`}>{selected ? 'Selected · ' : ''}{value}</button>; })}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600 sm:col-span-2 lg:col-span-4">
                <span className="font-semibold text-stone-950">Suggested direction:</span>{' '}
                {guidedType} for {guidedGuests || '0'} guests
                {guidedDate ? ` on ${guidedDate}` : ''} in {guidedCity}
                {guidedArea ? `, ${guidedArea}` : ''} / {guidedSetting.toLowerCase()} /{' '}
                {guidedStyle.toLowerCase()} / {guidedColour.toLowerCase()}
                {guidedTheme ? ` / ${guidedTheme}` : ''}
                {guidedBudget ? ` / budget R${guidedBudget}` : ''} / venue:{' '}
                {guidedVenueStatus === 'selected'
                  ? guidedVenueName || 'selected'
                  : guidedVenueStatus === 'needed'
                    ? 'required'
                    : 'undecided'}{' '}
                / within {guidedRadius || '0'} km / alternatives{' '}
                {guidedSubstitutions ? 'allowed' : 'not allowed'} / search cues:{' '}
                {guidedEventSearchTerms(guidedType, guidedStyle, [guidedColour]).join(', ')}
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3"><button type="button" onClick={applyGuidedRequest} className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white">Show combined recommendations</button><span className="text-xs text-stone-500">Uses all {guidedRequirements.length || eventCategories(guidedType).length} selected event areas together.</span></div>
            </div>
          ) : null}
        </div>
        {recommendedCategories.length ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
            <div><p className="text-sm font-semibold">Combined event recommendations</p><p className="mt-1 text-xs text-stone-600">Showing offerings across {recommendedCategories.join(', ')}.</p></div>
            <button type="button" onClick={() => setRecommendedCategories([])} className="self-start rounded-full border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold sm:self-auto">Clear recommendations</button>
          </div>
        ) : null}
        <div className={`${mode === 'catalogue' ? 'mt-5' : 'mt-4'} grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3`}>
          <input aria-label="Search synthetic catalogue" value={search} onChange={(event) => { setSearch(event.target.value); setVisible(48); }} placeholder="Search item, SKU or supplier" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
          <select aria-label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setRecommendedCategories([]); }} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"><option value="">All categories</option>{options.categories.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="City" value={city} onChange={(event) => setCity(event.target.value)} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"><option value="">All cities</option>{options.cities.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Supplier" value={supplier} onChange={(event) => setSupplier(event.target.value)} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"><option value="">All suppliers</option>{options.suppliers.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Offering type" value={quantityMode} onChange={(event) => setQuantityMode(event.target.value)} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"><option value="">All offering types</option><option value="QUANTITY">Stocked items</option><option value="CAPACITY">Capacity-based offerings</option><option value="UNLIMITED">Services / quoted</option></select>
          <div className="flex gap-2"><input aria-label="Maximum price" type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Maximum ZAR price" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm" /><button type="button" onClick={reset} className="rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-stone-100">Clear</button></div>
        </div>
        {error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p> : null}
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, visible).map((listing) => (
            <article key={listing.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-[#fffdf9] shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[4/3] overflow-hidden bg-stone-200"><SimulationImage listing={listing} /></div>
              <div className="flex min-h-64 flex-col p-5">
                <div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{listing.category}</p><span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-700">{quantityModeLabels[listing.quantityMode]}</span></div>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">{listing.title.replace(' [SYNTHETIC]', '')}</h2>
                <p className="mt-1 text-xs text-stone-500">{listing.supplierName} · {listing.city}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-5 text-stone-600">{listing.description}</p>
                <div className="mt-auto border-t border-stone-100 pt-4"><p className="font-semibold">{money(listing.sellingPrice)} <span className="text-sm font-normal text-stone-500">/ {listing.unit}</span></p><p className="mt-1 text-[11px] uppercase tracking-wide text-amber-700">Simulator only</p></div>
              </div>
            </article>
          ))}
        </div>
        {visible < filtered.length ? <div className="mt-8 text-center"><button type="button" onClick={() => setVisible((count) => count + 48)} className="rounded-full bg-stone-950 px-6 py-3 font-semibold text-white hover:bg-amber-300 hover:text-stone-950">Load more</button></div> : null}
      </section>
      <MarketplaceFooter />
    </main>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { combinedEventDiscoveryRequest, guidedEventSearchTerms, interpretEventRequest } from '@/lib/marketplace-event-discovery';
import type { MarketplaceDiscoveryPath, MarketplaceEventConcept, MarketplaceEventConceptInput } from '@/lib/marketplace-public-types';

type DiscoveryRequest = { search: string; category?: string; resourceType?: string; path: MarketplaceDiscoveryPath };

export function MarketplaceEventWorkspace({
  signedIn,
  concepts,
  active,
  busy,
  onCreate,
  onSelect,
  onUpdate,
  onDiscover,
  onRemoveSelection,
}: {
  signedIn: boolean;
  concepts: MarketplaceEventConcept[];
  active: MarketplaceEventConcept | null;
  busy: boolean;
  onCreate: (title: string) => Promise<void>;
  onSelect: (id: string) => void;
  onUpdate: (input: MarketplaceEventConceptInput) => Promise<void>;
  onDiscover: (request: DiscoveryRequest) => Promise<void>;
  onRemoveSelection: (resourceId: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<MarketplaceDiscoveryPath>('AiAssistant');
  const [brief, setBrief] = useState('');
  const [message, setMessage] = useState('');

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get('title')).trim();
    if (title) await onCreate(title);
    event.currentTarget.reset();
  }

  async function runAssistant() {
    const result = interpretEventRequest(brief);
    await onUpdate({
      lastDiscoveryPath: 'AiAssistant', assistantBrief: brief, eventType: result.eventType || undefined,
      guestCount: result.guests ?? undefined, city: result.city || undefined,
      style: result.style.join(', ') || undefined, colours: result.colours,
      budgetCents: result.budget === null ? undefined : result.budget * 100,
      requirements: result.categories, searchTerms: result.searchTerms,
    });
    setMessage(result.followUpQuestions.length ? `Saved. Still helpful: ${result.followUpQuestions.join(' ')}` : 'Brief understood and saved to this event.');
    await onDiscover(combinedEventDiscoveryRequest(result.searchTerms, 'AiAssistant'));
  }

  async function runGuided(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const eventType = String(data.get('eventType'));
    const style = String(data.get('style'));
    const colours = String(data.get('colours')).split(',').map((value) => value.trim()).filter(Boolean);
    const theme = String(data.get('theme'));
    const requirements = String(data.get('requirements')).split(',').map((value) => value.trim()).filter(Boolean);
    const terms = guidedEventSearchTerms(eventType, style, colours, theme);
    await onUpdate({
      lastDiscoveryPath: 'GuidedBuilder', eventType, eventDate: String(data.get('eventDate')) || undefined,
      guestCount: Number(data.get('guestCount')) || undefined, venueStatus: String(data.get('venueStatus')) || undefined,
      venueName: String(data.get('venueName')) || undefined, city: String(data.get('city')) || undefined,
      area: String(data.get('area')) || undefined, travelRadiusKm: Number(data.get('travelRadiusKm')) || undefined,
      setting: String(data.get('setting')) || undefined, theme, style, colours,
      budgetCents: Number(data.get('budget')) ? Number(data.get('budget')) * 100 : undefined,
      requirements, searchTerms: terms,
    });
    setMessage('Guided requirements saved. Recommendations now use the combined event brief.');
    await onDiscover(combinedEventDiscoveryRequest(terms, 'GuidedBuilder'));
  }

  return (
    <section className="border-b border-stone-200 bg-[#fffdf9] px-5 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">One event, three discovery paths</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your shared event workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Start with AI, answer the guided questions, or search manually. Every path updates the same developing event and the same shortlist.</p>
          </div>
          {signedIn ? (
            <form onSubmit={create} className="flex gap-2">
              <input name="title" required placeholder="New event name" className="min-w-0 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm" />
              <button disabled={busy} className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white">Create</button>
            </form>
          ) : <a href="/marketplace/account" className="rounded-full bg-stone-950 px-5 py-3 text-center text-sm font-semibold text-white">Sign in to save an event</a>}
        </div>

        {signedIn && active ? (
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.75fr)]">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <select aria-label="Active event" value={active.id} onChange={(event) => onSelect(event.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 font-semibold">
                  {concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.title}</option>)}
                </select>
                <div className="flex rounded-full bg-stone-100 p-1 text-xs font-semibold">
                  {([['AiAssistant', 'AI assistant'], ['GuidedBuilder', 'Guided builder'], ['ManualSearch', 'Manual search']] as const).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-full px-3 py-2 ${mode === value ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{label}</button>
                  ))}
                </div>
              </div>

              {mode === 'AiAssistant' ? <div className="mt-6">
                <label className="text-sm font-semibold">Describe the event and desired outcome</label>
                <textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Elegant outdoor wedding for 120 guests in Pretoria, neutral colours, budget R180000..." className="mt-2 min-h-32 w-full rounded-2xl border border-stone-200 p-4 text-sm" />
                <button type="button" disabled={busy || !brief.trim()} onClick={() => void runAssistant()} className="mt-3 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">Understand and discover</button>
              </div> : null}

              {mode === 'GuidedBuilder' ? <form onSubmit={runGuided} className="mt-6 grid gap-3 sm:grid-cols-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 sm:col-span-2">1. Event basics</p>
                <input name="eventType" required placeholder="Event type" defaultValue={active.eventType ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="eventDate" type="date" defaultValue={active.eventDate?.slice(0, 10) ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="guestCount" type="number" min="1" placeholder="Number of guests" defaultValue={active.guestCount ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 sm:col-span-2">2. Venue and location</p>
                <select name="venueStatus" defaultValue={active.venueStatus ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm"><option value="">Venue status</option><option>Need a venue</option><option>Venue shortlisted</option><option>Venue confirmed</option></select>
                <input name="venueName" placeholder="Venue name (if known)" defaultValue={active.venueName ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="city" placeholder="City" defaultValue={active.city ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="area" placeholder="Preferred area" defaultValue={active.area ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="travelRadiusKm" type="number" placeholder="Travel radius (km)" defaultValue={active.travelRadiusKm ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 sm:col-span-2">3. Look, theme and budget</p>
                <input name="setting" placeholder="Indoor, outdoor or mixed" defaultValue={active.setting ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="theme" placeholder="Theme" defaultValue={active.theme ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="style" placeholder="Style or feel" defaultValue={active.style ?? ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="colours" placeholder="Colours, separated by commas" defaultValue={active.colours.join(', ')} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <input name="budget" type="number" placeholder="Target budget (ZAR)" defaultValue={active.budgetCents ? active.budgetCents / 100 : ''} className="rounded-xl border border-stone-200 p-3 text-sm" />
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 sm:col-span-2">4. Requirements</p>
                <textarea name="requirements" placeholder="Furniture, floral, AV, catering..." defaultValue={active.requirements.join(', ')} className="min-h-20 rounded-xl border border-stone-200 p-3 text-sm sm:col-span-2" />
                <button disabled={busy} className="rounded-full bg-amber-300 px-5 py-3 font-semibold sm:col-span-2">Save and show combined recommendations</button>
              </form> : null}

              {mode === 'ManualSearch' ? <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-600"><strong className="block text-stone-950">Use the catalogue controls below.</strong>Search, categories and filters remain fully manual, while anything you add is kept in <em>{active.title}</em>. This lets you refine or replace AI and guided suggestions without starting again.</div> : null}
              {message ? <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p> : null}
            </div>

            <aside className="rounded-3xl bg-stone-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Developing concept</p>
              <h3 className="mt-2 text-2xl font-semibold">{active.title}</h3>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-stone-400">Event</dt><dd>{active.eventType || 'Not set'}</dd></div><div><dt className="text-stone-400">Guests</dt><dd>{active.guestCount || 'Not set'}</dd></div><div><dt className="text-stone-400">Location</dt><dd>{active.city || active.area || 'Not set'}</dd></div><div><dt className="text-stone-400">Budget</dt><dd>{active.budgetCents ? `R ${(active.budgetCents / 100).toLocaleString('en-ZA')}` : 'Not set'}</dd></div></dl>
              <div className="mt-6 border-t border-stone-700 pt-5"><p className="font-semibold">Selected for this event ({active.selections.length})</p>
                <div className="mt-3 space-y-3">{active.selections.length ? active.selections.map((selection) => <div key={selection.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/10 p-3"><div><p className="text-sm font-medium">{selection.listing.title}</p><p className="text-xs text-stone-400">via {selection.discoveryPath.replace(/([A-Z])/g, ' $1').trim()}</p></div><button type="button" onClick={() => void onRemoveSelection(selection.resourceId)} className="text-xs text-stone-300 underline">Remove</button></div>) : <p className="text-sm text-stone-400">Add listings below from any discovery path.</p>}</div>
              </div>
            </aside>
          </div>
        ) : signedIn ? <p className="mt-6 rounded-2xl bg-stone-100 p-5 text-sm text-stone-600">Create your first event to connect all three discovery paths.</p> : null}
      </div>
    </section>
  );
}

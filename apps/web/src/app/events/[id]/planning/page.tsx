'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  approveEventDesign,
  approveRequirementSet,
  createClientBrief,
  createEventDesign,
  createRequirementSet,
  listClientBriefs,
  listEventDesigns,
  listRequirementSets,
} from '../../../../lib/event-planning-api';
import type { ClientBriefVersion, EventDesignVersion, RequirementSet } from '../../../../lib/event-planning-types';

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

export default function EventPlanningPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = { token: session.token, baseUrl: session.baseUrl };
  const [briefs, setBriefs] = useState<ClientBriefVersion[]>([]);
  const [designs, setDesigns] = useState<EventDesignVersion[]>([]);
  const [sets, setSets] = useState<RequirementSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token) return;
    setLoading(true);
    setError('');
    try {
      const requestOptions = { token: session.token, baseUrl: session.baseUrl };
      const [briefRows, designRows, setRows] = await Promise.all([
        listClientBriefs(requestOptions, eventId),
        listEventDesigns(requestOptions, eventId),
        listRequirementSets(requestOptions, eventId),
      ]);
      setBriefs(briefRows);
      setDesigns(designRows);
      setSets(setRows);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load planning workspace.');
    } finally {
      setLoading(false);
    }
  }, [eventId, session.baseUrl, session.token]);

  useEffect(() => {
    // Remote planning state follows the selected event.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function submitBrief(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    setError('');
    try {
      await createClientBrief(options, eventId, {
        clientName: String(data.get('clientName')),
        eventName: String(data.get('eventName')),
        eventDates: [String(data.get('eventDate'))],
        venue: String(data.get('venue')) || undefined,
        expectedGuests: Number(data.get('expectedGuests')) || undefined,
        eventType: String(data.get('eventType')),
        clientObjectives: String(data.get('clientObjectives')) || undefined,
        initialRequirements: String(data.get('initialRequirements')) || undefined,
      });
      formEvent.currentTarget.reset();
      setMessage('A new immutable Client Brief version was created.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create Client Brief.');
    }
  }

  async function submitDesign(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    const designNotes = String(data.get('designNotes')).trim();
    try {
      await createEventDesign(options, eventId, {
        clientBriefVersionId: String(data.get('briefId')),
        decor: designNotes ? { direction: designNotes } : undefined,
      });
      formEvent.currentTarget.reset();
      setMessage('A new immutable Event Design version was created.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create Event Design.');
    }
  }

  async function submitRequirement(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    try {
      await createRequirementSet(options, eventId, {
        eventDesignVersionId: String(data.get('designId')),
        items: [{
          category: String(data.get('category')),
          requirementType: String(data.get('requirementType')) as 'Product' | 'Service' | 'Resource',
          name: String(data.get('name')),
          description: String(data.get('description')) || undefined,
          quantityRequired: Number(data.get('quantity')),
          unit: String(data.get('unit')),
          quantitySource: 'Manual',
          fulfilmentStrategy: String(data.get('strategy')) as 'OwnInventory' | 'Marketplace' | 'ExternalSupplier' | 'Hybrid' | 'Undecided',
        }],
      });
      formEvent.currentTarget.reset();
      setMessage('A new versioned Requirement Set was created.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create Requirement Set.');
    }
  }

  async function approve(kind: 'design' | 'requirements', recordId: string) {
    setError('');
    try {
      if (kind === 'design') await approveEventDesign(options, eventId, recordId);
      else await approveRequirementSet(options, eventId, recordId);
      setMessage(kind === 'design' ? 'Event Design approved.' : 'Requirement Set approved.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Approval failed.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Event Design & Requirements" description="Create versioned planning records and explicitly approve them for downstream use." actions={<Link href={`/events/${eventId}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Back to Event</Link>} />
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-zinc-600">Loading planning workspace…</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitBrief} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5">
          <div><h2 className="font-semibold">1. Client Brief</h2><p className="text-sm text-zinc-600">Each submission creates a new immutable version.</p></div>
          <input required name="clientName" placeholder="Client name" className={fieldClass} />
          <input required name="eventName" placeholder="Event name" className={fieldClass} />
          <div className="grid gap-3 sm:grid-cols-2"><input required name="eventDate" type="date" className={fieldClass} /><input required name="eventType" placeholder="Event type" className={fieldClass} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><input name="venue" placeholder="Venue" className={fieldClass} /><input name="expectedGuests" type="number" min="0" placeholder="Expected guests" className={fieldClass} /></div>
          <textarea name="clientObjectives" placeholder="Client objectives" className={fieldClass} />
          <textarea name="initialRequirements" placeholder="Initial requirements" className={fieldClass} />
          <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Create Brief Version</button>
        </form>
        <VersionList title="Brief history" empty="No Client Brief versions yet.">{briefs.map((brief) => <VersionCard key={brief.id} title={`Version ${brief.version} · ${brief.eventName}`} detail={`${brief.clientName} · ${brief.eventType}`} />)}</VersionList>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitDesign} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5">
          <div><h2 className="font-semibold">2. Event Design</h2><p className="text-sm text-zinc-600">Base the design on a specific Client Brief version.</p></div>
          <select required name="briefId" className={fieldClass} defaultValue=""><option value="" disabled>Select Client Brief</option>{briefs.map((brief) => <option key={brief.id} value={brief.id}>Version {brief.version} · {brief.eventName}</option>)}</select>
          <textarea name="designNotes" placeholder="Design direction and decor intent" className={fieldClass} />
          <button disabled={!briefs.length} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">Create Design Version</button>
        </form>
        <VersionList title="Design history" empty="No Event Design versions yet.">{designs.map((design) => <VersionCard key={design.id} title={`Version ${design.version}`} detail={design.status} action={design.status !== 'Approved' ? <button onClick={() => void approve('design', design.id)} className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800">Approve</button> : undefined} />)}</VersionList>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitRequirement} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5">
          <div><h2 className="font-semibold">3. Requirement Set</h2><p className="text-sm text-zinc-600">Start a set from an approved design. Additional items follow as focused editing work.</p></div>
          <select required name="designId" className={fieldClass} defaultValue=""><option value="" disabled>Select approved design</option>{designs.filter((row) => row.status === 'Approved').map((design) => <option key={design.id} value={design.id}>Design version {design.version}</option>)}</select>
          <div className="grid gap-3 sm:grid-cols-2"><input required name="category" placeholder="Category" className={fieldClass} /><select required name="requirementType" className={fieldClass}><option>Product</option><option>Service</option><option>Resource</option></select></div>
          <input required name="name" placeholder="Requirement name" className={fieldClass} />
          <textarea name="description" placeholder="Description" className={fieldClass} />
          <div className="grid gap-3 sm:grid-cols-2"><input required name="quantity" type="number" min="0" step="any" placeholder="Quantity" className={fieldClass} /><input required name="unit" placeholder="Unit" className={fieldClass} /></div>
          <select name="strategy" className={fieldClass} defaultValue="Undecided"><option>Undecided</option><option>OwnInventory</option><option>Marketplace</option><option>ExternalSupplier</option><option>Hybrid</option></select>
          <button disabled={!designs.some((row) => row.status === 'Approved')} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">Create Requirement Set</button>
        </form>
        <VersionList title="Requirement history" empty="No Requirement Set versions yet.">{sets.map((set) => <VersionCard key={set.id} title={`Version ${set.version} · ${set.items.length} requirements`} detail={set.status} action={set.status !== 'Approved' ? <button onClick={() => void approve('requirements', set.id)} className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800">Approve</button> : undefined} />)}</VersionList>
      </section>
    </div>
  );
}

function VersionList({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{children || <p className="text-sm text-zinc-600">{empty}</p>}</div></div>;
}

function VersionCard({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-zinc-600">{detail}</p></div>{action}</div>;
}

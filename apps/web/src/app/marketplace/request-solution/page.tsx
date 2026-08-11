'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createMarketplaceSolutionRequest } from '../../../lib/marketplace-public-api';
import { MarketplaceFooter, MarketplaceHeader } from '../../../components/marketplace/marketplace-shell';

const serviceOptions = ['Audio visual', 'Catering', 'Event production', 'Entertainment', 'Logistics', 'Security', 'Staffing', 'Technical services', 'Transport'];

function MarketplaceSolutionRequestForm() {
  const searchParams = useSearchParams();
  const supplierSlug = searchParams.get('supplier') || '';
  const supplierName = searchParams.get('name') || 'Supplier';
  const [services, setServices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const budgetRands = Number(form.get('budgetRands') || 0);
      await createMarketplaceSolutionRequest({
        supplierSlug,
        customerName: String(form.get('customerName') || ''),
        customerEmail: String(form.get('customerEmail') || ''),
        customerPhone: String(form.get('customerPhone') || '') || undefined,
        requestTitle: String(form.get('requestTitle') || ''),
        serviceCategories: services,
        eventType: String(form.get('eventType') || '') || undefined,
        eventDate: String(form.get('eventDate') || '') || undefined,
        eventLocation: String(form.get('eventLocation') || '') || undefined,
        guestCount: Number(form.get('guestCount') || 0) || undefined,
        budgetCents: budgetRands > 0 ? Math.round(budgetRands * 100) : undefined,
        desiredOutcomes: String(form.get('desiredOutcomes') || '').split(',').map((value) => value.trim()).filter(Boolean),
        scheduleNotes: String(form.get('scheduleNotes') || '') || undefined,
        accessNotes: String(form.get('accessNotes') || '') || undefined,
        message: String(form.get('message') || ''),
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  return <><MarketplaceHeader compact /><main className="min-h-screen bg-[#f5f1e9] px-5 py-10 text-stone-950 md:px-10"><div className="mx-auto max-w-4xl">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Tailored supplier solution</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Brief {supplierName}</h1>
    <p className="mt-4 max-w-2xl text-stone-600">Describe the outcome you need. The supplier will receive a structured request in ClientOS and can respond with questions, a proposed solution and a quotation.</p>
    {submitted ? <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-8"><h2 className="text-2xl font-semibold">Request sent</h2><p className="mt-2 text-emerald-900">The supplier can now qualify the brief and prepare a tailored response in ClientOS.</p><a href="/marketplace" className="mt-5 inline-block font-semibold underline">Return to Marketplace</a></section> :
    <form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-8">
      <label className="md:col-span-2">Request title<input name="requestTitle" required placeholder="AV solution for 500-person corporate event" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Your name<input name="customerName" required className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Email<input name="customerEmail" type="email" required className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Phone<input name="customerPhone" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Event type<input name="eventType" placeholder="Conference, wedding, launch..." className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Event date<input name="eventDate" type="date" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Location or venue<input name="eventLocation" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Guest count<input name="guestCount" type="number" min="1" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Indicative budget (ZAR)<input name="budgetRands" type="number" min="0" step="1" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <fieldset className="md:col-span-2"><legend className="font-medium">Services required</legend><div className="mt-3 flex flex-wrap gap-2">{serviceOptions.map((option) => <label key={option} className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${services.includes(option) ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300'}`}><input type="checkbox" className="sr-only" checked={services.includes(option)} onChange={() => setServices((current) => current.includes(option) ? current.filter((value) => value !== option) : [...current, option])} />{option}</label>)}</div></fieldset>
      <label className="md:col-span-2">Desired outcomes (comma separated)<input name="desiredOutcomes" placeholder="Clear speech, stage coverage, recording" className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Schedule notes<textarea name="scheduleNotes" rows={3} placeholder="Load-in, rehearsals, event timings..." className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label>Access or venue constraints<textarea name="accessNotes" rows={3} placeholder="Loading access, power, rigging limits..." className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <label className="md:col-span-2">Detailed brief<textarea name="message" required rows={6} placeholder="Describe what the supplier must solve, important preferences and any alternatives they may propose." className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      {error ? <p role="alert" className="md:col-span-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={busy || !supplierSlug || services.length === 0} className="rounded-full bg-stone-950 px-6 py-3 font-semibold text-white disabled:opacity-40 md:col-span-2">{busy ? 'Sending...' : 'Send structured request'}</button>
    </form>}
  </div></main><MarketplaceFooter /></>;
}

export default function MarketplaceSolutionRequestPage() {
  return <Suspense fallback={null}><MarketplaceSolutionRequestForm /></Suspense>;
}

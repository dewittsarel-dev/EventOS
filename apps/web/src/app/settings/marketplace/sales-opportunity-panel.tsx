'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { convertMarketplaceOpportunity, createMarketplaceOpportunity, updateMarketplaceOpportunity } from '../../../lib/marketplace-public-api';
import type { MarketplaceEnquiry } from '../../../lib/marketplace-public-types';

type Props = { entry: MarketplaceEnquiry; options: { baseUrl: string; token: string; organizationId: string }; onChanged: () => Promise<void> };
const field = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm';

export function SalesOpportunityPanel({ entry, options, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const opportunity = entry.opportunity;

  async function act(work: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await work(); await onChanged(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Opportunity action failed.'); } finally { setBusy(false); }
  }

  async function qualify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!opportunity) return;
    const data = new FormData(event.currentTarget);
    await act(() => updateMarketplaceOpportunity(options, opportunity.id, { status: String(data.get('status')) as 'Qualifying' | 'Qualified' | 'Lost', title: String(data.get('title')), eventType: String(data.get('eventType')) || undefined, eventDate: String(data.get('eventDate')) || undefined, venue: String(data.get('venue')) || undefined, estimatedValueCents: data.get('estimatedValue') ? Math.round(Number(data.get('estimatedValue')) * 100) : undefined, qualificationNotes: String(data.get('qualificationNotes')) || undefined }));
  }

  async function convert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!opportunity) return;
    const data = new FormData(event.currentTarget);
    await act(() => convertMarketplaceOpportunity(options, opportunity.id, { confirmationEvidenceType: String(data.get('confirmationEvidenceType')), confirmationReference: String(data.get('confirmationReference')), title: String(data.get('title')), eventType: String(data.get('eventType')), eventDate: String(data.get('eventDate')), startTime: String(data.get('startTime')), endTime: String(data.get('endTime')), venue: String(data.get('venue')), budgetCents: data.get('budget') ? Math.round(Number(data.get('budget')) * 100) : undefined }));
  }

  return <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
    {error ? <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
    {!opportunity ? <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Not yet qualified</p><p className="text-xs text-zinc-500">Create an opportunity before adding this enquiry to the Events workspace.</p></div><button disabled={busy} onClick={() => void act(() => createMarketplaceOpportunity(options, entry.id))} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Create sales opportunity</button></div> : <>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Sales opportunity</p><p className="font-semibold">{opportunity.title}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{opportunity.status}</span></div>
      {opportunity.eventId ? <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><p className="font-semibold">Converted to a Draft Event</p><p className="mt-1 text-xs">Evidence: {opportunity.confirmationEvidenceType} — {opportunity.confirmationReference}</p><Link href={`/events/${opportunity.eventId}`} className="mt-2 inline-block font-medium underline">Open Event workspace</Link></div> : <form onSubmit={qualify} className="mt-4 grid gap-2 sm:grid-cols-2"><input required name="title" defaultValue={opportunity.title} placeholder="Opportunity title" className={field} /><select name="status" defaultValue={opportunity.status === 'New' ? 'Qualifying' : opportunity.status} className={field}><option>Qualifying</option><option>Qualified</option><option>Lost</option></select><input name="eventType" defaultValue={opportunity.eventType || ''} placeholder="Event type" className={field} /><input type="date" name="eventDate" defaultValue={opportunity.eventDate?.slice(0, 10) || entry.eventDate?.slice(0, 10) || ''} className={field} /><input name="venue" defaultValue={opportunity.venue || entry.eventLocation || ''} placeholder="Venue or location" className={field} /><input type="number" min="0" step="0.01" name="estimatedValue" defaultValue={opportunity.estimatedValueCents ? opportunity.estimatedValueCents / 100 : ''} placeholder="Estimated value (ZAR)" className={field} /><textarea name="qualificationNotes" defaultValue={opportunity.qualificationNotes || entry.message} placeholder="Qualification notes" className={`${field} min-h-20 sm:col-span-2`} /><button disabled={busy} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50 sm:col-span-2">Save qualification</button></form>}
      {opportunity.status === 'Qualified' && !opportunity.eventId ? <form onSubmit={convert} className="mt-5 grid gap-2 border-t border-zinc-200 pt-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="font-semibold">Convert to Event</p><p className="text-xs text-zinc-500">This explicit action creates the authoritative Event as Draft and records your confirmation evidence.</p></div><select required name="confirmationEvidenceType" className={field}><option value="">Choose confirmation evidence</option><option value="AcceptedQuotation">Accepted quotation</option><option value="DepositReceived">Deposit received</option><option value="SignedAgreement">Signed agreement</option><option value="ManagerApproval">Manager approval</option><option value="Other">Other documented confirmation</option></select><input required name="confirmationReference" placeholder="Evidence reference or explanation" className={field} /><input required name="title" defaultValue={opportunity.title} placeholder="Event title" className={field} /><input required name="eventType" defaultValue={opportunity.eventType || ''} placeholder="Event type" className={field} /><input required type="date" name="eventDate" defaultValue={opportunity.eventDate?.slice(0, 10) || ''} className={field} /><input required name="venue" defaultValue={opportunity.venue || ''} placeholder="Venue" className={field} /><input required type="time" name="startTime" defaultValue="09:00" className={field} /><input required type="time" name="endTime" defaultValue="17:00" className={field} /><input type="number" min="0" step="0.01" name="budget" placeholder="Budget (ZAR, optional)" className={field} /><button disabled={busy} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Authorise Draft Event creation</button></form> : null}
    </>}
  </div>;
}

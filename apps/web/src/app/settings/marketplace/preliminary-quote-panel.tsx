'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createMarketplacePreliminaryQuote, sendMarketplacePreliminaryQuote } from '@/lib/marketplace-public-api';
import type { MarketplaceEnquiry, MarketplacePreliminaryQuote } from '@/lib/marketplace-public-types';

type Props = {
  entry: MarketplaceEnquiry;
  options: { baseUrl: string; token: string; organizationId: string };
  onChanged: () => Promise<void>;
};

type LineDraft = { description: string; quantity: string; unit: string; unitPrice: string; notes: string };
const field = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm';
const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

function blankLine(entry: MarketplaceEnquiry): LineDraft {
  return { description: entry.listing.name, quantity: String(entry.quantity ?? 1), unit: 'Each', unitPrice: '', notes: '' };
}

function lineFromQuote(line: MarketplacePreliminaryQuote['lines'][number]): LineDraft {
  return { description: line.description, quantity: String(line.quantity), unit: line.unit, unitPrice: String(line.unitPriceCents / 100), notes: line.notes ?? '' };
}

export function PreliminaryQuotePanel({ entry, options, onChanged }: Props) {
  const quotes = entry.preliminaryQuotes ?? [];
  const latest = quotes[0];
  const [lines, setLines] = useState<LineDraft[]>([blankLine(entry)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(!latest);
  const estimate = useMemo(() => lines.reduce((total, line) => total + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0), [lines]);

  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await work();
      await onChanged();
      setShowForm(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Quotation action failed.');
    } finally {
      setBusy(false);
    }
  }

  function revise(quote?: MarketplacePreliminaryQuote) {
    setLines(quote?.lines.length ? quote.lines.map(lineFromQuote) : [blankLine(entry)]);
    setShowForm(true);
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await act(() =>
      createMarketplacePreliminaryQuote(options, entry.id, {
        currency: 'ZAR',
        discountCents: Math.round((Number(data.get('discount')) || 0) * 100),
        deliveryFeeCents: Math.round((Number(data.get('deliveryFee')) || 0) * 100),
        taxCents: Math.round((Number(data.get('tax')) || 0) * 100),
        paymentTerms: String(data.get('paymentTerms') || '') || undefined,
        validUntil: String(data.get('validUntil') || '') || undefined,
        notes: String(data.get('notes') || '') || undefined,
        lines: lines.map((line) => ({
          description: line.description,
          quantity: Number(line.quantity),
          unit: line.unit,
          unitPriceCents: Math.round(Number(line.unitPrice) * 100),
          notes: line.notes || undefined,
        })),
      }),
    );
  }

  return (
    <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Preliminary quotations</p>
          <p className="mt-1 text-xs text-zinc-600">Prepare and revise estimates before any booking, purchase order or contract is created.</p>
        </div>
        <button type="button" onClick={() => revise(latest)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium">
          {latest ? 'Create revised draft' : 'Create quotation'}
        </button>
      </div>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}

      {quotes.length ? (
        <div className="mt-4 space-y-2">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Version {quote.version} · {money.format(quote.totalCents / 100)}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium">{quote.status}</span>
                  {quote.status === 'Draft' ? (
                    <button disabled={busy} type="button" onClick={() => void act(() => sendMarketplacePreliminaryQuote(options, entry.id, quote.id))} className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Send to customer</button>
                  ) : null}
                </div>
              </div>
              <details className="mt-2 text-xs text-zinc-600">
                <summary className="cursor-pointer">View {quote.lines.length} line item{quote.lines.length === 1 ? '' : 's'}</summary>
                <div className="mt-2 space-y-1">
                  {quote.lines.map((line) => <p key={line.id}>{line.quantity} {line.unit} × {line.description} — {money.format(line.lineTotalCents / 100)}</p>)}
                  {quote.paymentTerms ? <p className="pt-1"><strong>Payment:</strong> {quote.paymentTerms}</p> : null}
                  {quote.notes ? <p><strong>Notes:</strong> {quote.notes}</p> : null}
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={createDraft} className="mt-4 space-y-3 border-t border-amber-200 pt-4">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-6">
              <input required value={line.description} onChange={(event) => setLines((current) => current.map((item, row) => row === index ? { ...item, description: event.target.value } : item))} placeholder="Item or service" className={`${field} sm:col-span-2`} />
              <input required min="0.01" step="0.01" type="number" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, row) => row === index ? { ...item, quantity: event.target.value } : item))} placeholder="Quantity" className={field} />
              <input required value={line.unit} onChange={(event) => setLines((current) => current.map((item, row) => row === index ? { ...item, unit: event.target.value } : item))} placeholder="Unit" className={field} />
              <input required min="0" step="0.01" type="number" value={line.unitPrice} onChange={(event) => setLines((current) => current.map((item, row) => row === index ? { ...item, unitPrice: event.target.value } : item))} placeholder="Unit price (ZAR)" className={field} />
              <button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, row) => row !== index))} className="rounded-lg px-2 text-xs text-red-700 disabled:opacity-30">Remove</button>
              <input value={line.notes} onChange={(event) => setLines((current) => current.map((item, row) => row === index ? { ...item, notes: event.target.value } : item))} placeholder="Line note or requested adjustment" className={`${field} sm:col-span-6`} />
            </div>
          ))}
          <button type="button" onClick={() => setLines((current) => [...current, { description: '', quantity: '1', unit: 'Each', unitPrice: '', notes: '' }])} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium">Add line</button>
          <div className="grid gap-2 sm:grid-cols-3">
            <input min="0" step="0.01" type="number" name="discount" placeholder="Discount (ZAR)" className={field} />
            <input min="0" step="0.01" type="number" name="deliveryFee" placeholder="Delivery (ZAR)" className={field} />
            <input min="0" step="0.01" type="number" name="tax" placeholder="Tax (ZAR)" className={field} />
            <input name="paymentTerms" placeholder="Payment terms" className={field} />
            <input type="date" name="validUntil" aria-label="Quotation valid until" className={field} />
            <p className="flex items-center rounded-lg bg-white px-3 text-sm font-semibold">Line estimate: {money.format(estimate)}</p>
            <textarea name="notes" placeholder="Quotation notes and assumptions" className={`${field} min-h-20 sm:col-span-3`} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-2 text-xs">Cancel</button>
            <button disabled={busy} className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">Save draft quotation</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

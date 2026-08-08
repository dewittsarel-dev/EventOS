'use client';

import { useState } from 'react';
import {
  applyRequirementImpactReport,
  createRequirementImpactReport,
} from '../../lib/event-planning-api';
import type {
  RequirementImpactReport,
  RequirementSet,
} from '../../lib/event-planning-types';

type Props = {
  eventId: string;
  token: string;
  baseUrl: string;
  sets: RequirementSet[];
  reports: RequirementImpactReport[];
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
};

export function RequirementImpactPanel({ eventId, token, baseUrl, sets, reports, onChanged, onError }: Props) {
  const approvedSets = sets.filter((set) => set.status === 'Approved');
  const [baselineId, setBaselineId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [decisions, setDecisions] = useState<Record<string, 'Apply' | 'KeepCurrent' | ''>>({});
  const options = { token, baseUrl };
  const baseline = approvedSets.find((set) => set.id === baselineId);

  function selectBaseline(setId: string) {
    setBaselineId(setId);
    const selected = approvedSets.find((set) => set.id === setId);
    setQuantities(Object.fromEntries((selected?.items ?? []).map((item) => [item.id, item.quantityRequired])));
  }

  async function createReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!baseline) return;
    onError('');
    try {
      await createRequirementImpactReport(
        options,
        eventId,
        baseline.id,
        baseline.items.map((item) => ({
          requirementCode: item.requirementCode,
          category: item.category,
          requirementType: item.requirementType,
          name: item.name,
          description: item.description ?? undefined,
          quantityRequired: quantities[item.id] ?? item.quantityRequired,
          unit: item.unit,
          quantitySource: item.quantitySource,
          fulfilmentStrategy: item.fulfilmentStrategy ?? 'Undecided',
        })),
      );
      setBaselineId('');
      setQuantities({});
      await onChanged('Requirement Impact Report created for explicit planner review.');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create Impact Report.');
    }
  }

  async function applyReport(report: RequirementImpactReport) {
    const reportDecisions = report.changes.map((change) => ({
      changeId: change.id,
      decision: decisions[change.id],
    }));
    if (reportDecisions.some((row) => !row.decision)) {
      onError('Choose Apply or Keep current for every proposed change.');
      return;
    }
    onError('');
    try {
      await applyRequirementImpactReport(
        options,
        eventId,
        report.id,
        reportDecisions as Array<{ changeId: string; decision: 'Apply' | 'KeepCurrent' }>,
      );
      setDecisions({});
      await onChanged('Planner decisions were applied as a new Requirement Set version.');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to apply Impact Report.');
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
      <h2 className="font-semibold">Requirement impact review</h2>
      <p className="mt-1 text-sm text-zinc-600">Compare proposed quantities with an approved baseline. EventOS reports consequences; the planner decides every change.</p>

      <form onSubmit={createReport} className="mt-4 grid gap-3 rounded-lg border border-zinc-200 p-4">
        <select value={baselineId} onChange={(event) => selectBaseline(event.target.value)} required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="" disabled>Select approved baseline</option>
          {approvedSets.map((set) => <option key={set.id} value={set.id}>Requirement Set version {set.version}</option>)}
        </select>
        {baseline?.items.map((item) => (
          <label key={item.id} className="grid gap-2 text-sm sm:grid-cols-[1fr_9rem] sm:items-center">
            <span>{item.requirementCode} · {item.name} <span className="text-zinc-500">(current: {item.quantityRequired} {item.unit})</span></span>
            <input aria-label={`Proposed quantity for ${item.requirementCode}`} type="number" min="0" step="any" value={quantities[item.id] ?? item.quantityRequired} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="rounded border border-zinc-300 px-2 py-1.5" />
          </label>
        ))}
        <button disabled={!baseline} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">Create Impact Report</button>
      </form>

      <div className="mt-5 grid gap-4">
        {reports.map((report) => (
          <article key={report.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-medium">Impact Report · {report.affectedItems} changes</h3><p className="text-xs text-zinc-600">{report.status}{report.requiresProcurementReview ? ' · Procurement review required' : ''}</p></div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{report.status}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {report.changes.map((change) => (
                <div key={change.id} className="grid gap-2 rounded-md bg-zinc-50 p-3 sm:grid-cols-[1fr_11rem] sm:items-center">
                  <div><p className="text-sm font-medium">{change.requirementCode} · {change.changeType}</p><p className="text-xs text-zinc-600">Current: {String(change.previousItem?.quantityRequired ?? '—')} · Proposed: {String(change.proposedItem?.quantityRequired ?? '—')}</p></div>
                  {report.status === 'PendingReview' ? (
                    <select aria-label={`Decision for ${change.requirementCode}`} value={decisions[change.id] ?? ''} onChange={(event) => setDecisions((current) => ({ ...current, [change.id]: event.target.value as 'Apply' | 'KeepCurrent' }))} className="rounded border border-zinc-300 px-2 py-1.5 text-sm">
                      <option value="" disabled>Choose decision</option><option value="Apply">Apply proposal</option><option value="KeepCurrent">Keep current</option>
                    </select>
                  ) : <span className="text-xs text-zinc-600">Decision: {change.decision}</span>}
                </div>
              ))}
            </div>
            {report.status === 'PendingReview' && report.changes.length ? <button type="button" onClick={() => void applyReport(report)} className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Apply reviewed decisions</button> : null}
          </article>
        ))}
        {!reports.length ? <p className="text-sm text-zinc-600">No Impact Reports yet.</p> : null}
      </div>
    </section>
  );
}

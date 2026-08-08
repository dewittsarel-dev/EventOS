'use client';

import { approveRequirementSet, overrideRequirementQuantity } from '../../lib/event-planning-api';
import type { RequirementSet } from '../../lib/event-planning-types';

type Props = {
  eventId: string;
  token: string;
  baseUrl: string;
  sets: RequirementSet[];
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
};

export function RequirementHistory({ eventId, token, baseUrl, sets, onChanged, onError }: Props) {
  const options = { token, baseUrl };

  async function approve(setId: string) {
    onError('');
    try {
      await approveRequirementSet(options, eventId, setId);
      await onChanged('Requirement Set approved for downstream use.');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Approval failed.');
    }
  }

  async function override(event: React.FormEvent<HTMLFormElement>, setId: string, requirementCode: string) {
    event.preventDefault();
    const form = event.currentTarget;
    onError('');
    const data = new FormData(form);
    try {
      await overrideRequirementQuantity(options, eventId, setId, {
        requirementCode,
        quantityRequired: Number(data.get('quantityRequired')),
        reason: String(data.get('reason')),
      });
      form.reset();
      await onChanged(`A new Requirement Set version was created for ${requirementCode}.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Quantity override failed.');
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
      <h2 className="font-semibold">Requirement history</h2>
      <p className="mt-1 text-sm text-zinc-600">Approved records remain unchanged. Overrides create a new auditable version.</p>
      {!sets.length ? <p className="mt-3 text-sm text-zinc-600">No Requirement Set versions yet.</p> : null}
      <div className="mt-4 grid gap-4">
        {sets.map((set) => (
          <article key={set.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Version {set.version} · {set.items.length} requirements</h3>
                <p className="text-xs text-zinc-600">{set.status}</p>
              </div>
              {set.status !== 'Approved' ? <button type="button" onClick={() => void approve(set.id)} className="rounded border border-emerald-300 px-3 py-1.5 text-xs text-emerald-800">Approve version</button> : null}
            </div>
            <div className="mt-3 grid gap-3">
              {set.items.map((item) => (
                <div key={item.id} className="rounded-md bg-zinc-50 p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-medium">{item.requirementCode} · {item.name}</span>
                    <span className="text-zinc-600">{item.quantityRequired} {item.unit}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.category} · {item.requirementType} · {item.quantitySource}</p>
                  <form onSubmit={(event) => void override(event, set.id, item.requirementCode)} className="mt-3 grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
                    <input required name="quantityRequired" type="number" min="0" step="any" aria-label={`New quantity for ${item.requirementCode}`} placeholder="New quantity" className="rounded border border-zinc-300 px-2 py-1.5 text-xs" />
                    <input required name="reason" maxLength={1000} aria-label={`Override reason for ${item.requirementCode}`} placeholder="Reason for planner override" className="rounded border border-zinc-300 px-2 py-1.5 text-xs" />
                    <button className="rounded border border-zinc-300 px-3 py-1.5 text-xs hover:bg-white">Create override version</button>
                  </form>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

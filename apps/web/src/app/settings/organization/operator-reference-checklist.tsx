'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  loadOperatorReferenceChecklist,
  OPERATOR_REFERENCE_CHECKLIST,
  type OperatorReferenceChecklistId,
  type OperatorReferenceChecklistState,
  saveOperatorReferenceChecklist,
} from '../../../lib/operator-reference-checklist';

export function OperatorReferenceChecklist({ organizationId }: { organizationId: string }) {
  const [state, setState] = useState<OperatorReferenceChecklistState>(() =>
    typeof window === 'undefined'
      ? { enabled: false, completed: [] }
      : loadOperatorReferenceChecklist(organizationId, window.localStorage),
  );

  function update(next: OperatorReferenceChecklistState) {
    setState(next);
    saveOperatorReferenceChecklist(organizationId, next, window.localStorage);
  }

  function toggle(id: OperatorReferenceChecklistId) {
    const completed = state.completed.includes(id)
      ? state.completed.filter((item) => item !== id)
      : [...state.completed, id];
    update({ ...state, completed });
  }

  if (!state.enabled) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Simulation reference company</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">Test EventOS as a real supplier and planner</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-700">
          Use this only on a clearly labelled test organization. It stays separate from the 150 automated businesses and is not removed by simulator reset.
        </p>
        <button
          type="button"
          onClick={() => update({ enabled: true, completed: [] })}
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Use this organization as my simulation reference company
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Operator-managed test company</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900">Supplier + planner test journey</h2>
          <p className="mt-1 text-sm text-zinc-700">{state.completed.length} of {OPERATOR_REFERENCE_CHECKLIST.length} setup steps complete.</p>
        </div>
        <button type="button" onClick={() => update({ enabled: false, completed: [] })} className="text-sm text-zinc-600 underline">
          Stop tracking
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {OPERATOR_REFERENCE_CHECKLIST.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-xl border border-emerald-200 bg-white p-3">
            <input
              aria-label={`Mark ${item.title} complete`}
              type="checkbox"
              checked={state.completed.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-1 h-4 w-4"
            />
            <div className="min-w-0 flex-1">
              <Link href={item.href} className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

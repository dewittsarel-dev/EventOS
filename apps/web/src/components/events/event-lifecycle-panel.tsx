'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEventLifecycle,
  synchronizeEventLifecycle,
} from '../../lib/event-lifecycle-api';
import type { EventLifecycleContinuity } from '../../lib/event-lifecycle-types';

type Props = {
  eventId: string;
  token: string;
  baseUrl: string;
  organizationId: string;
};

const steps = [
  ['Client brief', 'brief'],
  ['Event design', 'design'],
  ['Requirements', 'requirementSet'],
  ['Mood board', 'moodBoard'],
  ['Procurement', 'procurementPackages'],
  ['Commercial', 'commercialWorkspaces'],
  ['Assets', 'assetReservations'],
  ['Execution', 'execution'],
  ['Finance', 'finance'],
] as const;

function stepSummary(
  chain: EventLifecycleContinuity['chain'],
  key: (typeof steps)[number][1],
) {
  const value = chain[key];
  if (Array.isArray(value)) return value.length ? `${value.length} active` : 'Not started';
  if (typeof value === 'number') return value ? `${value} reserved` : 'Not started';
  if (!value) return 'Not started';
  if ('version' in value) return `Version ${value.version}${value.status ? ` · ${value.status}` : ''}`;
  return value.status;
}

export function EventLifecyclePanel(props: Props) {
  const { eventId, token, baseUrl, organizationId } = props;
  const [continuity, setContinuity] = useState<EventLifecycleContinuity | null>(null);
  const [loading, setLoading] = useState(true);
  const [synchronizing, setSynchronizing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    setLoading(true);
    setError('');
    try {
      setContinuity(
        await getEventLifecycle(
          { token, baseUrl, organizationId },
          eventId,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load lifecycle.');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, eventId, organizationId, token]);

  useEffect(() => {
    // Loading remote lifecycle state when the selected event changes is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function synchronize() {
    setSynchronizing(true);
    setError('');
    setMessage('');
    try {
      const result = await synchronizeEventLifecycle(
        { token, baseUrl, organizationId },
        eventId,
      );
      setMessage(
        `Lifecycle synchronized. ${result.commitmentsCreated} commitments and ${result.assetChangesCreated} asset impacts created. No approvals were automated.`,
      );
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Synchronization failed.');
    } finally {
      setSynchronizing(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" aria-labelledby="lifecycle-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="lifecycle-title" className="text-lg font-semibold text-zinc-900">Event lifecycle</h2>
          <p className="mt-1 text-sm text-zinc-600">Approved work and operational readiness across the event journey.</p>
        </div>
        <button
          type="button"
          disabled={!continuity?.executionReady || synchronizing}
          onClick={() => void synchronize()}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {synchronizing ? 'Synchronizing…' : 'Synchronize approved work'}
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-zinc-600">Loading lifecycle…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      {continuity ? (
        <>
          <div className={`mt-5 rounded-xl border p-4 ${continuity.health === 'OnTrack' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current stage</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {continuity.currentStage.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </p>
                <p className="mt-1 text-sm text-zinc-700">{continuity.nextAction.reason}</p>
              </div>
              {continuity.nextAction.actionType === 'OpenPlanningWorkspace' ? (
                <a href={`/events/${eventId}/planning`} className="rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700">
                  {continuity.nextAction.label}
                </a>
              ) : null}
            </div>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {steps.map(([label, key], index) => {
              const summary = stepSummary(continuity.chain, key);
              const available = summary !== 'Not started';
              return (
                <li key={key} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${available ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>{index + 1}</span>
                    <span className="font-medium text-zinc-900">{label}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{summary}</p>
                </li>
              );
            })}
          </ol>

          <div className={`mt-5 rounded-lg p-4 ${continuity.executionReady ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className={`font-medium ${continuity.executionReady ? 'text-emerald-900' : 'text-amber-900'}`}>
              {continuity.executionReady ? 'Approved upstream work is ready for controlled synchronization.' : 'Action is required before execution can proceed.'}
            </p>
            {continuity.blockers.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {continuity.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

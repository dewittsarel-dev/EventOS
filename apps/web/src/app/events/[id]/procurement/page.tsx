'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { WorkspaceNextAction } from '../../../../components/events/workspace-next-action';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { listRequirementSets } from '../../../../lib/event-planning-api';
import type { RequirementSet } from '../../../../lib/event-planning-types';
import {
  analyseProcurementPackage,
  createProcurementPackage,
  listProcurementPackages,
  requestProcurementQuotations,
  selectProcurementSolution,
} from '../../../../lib/procurement-api';
import type {
  ProcurementPackage,
  ProcurementPolicy,
  ProcurementSolution,
} from '../../../../lib/procurement-types';
import { procurementGuidance } from '../../../../lib/event-workspace-guidance';

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

const defaultPolicy: ProcurementPolicy = {
  minimiseCost: true,
  minimiseSuppliers: true,
  supportEmergingBusinesses: false,
  preferLocalSuppliers: false,
  environmentalPreference: false,
  preferExistingRelationships: false,
  balancedMarketplace: false,
  minimumReliabilityPercent: 0,
  maximumSuppliersPerPackage: 2,
};

const policyChoices: Array<{ key: keyof ProcurementPolicy; label: string }> = [
  { key: 'minimiseCost', label: 'Minimise total cost' },
  { key: 'minimiseSuppliers', label: 'Minimise supplier coordination' },
  { key: 'supportEmergingBusinesses', label: 'Support emerging businesses' },
  { key: 'preferLocalSuppliers', label: 'Prefer local suppliers' },
  { key: 'environmentalPreference', label: 'Prioritise sustainability' },
  { key: 'preferExistingRelationships', label: 'Prefer proven relationships' },
  { key: 'balancedMarketplace', label: 'Include Marketplace diversity' },
];

export default function ProcurementStudioPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );
  const [sets, setSets] = useState<RequirementSet[]>([]);
  const [packages, setPackages] = useState<ProcurementPackage[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token) return;
    try {
      const [requirementSets, procurementPackages] = await Promise.all([
        listRequirementSets(options, eventId),
        listProcurementPackages(options, eventId),
      ]);
      setSets(requirementSets);
      setPackages(procurementPackages);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load Procurement Studio.',
      );
    }
  }, [eventId, options, session.token]);

  useEffect(() => {
    // Load the governed procurement workspace for this event.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const approvedSets = sets.filter((set) => set.status === 'Approved');
  const selectedSet = approvedSets.find((set) => set.id === selectedSetId);
  const guidance = procurementGuidance(packages);

  function chooseSet(setId: string) {
    setSelectedSetId(setId);
    const requirementSet = approvedSets.find((set) => set.id === setId);
    setSelectedItems(requirementSet?.items.map((item) => item.id) ?? []);
  }

  function toggleItem(itemId: string) {
    setSelectedItems((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  async function createPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy('create');
    setError('');
    setMessage('');
    try {
      await createProcurementPackage(options, eventId, {
        requirementSetId: selectedSetId,
        name: String(data.get('name')).trim(),
        category: String(data.get('category')).trim(),
        requirementItemIds: selectedItems,
        policy,
      });
      form.reset();
      setSelectedSetId('');
      setSelectedItems([]);
      setPolicy(defaultPolicy);
      setMessage('Procurement package created. No supplier was selected or contacted.');
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create procurement package.',
      );
    } finally {
      setBusy('');
    }
  }

  async function runAction(key: string, work: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Procurement action failed.');
    } finally {
      setBusy('');
    }
  }

  async function analysePackage(procurementPackage: ProcurementPackage) {
    const key = `analyse-${procurementPackage.id}`;
    setBusy(key);
    setError('');
    setMessage('');
    try {
      const analysis = await analyseProcurementPackage(
        options,
        eventId,
        procurementPackage.id,
      );
      setMessage(
        analysis.reasonFewerThanFive
          ? `Marketplace analysis completed. ${analysis.reasonFewerThanFive}`
          : `${analysis.credibleSolutionCount} credible procurement solutions found. Review every alternative before selecting one.`,
      );
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Marketplace analysis failed.',
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Procurement Studio"
        description="Turn approved requirements into transparent sourcing options. AI advises; the planner decides."
        actions={
          <Link href={`/events/${eventId}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">
            Back to Event
          </Link>
        }
      />

      <WorkspaceNextAction {...guidance} />

      <section className="grid gap-3 md:grid-cols-3">
        <Principle title="Visible choice" body="Show at least five credible solutions whenever five exist." />
        <Principle title="Explicit policy" body="Search priorities come from the buyer—not a hidden algorithm." />
        <Principle title="Human authority" body="Analysis and selection create no order, reservation or payment." />
      </section>

      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <form onSubmit={createPackage} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold text-zinc-900">Create a sourcing package</h2>
          <p className="mt-1 text-sm text-zinc-600">Group related approved requirements, then choose the transparent policy AI must follow.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select required value={selectedSetId} onChange={(event) => chooseSet(event.target.value)} className={fieldClass}>
            <option value="" disabled>Select approved Requirement Set</option>
            {approvedSets.map((set) => <option key={set.id} value={set.id}>Requirement Set v{set.version}</option>)}
          </select>
          <input required name="name" placeholder="Package name, e.g. Furniture" className={fieldClass} />
          <input required name="category" placeholder="Category" className={fieldClass} />
        </div>

        {selectedSet ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-zinc-800">Requirements included</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {selectedSet.items.map((item) => (
                <label key={item.id} className="flex gap-3 rounded-lg border border-zinc-200 p-3 text-sm">
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} />
                  <span><span className="font-medium">{item.requirementCode} · {item.name}</span><span className="block text-zinc-600">{item.quantityRequired} {item.unit} · {item.category}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-zinc-800">Buyer policy</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {policyChoices.map((choice) => (
              <label key={choice.key} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(policy[choice.key])}
                  onChange={(event) => setPolicy((current) => ({ ...current, [choice.key]: event.target.checked }))}
                />
                {choice.label}
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-zinc-700">Minimum reliability (%)<input type="number" min="0" max="100" value={policy.minimumReliabilityPercent} onChange={(event) => setPolicy((current) => ({ ...current, minimumReliabilityPercent: Number(event.target.value) }))} className={`${fieldClass} mt-1 w-full`} /></label>
            <label className="text-sm text-zinc-700">Maximum suppliers per package<input type="number" min="1" max="12" value={policy.maximumSuppliersPerPackage} onChange={(event) => setPolicy((current) => ({ ...current, maximumSuppliersPerPackage: Number(event.target.value) }))} className={`${fieldClass} mt-1 w-full`} /></label>
          </div>
        </fieldset>

        {!approvedSets.length ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">Approve a Requirement Set and its Mood Board before procurement can begin.</p> : null}
        <button disabled={!selectedSetId || selectedItems.length === 0 || busy === 'create'} className="mt-5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {busy === 'create' ? 'Creating package…' : 'Create sourcing package'}
        </button>
      </form>

      <section className="grid gap-4">
        <div><h2 className="text-lg font-semibold">Procurement packages</h2><p className="text-sm text-zinc-600">Compare credible delivery strategies before making any supplier commitment.</p></div>
        {packages.map((procurementPackage) => (
          <PackageCard
            key={procurementPackage.id}
            procurementPackage={procurementPackage}
            busy={busy}
            onAnalyse={() => analysePackage(procurementPackage)}
            onSelect={(solution) => runAction(`select-${solution.id}`, () => selectProcurementSolution(options, eventId, procurementPackage.id, solution.id), `${solution.label} selected as the current strategy. No supplier has been contacted.`)}
            onRequest={() => runAction(`request-${procurementPackage.id}`, () => requestProcurementQuotations(options, eventId, procurementPackage.id), 'Commercial Workspace handoff requested. RFQs remain unsent and require operator approval.')}
          />
        ))}
        {!packages.length ? <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">No procurement packages yet.</p> : null}
      </section>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="font-medium text-zinc-900">{title}</p><p className="mt-1 text-sm text-zinc-600">{body}</p></div>;
}

function PackageCard({ procurementPackage, busy, onAnalyse, onSelect, onRequest }: {
  procurementPackage: ProcurementPackage;
  busy: string;
  onAnalyse: () => Promise<void>;
  onSelect: (solution: ProcurementSolution) => Promise<void>;
  onRequest: () => Promise<void>;
}) {
  const selected = procurementPackage.solutions.find((solution) => solution.selectedAt);
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-semibold">{procurementPackage.name}</h3><p className="text-sm text-zinc-600">{procurementPackage.category} · {procurementPackage.items.length} requirements</p></div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{formatLabel(procurementPackage.status)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
        {activePolicies(procurementPackage.policy).map((label) => <span key={label} className="rounded-full border border-zinc-200 px-2 py-1">{label}</span>)}
      </div>
      {procurementPackage.status !== 'QuotationRequested' ? (
        <button onClick={() => void onAnalyse()} disabled={busy === `analyse-${procurementPackage.id}`} className="mt-4 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-40">
          {busy === `analyse-${procurementPackage.id}` ? 'Analysing…' : procurementPackage.solutions.length ? 'Refresh Marketplace analysis' : 'Search Marketplace solutions'}
        </button>
      ) : null}
      {procurementPackage.solutions.length ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {procurementPackage.solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} selected={Boolean(solution.selectedAt)} busy={busy} onSelect={() => onSelect(solution)} locked={procurementPackage.status === 'QuotationRequested'} />
          ))}
        </div>
      ) : null}
      {selected && procurementPackage.status === 'SolutionSelected' ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">{selected.label} is ready for commercial review</p>
          <p className="mt-1 text-sm text-emerald-800">This prepares the M008 handoff only. It does not send an RFQ or create a purchase commitment.</p>
          <button onClick={() => void onRequest()} disabled={busy === `request-${procurementPackage.id}`} className="mt-3 rounded-md bg-emerald-800 px-3 py-2 text-sm text-white disabled:opacity-40">Request quotation workspace</button>
        </div>
      ) : null}
    </article>
  );
}

function SolutionCard({ solution, selected, busy, onSelect, locked }: { solution: ProcurementSolution; selected: boolean; busy: string; onSelect: () => Promise<void>; locked: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${selected ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200'}`}>
      <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{solution.label}</p><p className="text-xs text-zinc-600">{formatLabel(solution.strategy)}</p></div><span className="text-xs font-medium">Rank {solution.rank}</span></div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><Metric label="Estimated total" value={formatMoney(solution.estimatedTotalCost, solution.currency)} /><Metric label="Suppliers" value={String(solution.supplierCount)} /><Metric label="Confidence" value={`${Math.round(solution.confidenceScore)}%`} /><Metric label="Risk" value={`${Math.round(solution.riskScore)}%`} /></dl>
      <p className="mt-3 text-sm text-zinc-700">{solution.explanation}</p>
      <ul className="mt-3 space-y-1 text-xs text-zinc-600">{solution.allocations.map((allocation) => <li key={allocation.id}>{allocation.supplierName} · {allocation.quantity} · {allocation.deliveryCapability}</li>)}</ul>
      {!locked ? <button onClick={() => void onSelect()} disabled={selected || busy === `select-${solution.id}`} className="mt-4 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-white disabled:opacity-40">{selected ? 'Selected strategy' : 'Select this strategy'}</button> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-zinc-500">{label}</dt><dd className="font-medium text-zinc-800">{value}</dd></div>;
}

function formatMoney(value: number | null, currency: string | null) {
  if (value === null) return 'Price pending';
  return `${currency ?? ''} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function activePolicies(policy: ProcurementPolicy) {
  const labels: string[] = [];
  if (policy.minimiseCost) labels.push('Minimise cost');
  if (policy.minimiseSuppliers) labels.push('Fewer suppliers');
  if (policy.preferLocalSuppliers) labels.push('Prefer local');
  if (policy.supportEmergingBusinesses) labels.push('Emerging businesses');
  if (policy.balancedMarketplace) labels.push('Marketplace diversity');
  labels.push(`Reliability ≥ ${policy.minimumReliabilityPercent}%`);
  labels.push(`Maximum ${policy.maximumSuppliersPerPackage} suppliers`);
  return labels;
}

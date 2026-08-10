'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { WorkspaceNextAction } from '../../../../components/events/workspace-next-action';
import { useAppSession } from '../../../../components/app-shell/session-context';
import {
  approveCommercialPurchaseOrderDraft,
  approveCommercialRfq,
  compareCommercialQuotes,
  createCommercialAwards,
  generateCommercialWorkspace,
  listCommercialWorkspaces,
  prepareCommercialPurchaseOrderDrafts,
  reviewCommercialSubstitution,
  sendCommercialRfq,
  submitCommercialQuote,
} from '../../../../lib/commercial-api';
import type {
  CommercialComparison,
  CommercialRfq,
  CommercialWorkspace,
} from '../../../../lib/commercial-types';
import { listProcurementPackages } from '../../../../lib/procurement-api';
import type { ProcurementPackage } from '../../../../lib/procurement-types';
import { commercialGuidance } from '../../../../lib/event-workspace-guidance';
import {
  approveCommercialAgreement,
  generateCommercialAgreement,
  listCommercialAgreements,
  listContractTemplates,
} from '../../../../lib/contracts-api';
import type { CommercialAgreement, ContractTemplate } from '../../../../lib/contracts-types';

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

export default function CommercialWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = useMemo(() => ({ token: session.token, baseUrl: session.baseUrl }), [session.baseUrl, session.token]);
  const [packages, setPackages] = useState<ProcurementPackage[]>([]);
  const [workspaces, setWorkspaces] = useState<CommercialWorkspace[]>([]);
  const [comparisons, setComparisons] = useState<Record<string, CommercialComparison>>({});
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [agreements, setAgreements] = useState<Record<string, CommercialAgreement[]>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token) return;
    try {
      const [packageRows, workspaceRows, templateRows] = await Promise.all([
        listProcurementPackages(options, eventId),
        listCommercialWorkspaces(options, eventId),
        listContractTemplates(options, session.organizationId),
      ]);
      const agreementRows = await Promise.all(workspaceRows.map(async (workspace) => [workspace.id, await listCommercialAgreements(options, eventId, workspace.id)] as const));
      setPackages(packageRows);
      setWorkspaces(workspaceRows);
      setContractTemplates(templateRows);
      setAgreements(Object.fromEntries(agreementRows));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Commercial Workspace.');
    }
  }, [eventId, options, session.organizationId, session.token]);

  useEffect(() => {
    // Load the commercial conversations for this event.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function action(key: string, work: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Commercial action failed.');
    } finally {
      setBusy('');
    }
  }

  async function compare(workspaceId: string) {
    setBusy(`compare-${workspaceId}`);
    setError('');
    try {
      const comparison = await compareCommercialQuotes(options, eventId, workspaceId);
      setComparisons((current) => ({ ...current, [workspaceId]: comparison }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Quote comparison failed.');
    } finally {
      setBusy('');
    }
  }

  const usedPackageIds = new Set(workspaces.map((workspace) => workspace.procurementPackageId));
  const readyPackages = packages.filter((row) => row.status === 'QuotationRequested' && !usedPackageIds.has(row.id));
  const guidance = commercialGuidance(workspaces, readyPackages.length);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Commercial Workspace"
        description="Manage RFQs, supplier responses, comparison, award and purchase-order preparation in one governed conversation."
        actions={<Link href={`/events/${eventId}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Back to Event</Link>}
      />
      <WorkspaceNextAction {...guidance} />
      <section className="grid gap-3 md:grid-cols-3">
        <Guardrail title="AI prepares" body="Drafts, comparisons and recommendations remain reviewable." />
        <Guardrail title="Humans approve" body="Approval and sending are separate, explicit actions." />
        <Guardrail title="One conversation" body="RFQs, quotes, changes, awards and PO drafts stay linked." />
      </section>
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Start from an approved procurement strategy</h2>
        <p className="mt-1 text-sm text-zinc-600">RFQs are generated per selected supplier as drafts. Nothing is sent during generation.</p>
        <div className="mt-4 grid gap-3">
          {readyPackages.map((procurementPackage) => (
            <GenerateWorkspaceForm key={procurementPackage.id} procurementPackage={procurementPackage} busy={busy} onGenerate={(deadline, notes) => action(`generate-${procurementPackage.id}`, () => generateCommercialWorkspace(options, eventId, procurementPackage.id, { submissionDeadline: deadline, specialNotes: notes || undefined }), 'Structured RFQ drafts generated. Review and approve each RFQ before sending.')} />
          ))}
          {!readyPackages.length ? <p className="text-sm text-zinc-600">No new procurement packages are awaiting a Commercial Workspace. Select a Procurement Solution and request its quotation handoff first.</p> : null}
        </div>
      </section>

      <section className="grid gap-5">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            comparison={comparisons[workspace.id]}
            contractTemplates={contractTemplates}
            agreements={agreements[workspace.id] ?? []}
            busy={busy}
            onApproveRfq={(rfqId) => action(`approve-rfq-${rfqId}`, () => approveCommercialRfq(options, eventId, workspace.id, rfqId), 'RFQ approved. It has not been sent.')}
            onSendRfq={(rfqId) => action(`send-rfq-${rfqId}`, () => sendCommercialRfq(options, eventId, workspace.id, rfqId), 'Approved RFQ delivered to the supplier workspace.')}
            onSubmitQuote={(rfq, input) => action(`quote-${rfq.id}`, () => submitCommercialQuote(options, eventId, workspace.id, rfq.id, input), 'Immutable supplier quote revision recorded.')}
            onCompare={() => compare(workspace.id)}
            onReviewSubstitution={(impactId, status) => action(`substitution-${impactId}`, () => reviewCommercialSubstitution(options, eventId, workspace.id, impactId, status), `Substitution ${status.toLowerCase()}. Downstream effects remain traceable.`)}
            onAward={(quoteLineId, quantity) => action(`award-${quoteLineId}`, () => createCommercialAwards(options, eventId, workspace.id, [{ quoteLineId, quantity }]), 'Commercial award recorded. No purchase order was sent.')}
            onPreparePo={() => action(`prepare-po-${workspace.id}`, () => prepareCommercialPurchaseOrderDrafts(options, eventId, workspace.id), 'Purchase-order drafts prepared from approved awards. Nothing was sent.')}
            onApprovePo={(draftId) => action(`approve-po-${draftId}`, () => approveCommercialPurchaseOrderDraft(options, eventId, workspace.id, draftId), 'Purchase-order draft approved. Supplier delivery remains a separate controlled action.')}
            onGenerateAgreement={(templateId, supplierId, title) => action(`generate-agreement-${workspace.id}`, () => generateCommercialAgreement(options, eventId, workspace.id, { templateId, supplierId, title: title || undefined }), 'Agreement draft generated from approved records. It has not been sent or signed.')}
            onApproveAgreement={(agreementId) => action(`approve-agreement-${agreementId}`, () => approveCommercialAgreement(options, eventId, workspace.id, agreementId), 'Agreement wording approved. Sending and signing remain separate controlled actions.')}
          />
        ))}
        {!workspaces.length ? <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">No commercial conversations yet.</p> : null}
      </section>
    </div>
  );
}

function Guardrail({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-zinc-600">{body}</p></div>;
}

function GenerateWorkspaceForm({ procurementPackage, busy, onGenerate }: { procurementPackage: ProcurementPackage; busy: string; onGenerate: (deadline: string, notes: string) => Promise<void> }) {
  return <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onGenerate(new Date(String(data.get('deadline'))).toISOString(), String(data.get('notes'))); }} className="grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end"><div><p className="font-medium">{procurementPackage.name}</p><p className="text-xs text-zinc-600">{procurementPackage.solutions.find((solution) => solution.selectedAt)?.supplierCount ?? 0} selected suppliers</p></div><label className="text-xs text-zinc-600">Quote deadline<input required name="deadline" type="datetime-local" className={`${fieldClass} mt-1 w-full`} /></label><label className="text-xs text-zinc-600">Special notes<input name="notes" className={`${fieldClass} mt-1 w-full`} placeholder="Delivery access, setup or commercial notes" /></label><button disabled={busy === `generate-${procurementPackage.id}`} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">Generate RFQ drafts</button></form>;
}

type QuoteInput = Parameters<typeof submitCommercialQuote>[4];

function WorkspaceCard(props: {
  workspace: CommercialWorkspace; comparison?: CommercialComparison; busy: string;
  contractTemplates: ContractTemplate[]; agreements: CommercialAgreement[];
  onApproveRfq: (rfqId: string) => Promise<void>; onSendRfq: (rfqId: string) => Promise<void>;
  onSubmitQuote: (rfq: CommercialRfq, input: QuoteInput) => Promise<void>; onCompare: () => Promise<void>;
  onReviewSubstitution: (impactId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  onAward: (quoteLineId: string, quantity: number) => Promise<void>; onPreparePo: () => Promise<void>; onApprovePo: (draftId: string) => Promise<void>;
  onGenerateAgreement: (templateId: string, supplierId: string, title: string) => Promise<void>;
  onApproveAgreement: (agreementId: string) => Promise<void>;
}) {
  const { workspace, comparison, busy } = props;
  return <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-semibold">{workspace.procurementPackage.name}</h2><p className="text-sm text-zinc-600">Commercial conversation · {workspace.rfqs.length} suppliers · {workspace.quotes.length} quote revisions</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{workspace.status}</span></div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {workspace.rfqs.map((rfq) => <RfqCard key={rfq.id} rfq={rfq} quotes={workspace.quotes.filter((quote) => quote.commercialRfqId === rfq.id)} busy={busy} onApprove={() => props.onApproveRfq(rfq.id)} onSend={() => props.onSendRfq(rfq.id)} onSubmitQuote={(input) => props.onSubmitQuote(rfq, input)} />)}
    </div>
    {workspace.quotes.length ? <div className="mt-5"><button onClick={() => void props.onCompare()} disabled={busy === `compare-${workspace.id}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">Compare current quotes</button>{comparison ? <ComparisonPanel comparison={comparison} awards={workspace.awards.map((award) => award.commercialQuoteLineId)} onReview={props.onReviewSubstitution} onAward={props.onAward} /> : null}</div> : null}
    {workspace.awards.length ? <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-medium text-emerald-900">{workspace.awards.length} awarded line{workspace.awards.length === 1 ? '' : 's'}</p><p className="mt-1 text-sm text-emerald-800">Prepare controlled purchase-order drafts grouped by supplier.</p><button onClick={() => void props.onPreparePo()} className="mt-3 rounded-md bg-emerald-800 px-3 py-2 text-sm text-white">Prepare PO drafts</button></div> : null}
    {workspace.purchaseOrderDrafts.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{workspace.purchaseOrderDrafts.map((draft) => <div key={draft.id} className="rounded-lg border border-zinc-200 p-4"><div className="flex justify-between gap-2"><p className="font-medium">{draft.supplierName}</p><span className="text-xs">{draft.status}</span></div><p className="mt-1 text-sm">{money(draft.totalAmount, draft.currency)} · {draft.lines.length} lines</p>{draft.status === 'Draft' ? <button onClick={() => void props.onApprovePo(draft.id)} className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm">Approve PO draft</button> : null}</div>)}</div> : null}
    <AgreementsPanel {...props} />
  </article>;
}

function AgreementsPanel(props: Pick<Parameters<typeof WorkspaceCard>[0], 'workspace' | 'contractTemplates' | 'agreements' | 'busy' | 'onGenerateAgreement' | 'onApproveAgreement'>) {
  const { workspace, contractTemplates, agreements, busy } = props;
  const awardedLineIds = new Set(workspace.awards.map((award) => award.commercialQuoteLineId));
  const suppliers = Array.from(new Map(workspace.quotes
    .filter((quote) => quote.lines.some((line) => awardedLineIds.has(line.id)))
    .map((quote) => [quote.supplierId, { id: quote.supplierId, name: quote.supplierName }])).values());
  const approvedTemplates = contractTemplates.filter((template) => template.status === 'Approved');

  return <section className="mt-5 rounded-lg border border-zinc-200 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-semibold">Contracts and agreements</h3><p className="mt-1 text-sm text-zinc-600">Generate a private event agreement from an approved company template and the awarded commercial records.</p></div>
      <Link href="/settings/contracts" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Manage templates</Link>
    </div>
    {suppliers.length > 0 && approvedTemplates.length > 0 ? <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void props.onGenerateAgreement(String(data.get('templateId')), String(data.get('supplierId')), String(data.get('title'))); }} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <label className="text-xs text-zinc-600">Approved template<select required name="templateId" className={`${fieldClass} mt-1 w-full`}><option value="">Select template</option>{approvedTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
      <label className="text-xs text-zinc-600">Awarded supplier<select required name="supplierId" className={`${fieldClass} mt-1 w-full`}><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
      <label className="text-xs text-zinc-600">Agreement title<input name="title" className={`${fieldClass} mt-1 w-full`} placeholder="Event supply agreement" /></label>
      <button disabled={busy === `generate-agreement-${workspace.id}`} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">Generate draft</button>
    </form> : <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">{!suppliers.length ? 'Award at least one supplier quote line before generating an agreement.' : 'Approve a company contract template before generating an agreement.'}</p>}
    {agreements.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{agreements.map((agreement) => {
      const latestVersion = agreement.versions.at(-1);
      return <article key={agreement.id} className="rounded-md border border-zinc-200 p-3"><div className="flex justify-between gap-2"><div><p className="font-medium">{agreement.title}</p><p className="text-xs text-zinc-600">{agreement.counterpartyName} - {agreement.template.name}</p></div><span className="text-xs">{splitLabel(agreement.status)}</span></div>{latestVersion ? <details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Preview frozen version {latestVersion.version}</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs">{latestVersion.content}</pre></details> : null}<p className="mt-3 text-xs text-amber-700">Private draft. Not sent and not signed.</p>{agreement.status === 'UnderReview' || agreement.status === 'Draft' ? <button onClick={() => void props.onApproveAgreement(agreement.id)} disabled={busy === `approve-agreement-${agreement.id}`} className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-40">Approve agreement wording</button> : null}</article>;
    })}</div> : null}
  </section>;
}

function RfqCard({ rfq, quotes, busy, onApprove, onSend, onSubmitQuote }: { rfq: CommercialRfq; quotes: CommercialWorkspace['quotes']; busy: string; onApprove: () => Promise<void>; onSend: () => Promise<void>; onSubmitQuote: (input: QuoteInput) => Promise<void> }) {
  return <section className="rounded-lg border border-zinc-200 p-4"><div className="flex justify-between gap-2"><div><h3 className="font-semibold">{rfq.supplierName}</h3><p className="text-xs text-zinc-600">Deadline {new Date(rfq.submissionDeadline).toLocaleString()}</p></div><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{rfq.status}</span></div><ul className="mt-3 space-y-1 text-sm text-zinc-700">{rfq.lines.map((line) => <li key={line.id}>{line.description} · {line.quantity} {line.unit}</li>)}</ul><div className="mt-4 flex flex-wrap gap-2">{rfq.status === 'Draft' ? <button onClick={() => void onApprove()} disabled={busy === `approve-rfq-${rfq.id}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Approve RFQ</button> : null}{rfq.status === 'Approved' ? <button onClick={() => void onSend()} disabled={busy === `send-rfq-${rfq.id}`} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Send approved RFQ</button> : null}</div>{rfq.status === 'Sent' ? <QuoteForm rfq={rfq} onSubmit={onSubmitQuote} /> : null}{quotes.map((quote) => <p key={quote.id} className="mt-3 rounded-md bg-zinc-50 p-2 text-sm">Quote v{quote.version}: {money(quote.totalAmount, quote.currency)} · {quote.status}</p>)}</section>;
}

function QuoteForm({ rfq, onSubmit }: { rfq: CommercialRfq; onSubmit: (input: QuoteInput) => Promise<void> }) {
  return <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const lines = rfq.lines.map((line) => ({ requirementItemId: line.requirementItemId, offeredDescription: String(data.get(`description-${line.id}`)), quantityOffered: Number(data.get(`quantity-${line.id}`)), unitPrice: Number(data.get(`price-${line.id}`)), isSubstitution: data.get(`substitution-${line.id}`) === 'on' })); void onSubmit({ currency: String(data.get('currency')), deliveryFee: Number(data.get('deliveryFee')), taxAmount: Number(data.get('taxAmount')), paymentTerms: String(data.get('paymentTerms')) || undefined, lines }).then(() => form.reset()); }} className="mt-4 rounded-md bg-zinc-50 p-3"><p className="text-sm font-medium">Record supplier quote revision</p><div className="mt-2 grid gap-2">{rfq.lines.map((line) => <div key={line.id} className="grid gap-2 rounded border border-zinc-200 bg-white p-2 sm:grid-cols-3"><input required name={`description-${line.id}`} defaultValue={line.description} aria-label={`${line.description} offered description`} className={fieldClass} /><input required type="number" min="0" step="any" name={`quantity-${line.id}`} defaultValue={line.quantity} aria-label={`${line.description} quantity`} className={fieldClass} /><input required type="number" min="0" step="any" name={`price-${line.id}`} placeholder="Unit price" aria-label={`${line.description} unit price`} className={fieldClass} /><label className="text-xs"><input type="checkbox" name={`substitution-${line.id}`} /> Substitution</label></div>)}</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input required name="currency" defaultValue="ZAR" aria-label="Currency" className={fieldClass} /><input type="number" min="0" step="any" name="deliveryFee" defaultValue="0" aria-label="Delivery fee" className={fieldClass} /><input type="number" min="0" step="any" name="taxAmount" defaultValue="0" aria-label="Tax amount" className={fieldClass} /><input name="paymentTerms" placeholder="Payment terms" className={fieldClass} /></div><button className="mt-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">Record quote revision</button></form>;
}

function ComparisonPanel({ comparison, awards, onReview, onAward }: { comparison: CommercialComparison; awards: string[]; onReview: (impactId: string, status: 'Approved' | 'Rejected') => Promise<void>; onAward: (quoteLineId: string, quantity: number) => Promise<void> }) {
  return <div className="mt-4 space-y-4"><div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">AI recommendations explain trade-offs. The planner must choose every award.</div>{comparison.recommendations.map((recommendation) => <p key={recommendation.strategy} className="text-sm"><strong>{splitLabel(recommendation.strategy)}:</strong> {recommendation.explanation}</p>)}{comparison.rows.map((row) => <div key={row.requirementItemId} className="overflow-x-auto rounded-lg border border-zinc-200"><table className="w-full text-left text-sm"><thead className="bg-zinc-50"><tr><th className="p-3">Supplier</th><th className="p-3">Offer</th><th className="p-3">Quantity</th><th className="p-3">Line total</th><th className="p-3">Decision</th></tr></thead><tbody>{row.alternatives.map((alternative) => { const pending = alternative.substitutionImpact?.status === 'PendingReview'; return <tr key={alternative.quoteLineId} className="border-t border-zinc-200"><td className="p-3">{alternative.supplierName}{alternative.quoteLineId === row.lowestCostQuoteLineId ? <span className="ml-1 text-xs text-emerald-700">Lowest cost</span> : null}</td><td className="p-3">{alternative.offeredDescription}{alternative.substitutionImpact ? <span className="block text-xs text-amber-700">Substitution · {alternative.substitutionImpact.status}</span> : null}</td><td className="p-3">{alternative.quantityOffered}</td><td className="p-3">{alternative.lineTotal.toLocaleString()}</td><td className="p-3">{pending ? <div className="flex gap-1"><button onClick={() => void onReview(alternative.substitutionImpact!.id, 'Approved')} className="rounded border px-2 py-1 text-xs">Approve change</button><button onClick={() => void onReview(alternative.substitutionImpact!.id, 'Rejected')} className="rounded border px-2 py-1 text-xs">Reject</button></div> : <button onClick={() => void onAward(alternative.quoteLineId, alternative.quantityOffered)} disabled={awards.includes(alternative.quoteLineId) || alternative.substitutionImpact?.status === 'Rejected'} className="rounded border px-2 py-1 text-xs disabled:opacity-40">{awards.includes(alternative.quoteLineId) ? 'Awarded' : 'Award line'}</button>}</td></tr>; })}</tbody></table></div>)}</div>;
}

function money(value: number, currency: string) { return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function splitLabel(value: string) { return value.replace(/([a-z])([A-Z])/g, '$1 $2'); }

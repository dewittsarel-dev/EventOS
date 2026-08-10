'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import { approveContractTemplate, createContractTemplate, listContractTemplates } from '../../../lib/contracts-api';
import type { ContractTemplate, ContractTemplateSourceType } from '../../../lib/contracts-types';

const fieldClass = 'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm';
const starter = `AGREEMENT BETWEEN {{party_a_legal_name}} AND {{party_b_name}}

Event: {{event_title}}
Date: {{event_date}}
Venue: {{event_venue}}

Scope
{{scope}}

Contract total: {{contract_total}}
Payment terms: {{payment_terms}}

The parties agree to the approved scope and terms recorded above.`;

export default function ContractTemplatesPage() {
  const { session } = useAppSession();
  const options = useMemo(() => ({ token: session.token, baseUrl: session.baseUrl }), [session.baseUrl, session.token]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token || !session.organizationId) return;
    try { setTemplates(await listContractTemplates(options, session.organizationId)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Failed to load contract templates.'); }
  }, [options, session.organizationId, session.token]);

  useEffect(() => {
    if (!session.token || !session.organizationId) return;
    let active = true;
    listContractTemplates(options, session.organizationId)
      .then((result) => { if (active) setTemplates(result); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Failed to load contract templates.');
      });
    return () => { active = false; };
  }, [options, session.organizationId, session.token]);

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const sourceType = String(data.get('sourceType')) as ContractTemplateSourceType;
    const importedFile = data.get('contractFile');
    const file = importedFile instanceof File && importedFile.size > 0 ? importedFile : null;
    let content = String(data.get('content'));
    if (file && (file.type === 'text/plain' || /\.(txt|md)$/i.test(file.name)) && content.trim() === starter.trim()) {
      content = await file.text();
    }
    setBusy('create'); setError(''); setMessage('');
    try {
      await createContractTemplate(options, session.organizationId, {
        name: String(data.get('name')),
        description: String(data.get('description')) || undefined,
        sourceType,
        importedFileName: sourceType === 'Imported' ? (file?.name || String(data.get('importedFileName'))) : undefined,
        importedFileReference: sourceType === 'Imported' ? (file ? `clientos-private-upload:${file.name}` : String(data.get('importedFileReference'))) : undefined,
        content,
      });
      form.reset(); setMessage('Private contract template saved as a draft. Legal approval is still required.'); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Template creation failed.'); }
    finally { setBusy(''); }
  }

  async function approve(templateId: string) {
    setBusy(templateId); setError(''); setMessage('');
    try { await approveContractTemplate(options, session.organizationId, templateId); setMessage('Template wording approved for agreement preparation.'); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Approval failed.'); }
    finally { setBusy(''); }
  }

  return <div className="flex flex-col gap-5">
    <PageHeader title="Contract templates" description="Keep your company wording private, controlled and ready for event-specific agreements." />
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Human legal review is required.</strong> EventOS can merge approved commercial facts into your wording, but it does not provide legal advice, approve contracts or sign on anyone&apos;s behalf.</div>
    {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Add your company contract</h2>
      <p className="mt-1 text-sm text-zinc-600">Design wording here or register a privately stored imported original. Placeholders are filled only when an event agreement is prepared.</p>
      <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Template name<input name="name" required minLength={2} className={`${fieldClass} mt-1`} /></label><label className="text-sm">Source<select name="sourceType" className={`${fieldClass} mt-1`}><option value="Designed">Design in ClientOS</option><option value="Imported">Imported private contract</option></select></label></div>
        <label className="text-sm">Purpose or notes<input name="description" className={`${fieldClass} mt-1`} placeholder="Standard supplier hire agreement" /></label>
        <label className="text-sm">Import a private contract file<input name="contractFile" type="file" accept=".doc,.docx,.pdf,.txt,.md" className={`${fieldClass} mt-1`} /><span className="mt-1 block text-xs text-zinc-500">The original remains private. Text files can populate the editor; Word and PDF files are registered as controlled sources for later document-storage integration.</span></label>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Imported file name (only for imported contracts)<input name="importedFileName" className={`${fieldClass} mt-1`} placeholder="supplier-hire-agreement.docx" /></label><label className="text-sm">Private document reference<input name="importedFileReference" className={`${fieldClass} mt-1`} placeholder="Private ClientOS document reference" /></label></div>
        <label className="text-sm">Contract wording<textarea name="content" required minLength={20} rows={14} defaultValue={starter} className={`${fieldClass} mt-1 font-mono`} /></label>
        <p className="text-xs text-zinc-500">Supported examples: {'{{party_a_legal_name}}'}, {'{{party_b_name}}'}, {'{{event_title}}'}, {'{{event_date}}'}, {'{{event_venue}}'}, {'{{scope}}'}, {'{{contract_total}}'} and {'{{payment_terms}}'}.</p>
        <button disabled={busy === 'create'} className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40">Save private draft</button>
      </form>
    </section>
    <section className="grid gap-4 md:grid-cols-2">
      {templates.map((template) => <article key={template.id} className="rounded-xl border border-zinc-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{template.name}</h2><p className="text-xs text-zinc-500">{template.sourceType} · {template.mergeFields.length} merge fields</p></div><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{template.status}</span></div><p className="mt-3 text-sm text-zinc-600">{template.description || 'No description supplied.'}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Preview controlled wording</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs">{template.content}</pre></details>{template.status === 'Draft' ? <button onClick={() => void approve(template.id)} disabled={busy === template.id} className="mt-4 rounded-md border border-zinc-300 px-3 py-2 text-sm">Approve legal wording</button> : null}</article>)}
      {!templates.length ? <p className="text-sm text-zinc-600">No contract templates yet.</p> : null}
    </section>
  </div>;
}

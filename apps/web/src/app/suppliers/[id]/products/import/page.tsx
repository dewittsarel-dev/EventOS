'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  createSupplierProduct,
  publishSupplierProduct,
  submitSupplierProductForReview,
} from '@/lib/supplier-products-api';
import {
  candidateToPayload,
  type CatalogueImportCandidate,
} from '@/lib/supplier-catalogue-import';
import { extractSupplierCatalogue } from '@/lib/supplier-catalogue-extraction';
import {
  SUPPLIER_PRODUCT_CATEGORIES,
  type SupplierProductAvailability,
} from '@/lib/supplier-products-types';

type SourceFile = {
  id: string;
  name: string;
  kind: string;
  status: string;
  previewUrl?: string;
};

function candidateIssues(candidate: CatalogueImportCandidate) {
  const issues = [...candidate.issues];
  if (!candidate.productName.trim()) issues.push('Product name requires review.');
  if (candidate.costPrice < 0) issues.push('Cost price cannot be negative.');
  if (candidate.totalQuantity === undefined || candidate.totalQuantity < 0) {
    issues.push('Quantity requires confirmation.');
  }
  return [...new Set(issues)];
}

export default function SupplierCatalogueImportPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params.id);
  const { session } = useAppSession();
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [candidates, setCandidates] = useState<CatalogueImportCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const readyCount = useMemo(
    () => candidates.filter((item) => item.selected && candidateIssues(item).length === 0).length,
    [candidates],
  );

  function updateCandidate(id: string, patch: Partial<CatalogueImportCandidate>) {
    setCandidates((current) => current.map((item) => {
      if (item.id !== id) return item;
      let issues = item.issues;
      if (patch.productName !== undefined) {
        issues = issues.filter((issue) => issue !== 'Product name requires review.');
      }
      if (patch.costPrice !== undefined) {
        issues = issues.filter((issue) => issue !== 'Cost price requires confirmation.');
      }
      if (patch.totalQuantity !== undefined) {
        issues = issues.filter((issue) => issue !== 'Quantity requires confirmation.');
      }
      return { ...item, ...patch, issues };
    }));
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setError('');
    setMessage('');
    setBusy(true);

    try {
      for (const file of Array.from(files)) {
        const id = `${file.name}-${file.lastModified}-${file.size}`;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        setSources((current) => [...current, {
          id,
          name: file.name,
          kind: 'Catalogue source',
          status: file.type.startsWith('image/') ? 'Reading visible text with OCR…' : 'Extracting private catalogue data…',
          previewUrl,
        }]);
        try {
          const result = await extractSupplierCatalogue(file);
          setCandidates((current) => [...current, ...result.candidates]);
          setSources((current) => current.map((source) => source.id === id
            ? { ...source, kind: result.kind, status: result.status }
            : source));
        } catch (extractionError) {
          setSources((current) => current.map((source) => source.id === id
            ? { ...source, status: `Extraction needs manual review: ${extractionError instanceof Error ? extractionError.message : 'Unknown extraction error'}` }
            : source));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveBatch(publish: boolean) {
    if (!session.token || !session.organizationId) {
      setError('Select an organization and sign in before importing products.');
      return;
    }
    const approved = candidates.filter((item) => item.selected && candidateIssues(item).length === 0);
    if (!approved.length) {
      setError('Select at least one fully reviewed product.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    let completed = 0;
    try {
      const options = { token: session.token, baseUrl: session.baseUrl };
      for (const candidate of approved) {
        const product = await createSupplierProduct(
          options,
          supplierId,
          candidateToPayload(candidate, session.organizationId),
        );
        if (publish) {
          await submitSupplierProductForReview(options, supplierId, product.id, session.organizationId);
          await publishSupplierProduct(options, supplierId, product.id, session.organizationId);
        }
        completed += 1;
      }
      setCandidates((current) => current.filter((item) => !approved.some((done) => done.id === item.id)));
      setMessage(`${completed} products ${publish ? 'approved and published' : 'saved as private drafts'}.`);
    } catch (requestError) {
      setError(`${completed} products completed before an error: ${requestError instanceof Error ? requestError.message : 'Import failed.'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Import Supplier Catalogue"
        description="Upload existing catalogues, review EventOS suggestions, then approve products in batches."
        actions={<Link href={`/suppliers/${supplierId}/products`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Back to Products</Link>}
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">1. Upload existing supplier material</h2>
        <p className="mt-1 text-sm text-zinc-600">CSV and Excel rows, PDF text, and visible text in product images are extracted locally into a private review queue. Nothing is published automatically.</p>
        <input disabled={busy} className="mt-4 block w-full rounded-md border border-dashed border-zinc-300 p-4 text-sm disabled:opacity-50" type="file" multiple accept=".csv,.pdf,.xlsx,.xls,image/*" onChange={(event) => void onFiles(event.target.files)} />
        {busy ? <p className="mt-2 text-sm text-amber-700">Extracting catalogue information. OCR may take a little longer for large images.</p> : null}
        {sources.length ? <div className="mt-4 grid gap-3 md:grid-cols-3">{sources.map((source) => (
          <div key={source.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
            {source.previewUrl ? <Image src={source.previewUrl} alt="Private import preview" width={320} height={112} unoptimized className="mb-2 h-28 w-full rounded object-cover" /> : null}
            <p className="font-medium">{source.name}</p><p className="text-zinc-500">{source.kind}</p><p className="mt-1 text-xs text-amber-700">{source.status}</p>
          </div>
        ))}</div> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">2. Import review queue</h2><p className="text-sm text-zinc-600">Correct exceptions and confirm stock, availability and fulfilment before approval.</p></div>
          <p className="text-sm font-medium">{readyCount} ready for approval</p>
        </div>
        {!candidates.length ? <p className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">Upload a CSV, Excel, PDF, or product image to populate the review queue.</p> : (
          <div className="mt-4 overflow-x-auto"><table className="min-w-[1200px] text-sm"><thead><tr className="border-b text-left text-zinc-500">
            <th className="p-2">Approve</th><th className="p-2">Product</th><th className="p-2">Category</th><th className="p-2">Colour</th><th className="p-2">Dimensions</th><th className="p-2">Cost</th><th className="p-2">Qty</th><th className="p-2">Availability</th><th className="p-2">Delivery</th><th className="p-2">Review</th>
          </tr></thead><tbody>{candidates.map((item) => {
            const issues = candidateIssues(item);
            return <tr key={item.id} className="border-b align-top">
              <td className="p-2"><input type="checkbox" checked={item.selected} onChange={(event) => updateCandidate(item.id, { selected: event.target.checked })} /></td>
              <td className="p-2"><input className="w-52 rounded border p-2" value={item.productName} onChange={(event) => updateCandidate(item.id, { productName: event.target.value })} /><p className="mt-1 text-xs text-zinc-400">Row {item.sourceRow}</p></td>
              <td className="p-2"><select className="rounded border p-2" value={item.category} onChange={(event) => updateCandidate(item.id, { category: event.target.value as CatalogueImportCandidate['category'] })}>{SUPPLIER_PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></td>
              <td className="p-2"><input className="w-28 rounded border p-2" value={item.colour} onChange={(event) => updateCandidate(item.id, { colour: event.target.value })} /></td>
              <td className="p-2"><input className="w-32 rounded border p-2" value={item.dimensions} onChange={(event) => updateCandidate(item.id, { dimensions: event.target.value })} /></td>
              <td className="p-2"><input type="number" min="0" step="0.01" className="w-24 rounded border p-2" value={item.costPrice} onChange={(event) => updateCandidate(item.id, { costPrice: Number(event.target.value) })} /></td>
              <td className="p-2"><input type="number" min="0" className="w-20 rounded border p-2" value={item.totalQuantity ?? ''} onChange={(event) => updateCandidate(item.id, { totalQuantity: event.target.value === '' ? undefined : Number(event.target.value) })} /></td>
              <td className="p-2"><select className="rounded border p-2" value={item.availability} onChange={(event) => updateCandidate(item.id, { availability: event.target.value as SupplierProductAvailability })}><option>Available</option><option>Limited</option><option>Unavailable</option><option>MadeToOrder</option></select></td>
              <td className="p-2"><label className="block"><input type="checkbox" checked={item.deliveryAvailable} onChange={(event) => updateCandidate(item.id, { deliveryAvailable: event.target.checked })} /> Delivery</label><label className="mt-2 block"><input type="checkbox" checked={item.pickupAvailable} onChange={(event) => updateCandidate(item.id, { pickupAvailable: event.target.checked })} /> Pickup</label></td>
              <td className="p-2 text-xs">{issues.length ? issues.map((issue) => <p key={issue} className="text-amber-700">{issue}</p>) : <span className="text-emerald-700">Ready</span>}<p className="mt-1 max-w-48 text-zinc-400">Search: {item.searchTerms.join(', ')}</p></td>
            </tr>;
          })}</tbody></table></div>
        )}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <div className="flex flex-wrap justify-end gap-3">
        <button disabled={busy || !readyCount} onClick={() => void saveBatch(false)} className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40">Save approved drafts</button>
        <button disabled={busy || !readyCount} onClick={() => void saveBatch(true)} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40">Approve and publish batch</button>
      </div>
      <p className="text-xs text-zinc-500">Future products continue through the guided product form. Imported products follow the same private draft, review and Marketplace publication boundary.</p>
    </div>
  );
}

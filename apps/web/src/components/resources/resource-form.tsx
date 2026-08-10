'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ResourcePayload, ResourceRecord } from '@/lib/resource-api';
import { buildResourceSuggestions, COLOURS, inferResourceDefaults, MATERIALS, RESOURCE_CATALOGUE, STYLES, type CatalogueCategory } from '@/lib/resource-catalogue';

const field = 'rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm';
const section = 'grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2';

export function ResourceForm({ initial, busy, submitLabel, onSubmit }: {
  initial?: ResourceRecord;
  busy: boolean;
  submitLabel: string;
  onSubmit: (payload: Omit<ResourcePayload, 'organizationId'>) => Promise<void>;
}) {
  const initialCategory = (Object.keys(RESOURCE_CATALOGUE).includes(initial?.category ?? '') ? initial?.category : 'Furniture & seating') as CatalogueCategory;
  const [category, setCategory] = useState<CatalogueCategory>(initialCategory);
  const [subcategory, setSubcategory] = useState(initial?.tags.find((tag) => tag.startsWith('subcategory:'))?.slice(12) ?? RESOURCE_CATALOGUE[initialCategory][0]);
  const [name, setName] = useState(initial?.name ?? '');
  const [colour, setColour] = useState(initial?.tags.find((tag) => tag.startsWith('colour:'))?.slice(7) ?? '');
  const [material, setMaterial] = useState(initial?.tags.find((tag) => tag.startsWith('material:'))?.slice(9) ?? '');
  const [style, setStyle] = useState(initial?.tags.find((tag) => tag.startsWith('style:'))?.slice(6) ?? '');
  const [delivery, setDelivery] = useState(initial?.tags.find((tag) => tag.startsWith('delivery:'))?.slice(9) ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [publish, setPublish] = useState(initial?.visibility === 'MARKETPLACE');
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const existingPhotoCount = initial?.imageUrls.length ?? 0;
  const suggestions = useMemo(() => buildResourceSuggestions({ name, category, subcategory, colour, material, style, delivery }), [name, category, subcategory, colour, material, style, delivery]);

  function changeCategory(next: CatalogueCategory) {
    setCategory(next);
    setSubcategory(RESOURCE_CATALOGUE[next][0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const imageUrls = String(data.get('imageUrls')).split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const defaults = inferResourceDefaults(category);
    const tags = [`subcategory:${subcategory}`, colour && `colour:${colour}`, material && `material:${material}`, style && `style:${style}`, delivery && `delivery:${delivery}`].filter(Boolean) as string[];
    await onSubmit({
      name: name.trim(),
      description: description.trim() || suggestions.description || undefined,
      category,
      tags,
      keywords: suggestions.keywords,
      aiSummary: suggestions.description || undefined,
      searchPhrases: suggestions.searchPhrases,
      imageUrls,
      resourceType: defaults.resourceType,
      quantityMode: defaults.quantityMode,
      sku: String(data.get('sku')).trim() || undefined,
      visibility: publish ? 'MARKETPLACE' : 'PRIVATE',
      unit: String(data.get('unit')).trim() || defaults.unit,
      totalQuantity: data.get('totalQuantity') ? Number(data.get('totalQuantity')) : undefined,
      condition: String(data.get('condition')) as ResourceRecord['condition'],
      rentalPrice: data.get('rentalPrice') ? Number(data.get('rentalPrice')) : undefined,
    });
  }

  return <form onSubmit={(event) => void submit(event)} className="grid gap-5">
    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 1</p><h2 className="text-lg font-semibold">Add photos</h2><p className="text-sm text-zinc-600">Choose up to five clear photos. On a phone this also opens the camera. You may save a private draft without photos and add them later.</p></div>
      <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center md:col-span-2">
        <div><p className="font-medium text-zinc-800">{existingPhotoCount ? `${existingPhotoCount} hosted photo${existingPhotoCount === 1 ? '' : 's'} attached` : photoNames.length ? `${photoNames.length} local photo${photoNames.length === 1 ? '' : 's'} selected` : 'No product photo yet'}</p><p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">{existingPhotoCount ? 'These photos will be used on the Marketplace listing.' : 'ClientOS and Marketplace will show a neutral placeholder until a hosted or production-uploaded image is attached.'}</p></div>
      </div>
      <label className="grid gap-2 text-sm md:col-span-2">Choose photos<input type="file" accept="image/*" multiple className={field} onChange={(event) => setPhotoNames(Array.from(event.target.files ?? []).slice(0, 5).map((file) => file.name))} /><span className="text-xs text-zinc-500">{photoNames.length ? `${photoNames.length} selected for preview: ${photoNames.join(', ')}. These files are not uploaded yet; use hosted links below for the current test.` : 'Direct production photo storage is the next integration. Use hosted links below for the current test.'}</span></label>
      <details className="md:col-span-2"><summary className="cursor-pointer text-sm font-medium">Use hosted image links (testing/advanced)</summary><label className="mt-3 grid gap-1 text-sm">One URL per line<textarea name="imageUrls" defaultValue={initial?.imageUrls.join('\n')} placeholder="https://…" className={`${field} min-h-24`} /></label></details>
    </section>

    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 2</p><h2 className="text-lg font-semibold">Name and classify the item</h2></div>
      <label className="grid gap-1 text-sm">Simple product name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Gold Tiffany Chair" className={field} /></label>
      <label className="grid gap-1 text-sm">Category<select value={category} onChange={(event) => changeCategory(event.target.value as CatalogueCategory)} className={field}>{Object.keys(RESOURCE_CATALOGUE).map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Subcategory<select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className={field}>{RESOURCE_CATALOGUE[category].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Internal SKU (optional)<input name="sku" defaultValue={initial?.sku ?? ''} className={field} /></label>
    </section>

    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 3</p><h2 className="text-lg font-semibold">Describe it with simple attributes</h2></div>
      {[['Colour', colour, setColour, COLOURS], ['Material', material, setMaterial, MATERIALS], ['Style', style, setStyle, STYLES]].map(([label, value, setter, values]) => <label key={label as string} className="grid gap-1 text-sm">{label as string}<select value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className={field}><option value="">Select</option>{(values as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}
      <label className="grid gap-1 text-sm">Condition<select name="condition" defaultValue={initial?.condition ?? 'GOOD'} className={field}><option value="EXCELLENT">Excellent</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="DAMAGED">Damaged</option></select></label>
    </section>

    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 4</p><h2 className="text-lg font-semibold">Stock, price and delivery</h2></div>
      <label className="grid gap-1 text-sm">Quantity available<input min="0" step="1" type="number" name="totalQuantity" defaultValue={initial?.totalQuantity ?? ''} className={field} /></label>
      <label className="grid gap-1 text-sm">Price (ZAR)<input min="0" step="0.01" type="number" name="rentalPrice" defaultValue={initial?.rentalPrice ?? ''} className={field} /></label>
      <label className="grid gap-1 text-sm">Charged per<input name="unit" defaultValue={initial?.unit ?? inferResourceDefaults(category).unit} className={field} /></label>
      <label className="grid gap-1 text-sm">Delivery or collection<select value={delivery} onChange={(event) => setDelivery(event.target.value)} className={field}><option value="">Select</option><option>Supplier delivery</option><option>Customer collection</option><option>Delivery or collection</option><option>Quote required</option></select></label>
    </section>

    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 5</p><h2 className="text-lg font-semibold">Review Marketplace wording</h2><p className="text-sm text-zinc-600">ClientOS creates search terms automatically; the supplier can edit the customer description.</p></div>
      <label className="grid gap-1 text-sm md:col-span-2">Suggested description<textarea value={description} placeholder={suggestions.description || 'Enter a product name and attributes to generate a suggestion.'} onChange={(event) => setDescription(event.target.value)} className={`${field} min-h-28`} /></label>
      <div className="rounded-lg bg-zinc-50 p-3 text-sm md:col-span-2"><strong>Suggested search terms:</strong> {suggestions.keywords.join(', ') || 'Enter a product name and attributes.'}</div>
    </section>

    <section className={section}>
      <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Step 6</p><h2 className="text-lg font-semibold">Save privately or publish</h2><p className="mt-1 text-sm text-zinc-600">Current choice: <strong>{publish ? 'Marketplace listing' : 'Private ClientOS draft'}</strong>. You can change this later.</p></div>
      <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 text-sm md:col-span-2"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} className="mt-1" /><span><strong>Publish this item to Marketplace</strong><br /><span className="text-zinc-600">Leave this off to keep it private in ClientOS. Publishing is always an explicit supplier action.</span></span></label>
      {publish && !existingPhotoCount && photoNames.length === 0 ? <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 md:col-span-2">This listing can be published now with a neutral placeholder. Add the real product photographs when they are ready.</p> : null}
      <div className="md:col-span-2"><button disabled={busy} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Saving…' : publish ? 'Save and publish' : submitLabel}</button></div>
    </section>
  </form>;
}

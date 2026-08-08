'use client';

import { FormEvent } from 'react';
import type { ResourcePayload, ResourceRecord } from '@/lib/resource-api';

const field = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

export function ResourceForm({ initial, busy, submitLabel, onSubmit }: {
  initial?: ResourceRecord;
  busy: boolean;
  submitLabel: string;
  onSubmit: (payload: Omit<ResourcePayload, 'organizationId'>) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const imageUrls = String(data.get('imageUrls')).split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const tags = String(data.get('tags')).split(',').map((value) => value.trim()).filter(Boolean);
    await onSubmit({
      name: String(data.get('name')).trim(),
      description: String(data.get('description')).trim() || undefined,
      category: String(data.get('category')).trim(),
      tags,
      imageUrls,
      resourceType: String(data.get('resourceType')) as ResourceRecord['resourceType'],
      quantityMode: String(data.get('quantityMode')) as ResourceRecord['quantityMode'],
      sku: String(data.get('sku')).trim() || undefined,
      visibility: String(data.get('visibility')) as ResourceRecord['visibility'],
      unit: String(data.get('unit')).trim(),
      totalQuantity: data.get('totalQuantity') ? Number(data.get('totalQuantity')) : undefined,
      rentalPrice: data.get('rentalPrice') ? Number(data.get('rentalPrice')) : undefined,
    });
  }

  return <form onSubmit={(event) => void submit(event)} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
    <label className="grid gap-1 text-sm">Resource name<input required name="name" defaultValue={initial?.name} className={field} /></label>
    <label className="grid gap-1 text-sm">Category<input required name="category" defaultValue={initial?.category} className={field} /></label>
    <label className="grid gap-1 text-sm md:col-span-2">Customer-facing description<textarea name="description" defaultValue={initial?.description ?? ''} className={`${field} min-h-24`} /></label>
    <label className="grid gap-1 text-sm">Resource type<select name="resourceType" defaultValue={initial?.resourceType ?? 'ASSET'} className={field}><option>ASSET</option><option>BULK_ITEM</option><option>CONSUMABLE</option><option>SERVICE</option><option>STAFF</option><option>VEHICLE</option><option>VENUE</option></select></label>
    <label className="grid gap-1 text-sm">Quantity mode<select name="quantityMode" defaultValue={initial?.quantityMode ?? 'QUANTITY'} className={field}><option>SERIALIZED</option><option>QUANTITY</option><option>CAPACITY</option><option>UNLIMITED</option></select></label>
    <label className="grid gap-1 text-sm">SKU<input name="sku" defaultValue={initial?.sku ?? ''} className={field} /></label>
    <label className="grid gap-1 text-sm">Unit<input required name="unit" defaultValue={initial?.unit ?? 'Each'} className={field} /></label>
    <label className="grid gap-1 text-sm">Total quantity<input min="0" step="any" type="number" name="totalQuantity" defaultValue={initial?.totalQuantity ?? ''} className={field} /></label>
    <label className="grid gap-1 text-sm">Rental price (ZAR)<input min="0" step="0.01" type="number" name="rentalPrice" defaultValue={initial?.rentalPrice ?? ''} className={field} /></label>
    <label className="grid gap-1 text-sm">Visibility<select name="visibility" defaultValue={initial?.visibility ?? 'PRIVATE'} className={field}><option value="PRIVATE">Private</option><option value="MARKETPLACE">Published to Marketplace</option><option value="HIDDEN">Hidden</option></select></label>
    <label className="grid gap-1 text-sm">Search tags<input name="tags" defaultValue={initial?.tags.join(', ')} placeholder="wedding, gold, seating" className={field} /></label>
    <label className="grid gap-1 text-sm md:col-span-2">Image URLs (one per line)<textarea name="imageUrls" defaultValue={initial?.imageUrls.join('\n')} placeholder="https://…" className={`${field} min-h-24`} /></label>
    <div className="md:col-span-2"><button disabled={busy} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Saving…' : submitLabel}</button></div>
  </form>;
}

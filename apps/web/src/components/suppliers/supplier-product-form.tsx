'use client';

import Image from 'next/image';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { EVENT_INDUSTRY_TAXONOMY, suggestProductDiscovery } from '@/lib/event-industry-taxonomy';
import type { SupplierProductFormValues } from '@/lib/supplier-product-form';
import { SUPPLIER_PRODUCT_CATEGORIES, SUPPLIER_PRODUCT_UNITS, type SupplierProductCategory, type SupplierProductUnit } from '@/lib/supplier-products-types';

export type { SupplierProductFormValues } from '@/lib/supplier-product-form';

type Props = { mode: 'create' | 'edit'; values: SupplierProductFormValues; saving: boolean; error: string; success: string; onChange: (next: SupplierProductFormValues) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void };

const input = 'mt-1 w-full rounded-md border border-zinc-300 px-3 py-2';
const label = 'text-sm text-zinc-700';

export function SupplierProductForm({ mode, values, saving, error, success, onChange, onSubmit }: Props) {
  const set = <K extends keyof SupplierProductFormValues>(key: K, value: SupplierProductFormValues[K]) => onChange({ ...values, [key]: value });
  const suggest = () => {
    const result = suggestProductDiscovery({ productName: values.productName, category: values.category, subcategory: values.subcategory, colour: values.colour, material: values.material, style: values.style });
    onChange({ ...values, marketplaceDescription: result.description, tags: result.tags.join(', '), searchTerms: result.searchTerms.join(', ') });
  };
  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, Math.max(0, 8 - values.imageUrls.length));
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= 5_000_000);
    const urls = await Promise.all(valid.map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); })));
    set('imageUrls', [...values.imageUrls, ...urls]);
    event.target.value = '';
  };
  return <form className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
    <h2 className="text-lg font-semibold">{mode === 'create' ? 'Create supplier product' : 'Edit supplier product'}</h2>
    <p className="mt-1 text-sm text-zinc-600">Private costs and notes remain in ClientOS. Only approved Marketplace details are published.</p>
    <Section title="1. Product basics"><div className="grid gap-4 md:grid-cols-2">
      <Field text="Product name"><input className={input} required maxLength={180} value={values.productName} onChange={(e)=>set('productName',e.target.value)}/></Field>
      <Field text="SKU"><input className={input} value={values.sku} onChange={(e)=>set('sku',e.target.value)}/></Field>
      <Field text="Category"><select className={input} value={values.category} onChange={(e)=>{ const category=e.target.value as SupplierProductCategory; onChange({...values,category,subcategory:''}); }}>{SUPPLIER_PRODUCT_CATEGORIES.map(v=><option key={v}>{v}</option>)}</select></Field>
      <Field text="Subcategory"><select className={input} required value={values.subcategory} onChange={(e)=>set('subcategory',e.target.value)}><option value="">Select subcategory</option>{EVENT_INDUSTRY_TAXONOMY[values.category].map(v=><option key={v}>{v}</option>)}</select></Field>
      <Field text="Brand"><input className={input} value={values.brand} onChange={(e)=>set('brand',e.target.value)}/></Field>
      <Field text="Condition"><select className={input} value={values.condition} onChange={(e)=>set('condition',e.target.value)}><option value="">Not specified</option>{['New','Excellent','Good','Fair','Refurbished'].map(v=><option key={v}>{v}</option>)}</select></Field>
      {(['colour','material','style'] as const).map(key=><Field key={key} text={key[0].toUpperCase()+key.slice(1)}><input className={input} value={values[key]} onChange={(e)=>set(key,e.target.value)}/></Field>)}
      <Field text="Private internal description" wide><textarea className={`${input} min-h-20`} value={values.description} onChange={(e)=>set('description',e.target.value)}/></Field>
    </div></Section>
    <Section title="2. Images"><p className="text-sm text-zinc-600">Upload or photograph up to 8 images (maximum 5 MB each).</p><input className="mt-3" type="file" accept="image/*" capture="environment" multiple onChange={(e)=>void addImages(e)}/><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{values.imageUrls.map((url,index)=><div className="relative overflow-hidden rounded-lg border" key={`${url.slice(0,30)}-${index}`}><Image unoptimized src={url} alt={`Product preview ${index+1}`} width={320} height={240} className="h-32 w-full object-cover"/><button type="button" className="absolute right-1 top-1 rounded bg-white px-2 py-1 text-xs" onClick={()=>set('imageUrls',values.imageUrls.filter((_,i)=>i!==index))}>Remove</button></div>)}</div></Section>
    <Section title="3. Stock, pricing and fulfilment"><div className="grid gap-4 md:grid-cols-3">
      <Field text="Unit"><select className={input} value={values.unit} onChange={(e)=>set('unit',e.target.value as SupplierProductUnit)}>{SUPPLIER_PRODUCT_UNITS.map(v=><option key={v}>{v}</option>)}</select></Field>
      <Num text="Total quantity" value={values.totalQuantity} change={(v)=>set('totalQuantity',v)}/><Field text="Availability"><select className={input} value={values.availability} onChange={(e)=>set('availability',e.target.value as SupplierProductFormValues['availability'])}>{['Available','Limited','Unavailable','MadeToOrder'].map(v=><option key={v}>{v}</option>)}</select></Field>
      <Num text="Private cost price" required value={values.costPrice} change={(v)=>set('costPrice',v)}/><Num text="Marketplace price" value={values.sellingPrice} change={(v)=>set('sellingPrice',v)}/><Num text="VAT %" value={values.vatPercent} change={(v)=>set('vatPercent',v)}/>
      <Num text="Lead time (days)" value={values.leadTimeDays} change={(v)=>set('leadTimeDays',v)}/><Num text="Minimum order" value={values.minimumOrderQuantity} change={(v)=>set('minimumOrderQuantity',v)}/><Num text="Delivery radius (km)" value={values.deliveryRadiusKm} change={(v)=>set('deliveryRadiusKm',v)}/><Num text="Delivery fee" value={values.deliveryFee} change={(v)=>set('deliveryFee',v)}/>
      <Check text="Delivery available" checked={values.deliveryAvailable} change={(v)=>set('deliveryAvailable',v)}/><Check text="Collection available" checked={values.pickupAvailable} change={(v)=>set('pickupAvailable',v)}/>
    </div></Section>
    <Section title="4. Marketplace discovery"><button type="button" className="rounded-md border border-amber-400 px-3 py-2 text-sm font-medium" onClick={suggest}>Suggest description, tags and search terms</button><div className="mt-4 grid gap-4">
      <Field text="Public Marketplace description"><textarea className={`${input} min-h-24`} value={values.marketplaceDescription} onChange={(e)=>set('marketplaceDescription',e.target.value)}/></Field>
      <Field text="Tags (comma separated)"><input className={input} value={values.tags} onChange={(e)=>set('tags',e.target.value)}/></Field>
      <Field text="Search terms and customer language (comma separated)"><textarea className={`${input} min-h-20`} value={values.searchTerms} onChange={(e)=>set('searchTerms',e.target.value)}/></Field>
    </div></Section>
    <Section title="5. Internal controls"><div className="grid gap-4 md:grid-cols-2"><Check text="Preferred product" checked={values.preferredProduct} change={(v)=>set('preferredProduct',v)}/><Check text="Active in ClientOS" checked={values.active} change={(v)=>set('active',v)}/><Field text="Private notes" wide><textarea className={`${input} min-h-20`} value={values.notes} onChange={(e)=>set('notes',e.target.value)}/></Field></div></Section>
    {error&&<p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
    <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving?'Saving...':mode==='create'?'Save draft':'Save changes'}</button></div>
  </form>;
}

function Section({title,children}:{title:string;children:ReactNode}){return <section className="mt-6 border-t border-zinc-200 pt-5"><h3 className="mb-3 font-semibold text-zinc-900">{title}</h3>{children}</section>}
function Field({text,wide,children}:{text:string;wide?:boolean;children:ReactNode}){return <label className={`${label} ${wide?'md:col-span-full':''}`}>{text}{children}</label>}
function Num({text,value,change,required}:{text:string;value:string;change:(v:string)=>void;required?:boolean}){return <Field text={text}><input className={input} type="number" min="0" step="0.01" required={required} value={value} onChange={(e)=>change(e.target.value)}/></Field>}
function Check({text,checked,change}:{text:string;checked:boolean;change:(v:boolean)=>void}){return <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={checked} onChange={(e)=>change(e.target.checked)}/>{text}</label>}

'use client';

import { useState } from 'react';
import { createRequirementSet } from '../../lib/event-planning-api';
import type { EventDesignVersion, RequirementSetInput } from '../../lib/event-planning-types';

type ItemDraft = RequirementSetInput['items'][number] & { key: number };
type DependencyDraft = NonNullable<RequirementSetInput['dependencies']>[number] & { key: number };

type Props = {
  eventId: string;
  token: string;
  baseUrl: string;
  designs: EventDesignVersion[];
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
};

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

function newItem(key: number): ItemDraft {
  return {
    key,
    category: '',
    requirementType: 'Product',
    name: '',
    description: '',
    quantityRequired: 1,
    unit: 'Each',
    quantitySource: 'Manual',
    fulfilmentStrategy: 'Undecided',
  };
}

export function RequirementSetEditor({ eventId, token, baseUrl, designs, onCreated, onError }: Props) {
  const approvedDesigns = designs.filter((row) => row.status === 'Approved');
  const [designId, setDesignId] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([newItem(1)]);
  const [dependencies, setDependencies] = useState<DependencyDraft[]>([]);
  const [nextKey, setNextKey] = useState(2);
  const [busy, setBusy] = useState(false);

  function updateItem(key: number, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: number) {
    setItems((current) => current.filter((item) => item.key !== key));
    setDependencies([]);
  }

  function addItem() {
    setItems((current) => [...current, newItem(nextKey)]);
    setNextKey((current) => current + 1);
  }

  function addDependency() {
    if (items.length < 2) return;
    setDependencies((current) => [
      ...current,
      {
        key: nextKey + current.length,
        sourceItemNumber: 1,
        targetItemNumber: 2,
        level: 'Direct',
        description: '',
      },
    ]);
  }

  function updateDependency(key: number, patch: Partial<DependencyDraft>) {
    setDependencies((current) => current.map((dependency) => dependency.key === key ? { ...dependency, ...patch } : dependency));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onError('');
    try {
      await createRequirementSet(
        { token, baseUrl },
        eventId,
        {
          eventDesignVersionId: designId,
          items: items.map((item) => ({
            category: item.category,
            requirementType: item.requirementType,
            name: item.name,
            description: item.description,
            quantityRequired: item.quantityRequired,
            unit: item.unit,
            quantitySource: item.quantitySource,
            fulfilmentStrategy: item.fulfilmentStrategy,
          })),
          dependencies: dependencies.map((dependency) => ({
            sourceItemNumber: dependency.sourceItemNumber,
            targetItemNumber: dependency.targetItemNumber,
            level: dependency.level,
            description: dependency.description,
          })),
        },
      );
      setItems([newItem(1)]);
      setDependencies([]);
      setDesignId('');
      await onCreated(`A Requirement Set with ${items.length} item${items.length === 1 ? '' : 's'} was created.`);
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : 'Failed to create Requirement Set.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
      <div>
        <h2 className="font-semibold">3. Requirement Set</h2>
        <p className="text-sm text-zinc-600">Author all requirements together and make dependencies explicit before approval.</p>
      </div>
      <select required value={designId} onChange={(event) => setDesignId(event.target.value)} className={fieldClass}>
        <option value="" disabled>Select approved design</option>
        {approvedDesigns.map((design) => <option key={design.id} value={design.id}>Design version {design.version}</option>)}
      </select>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <fieldset key={item.key} className="grid gap-3 rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <legend className="font-medium text-zinc-900">Requirement {index + 1}</legend>
              {items.length > 1 ? <button type="button" onClick={() => removeItem(item.key)} className="text-xs text-red-700">Remove</button> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required value={item.category} onChange={(event) => updateItem(item.key, { category: event.target.value })} placeholder="Category" className={fieldClass} />
              <select value={item.requirementType} onChange={(event) => updateItem(item.key, { requirementType: event.target.value as ItemDraft['requirementType'] })} className={fieldClass}><option>Product</option><option>Service</option><option>Resource</option></select>
            </div>
            <input required value={item.name} onChange={(event) => updateItem(item.key, { name: event.target.value })} placeholder="Requirement name" className={fieldClass} />
            <textarea value={item.description ?? ''} onChange={(event) => updateItem(item.key, { description: event.target.value })} placeholder="Description" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input required type="number" min="0" step="any" value={item.quantityRequired} onChange={(event) => updateItem(item.key, { quantityRequired: Number(event.target.value) })} className={fieldClass} aria-label={`Requirement ${index + 1} quantity`} />
              <input required value={item.unit} onChange={(event) => updateItem(item.key, { unit: event.target.value })} placeholder="Unit" className={fieldClass} />
              <select value={item.fulfilmentStrategy} onChange={(event) => updateItem(item.key, { fulfilmentStrategy: event.target.value as ItemDraft['fulfilmentStrategy'] })} className={fieldClass}><option>Undecided</option><option>OwnInventory</option><option>Marketplace</option><option>ExternalSupplier</option><option>Hybrid</option></select>
            </div>
          </fieldset>
        ))}
      </div>
      <button type="button" onClick={addItem} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Add requirement</button>

      {dependencies.map((dependency, index) => (
        <fieldset key={dependency.key} className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:grid-cols-4">
          <legend className="px-1 text-sm font-medium">Dependency {index + 1}</legend>
          <select aria-label={`Dependency ${index + 1} source`} value={dependency.sourceItemNumber} onChange={(event) => updateDependency(dependency.key, { sourceItemNumber: Number(event.target.value) })} className={fieldClass}>{items.map((item, itemIndex) => <option key={item.key} value={itemIndex + 1}>Requirement {itemIndex + 1}</option>)}</select>
          <select aria-label={`Dependency ${index + 1} target`} value={dependency.targetItemNumber} onChange={(event) => updateDependency(dependency.key, { targetItemNumber: Number(event.target.value) })} className={fieldClass}>{items.map((item, itemIndex) => <option key={item.key} value={itemIndex + 1}>Requirement {itemIndex + 1}</option>)}</select>
          <select aria-label={`Dependency ${index + 1} level`} value={dependency.level} onChange={(event) => updateDependency(dependency.key, { level: event.target.value as DependencyDraft['level'] })} className={fieldClass}><option>Direct</option><option>Calculated</option><option>Design</option></select>
          <input value={dependency.description ?? ''} onChange={(event) => updateDependency(dependency.key, { description: event.target.value })} placeholder="Why are they related?" className={fieldClass} />
          <button type="button" onClick={() => setDependencies((current) => current.filter((row) => row.key !== dependency.key))} className="text-left text-xs text-red-700 sm:col-span-4">Remove dependency</button>
        </fieldset>
      ))}
      <button type="button" disabled={items.length < 2} onClick={addDependency} className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-40">Add dependency</button>
      <button disabled={!approvedDesigns.length || busy || !items.length} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40">{busy ? 'Creating…' : 'Create Requirement Set'}</button>
    </form>
  );
}

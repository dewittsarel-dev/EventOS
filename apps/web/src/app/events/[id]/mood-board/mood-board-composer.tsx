'use client';

import { useMemo, useState } from 'react';
import type { RequirementSet } from '../../../../lib/event-planning-types';
import type { MarketplaceListing } from '../../../../lib/marketplace-public-types';
import type { MoodBoardObjectSource } from '../../../../lib/mood-board-types';
import type { MoodBoard } from '../../../../lib/mood-board-types';

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

type DraftObject = {
  key: number;
  objectKey?: string;
  requirementItemId: string;
  name: string;
  source: MoodBoardObjectSource;
  sourceReferenceId: string;
  supplierName: string;
  marketplaceListingId: string;
  imageUrl: string;
  placementInstructions: string;
  locked: boolean;
};

export type MoodBoardComposition = {
  requirementSetId: string;
  title: string;
  basedOnMoodBoardId?: string;
  scenes: Array<{
    sceneKey: string;
    name: string;
    description?: string;
    objects: Array<{
      objectKey?: string;
      requirementItemId: string;
      name: string;
      source: MoodBoardObjectSource;
      sourceReferenceId: string;
      supplierName?: string;
      marketplaceListingId?: string;
      imageUrl: string;
      locked: boolean;
      presentation: { placementInstructions?: string };
    }>;
  }>;
};

type Props = {
  sets: RequirementSet[];
  marketplaceListings: MarketplaceListing[];
  basedOn?: MoodBoard;
  onCancelRevision?: () => void;
  onCreate: (composition: MoodBoardComposition) => Promise<void>;
};

const blankObject = (key: number): DraftObject => ({
  key,
  requirementItemId: '',
  name: '',
  source: 'Marketplace',
  sourceReferenceId: '',
  supplierName: '',
  marketplaceListingId: '',
  imageUrl: '',
  placementInstructions: '',
  locked: false,
});

export function MoodBoardComposer({ sets, marketplaceListings, basedOn, onCancelRevision, onCreate }: Props) {
  const approvedSets = sets.filter((set) => set.status === 'Approved');
  const revisionScene = basedOn?.scenes[0];
  const [selectedSetId, setSelectedSetId] = useState(basedOn?.requirementSetId ?? '');
  const [title, setTitle] = useState(basedOn ? `${basedOn.title} revision` : '');
  const [sceneName, setSceneName] = useState(revisionScene?.name ?? 'Main Hall');
  const [sceneInstructions, setSceneInstructions] = useState(revisionScene?.description ?? '');
  const [objects, setObjects] = useState<DraftObject[]>(revisionScene?.objects.map((object, index) => ({
    key: index + 1,
    objectKey: object.objectKey,
    requirementItemId: object.requirementItemId,
    name: object.name,
    source: object.source,
    sourceReferenceId: object.sourceReferenceId,
    supplierName: object.supplierName ?? '',
    marketplaceListingId: object.marketplaceListingId ?? '',
    imageUrl: object.imageUrl,
    placementInstructions: object.presentation?.placementInstructions ?? '',
    locked: object.locked,
  })) ?? [blankObject(1)]);
  const [submitting, setSubmitting] = useState(false);
  const selectedSet = approvedSets.find((set) => set.id === selectedSetId);
  const nextKey = useMemo(() => Math.max(0, ...objects.map((object) => object.key)) + 1, [objects]);

  function updateObject(key: number, update: Partial<DraftObject>) {
    setObjects((rows) => rows.map((row) => row.key === key ? { ...row, ...update } : row));
  }

  function selectMarketplaceObject(key: number, listingId: string) {
    const listing = marketplaceListings.find((row) => row.id === listingId);
    if (!listing) return;
    updateObject(key, {
      marketplaceListingId: listing.id,
      sourceReferenceId: listing.id,
      supplierName: listing.supplierName,
      name: listing.title ?? '',
      imageUrl: listing.primaryPhotoUrl ?? listing.photoUrls[0] ?? '',
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        requirementSetId: selectedSetId,
        title,
        basedOnMoodBoardId: basedOn?.id,
        scenes: [{
          sceneKey: sceneName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          name: sceneName,
          description: sceneInstructions || undefined,
          objects: objects.map((object) => ({
            objectKey: object.objectKey,
            requirementItemId: object.requirementItemId,
            name: object.name,
            source: object.source,
            sourceReferenceId: object.sourceReferenceId,
            supplierName: object.source === 'Marketplace' ? object.supplierName : undefined,
            marketplaceListingId: object.source === 'Marketplace' ? object.marketplaceListingId : undefined,
            imageUrl: object.imageUrl,
            locked: object.locked,
            presentation: { placementInstructions: object.placementInstructions },
          })),
        }, ...(basedOn?.scenes.slice(1).map((scene) => ({
          sceneKey: scene.sceneKey,
          name: scene.name,
          description: scene.description ?? undefined,
          objects: scene.objects.map((object) => ({
            objectKey: object.objectKey,
            requirementItemId: object.requirementItemId,
            name: object.name,
            source: object.source,
            sourceReferenceId: object.sourceReferenceId,
            supplierName: object.supplierName ?? undefined,
            marketplaceListingId: object.marketplaceListingId ?? undefined,
            imageUrl: object.imageUrl,
            locked: object.locked,
            presentation: object.presentation ?? {},
          })),
        })) ?? [])],
      });
      setTitle('');
      setSceneInstructions('');
      setObjects([blankObject(nextKey)]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{basedOn ? `Create revision from V${basedOn.version}` : 'Compose a visual scene'}</h2>{basedOn && onCancelRevision ? <button type="button" onClick={onCancelRevision} className="text-sm text-zinc-600 underline">Cancel revision</button> : null}</div>
        <p className="text-sm text-zinc-600">Select the real products and images first. The structured scene brief can later be rendered by AI without losing supplier or requirement traceability.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <select required aria-label="Approved Requirement Set" value={selectedSetId} onChange={(event) => setSelectedSetId(event.target.value)} className={fieldClass}>
          <option value="" disabled>Select approved Requirement Set</option>
          {approvedSets.map((set) => <option key={set.id} value={set.id}>Requirement Set V{set.version}</option>)}
        </select>
        <input required aria-label="Mood Board title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mood Board title" className={fieldClass} />
        <input required aria-label="Scene name" value={sceneName} onChange={(event) => setSceneName(event.target.value)} placeholder="Scene name" className={fieldClass} />
        <textarea aria-label="Scene layout instructions" value={sceneInstructions} onChange={(event) => setSceneInstructions(event.target.value)} placeholder="Overall layout, e.g. three long table rows with ten guests per table" className={`${fieldClass} min-h-20`} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="text-sm font-semibold">Scene objects</h3><p className="text-xs text-zinc-500">Every object must remain linked to a requirement.</p></div>
          <button type="button" onClick={() => setObjects((rows) => [...rows, blankObject(nextKey)])} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Add object</button>
        </div>
        {objects.map((object, index) => (
          <fieldset key={object.key} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
            <legend className="px-1 text-sm font-medium">Object {index + 1}</legend>
            <select required disabled={object.locked} aria-label={`Object ${index + 1} requirement`} value={object.requirementItemId} onChange={(event) => updateObject(object.key, { requirementItemId: event.target.value })} className={fieldClass}>
              <option value="" disabled>Select linked requirement</option>
              {selectedSet?.items.map((item) => <option key={item.id} value={item.id}>{item.requirementCode} · {item.name} · {item.quantityRequired} {item.unit}</option>)}
            </select>
            <select disabled={object.locked} aria-label={`Object ${index + 1} source`} value={object.source} onChange={(event) => updateObject(object.key, { source: event.target.value as MoodBoardObjectSource, sourceReferenceId: '', supplierName: '', marketplaceListingId: '', imageUrl: '' })} className={fieldClass}>
              <option value="Marketplace">Marketplace supplier image</option>
              <option value="PlannerLibrary">Planner library</option>
              <option value="ClientUpload">Client or external design import</option>
              <option value="AiConcept">AI concept reference</option>
            </select>
            {object.source === 'Marketplace' ? (
              <select required disabled={object.locked} aria-label={`Object ${index + 1} Marketplace listing`} value={object.marketplaceListingId} onChange={(event) => selectMarketplaceObject(object.key, event.target.value)} className={`${fieldClass} md:col-span-2`}>
                <option value="" disabled>Select a published Marketplace product</option>
                {marketplaceListings.filter((listing) => listing.primaryPhotoUrl || listing.photoUrls.length).map((listing) => <option key={listing.id} value={listing.id}>{listing.title ?? 'Untitled'} · {listing.supplierName}</option>)}
              </select>
            ) : (
              <input required disabled={object.locked} aria-label={`Object ${index + 1} source reference`} value={object.sourceReferenceId} onChange={(event) => updateObject(object.key, { sourceReferenceId: event.target.value })} placeholder="Library asset ID or imported design reference" className={`${fieldClass} md:col-span-2`} />
            )}
            <input required disabled={object.locked} aria-label={`Object ${index + 1} name`} value={object.name} onChange={(event) => updateObject(object.key, { name: event.target.value })} placeholder="Object name" className={fieldClass} />
            <input required disabled={object.locked} type="url" aria-label={`Object ${index + 1} image URL`} value={object.imageUrl} onChange={(event) => updateObject(object.key, { imageUrl: event.target.value })} placeholder="Source image URL" className={fieldClass} />
            <textarea disabled={object.locked} aria-label={`Object ${index + 1} placement instructions`} value={object.placementInstructions} onChange={(event) => updateObject(object.key, { placementInstructions: event.target.value })} placeholder="Placement, quantity and styling, e.g. two arrangements per table" className={`${fieldClass} min-h-20 md:col-span-2`} />
            <label className="flex items-center gap-2 text-sm"><input disabled={object.locked && Boolean(basedOn)} type="checkbox" checked={object.locked} onChange={(event) => updateObject(object.key, { locked: event.target.checked })} />{object.locked && basedOn ? 'Locked in the previous version' : 'Lock this object in future revisions'}</label>
            {objects.length > 1 && !object.locked ? <button type="button" onClick={() => setObjects((rows) => rows.filter((row) => row.key !== object.key))} className="justify-self-start text-sm text-red-700">Remove object</button> : null}
          </fieldset>
        ))}
      </div>
      {!marketplaceListings.length ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No published Marketplace images are currently available. Planner, client and external design sources remain available.</p> : null}
      <button disabled={!selectedSet || submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40">{submitting ? 'Saving composition…' : 'Save governed Mood Board version'}</button>
    </form>
  );
}

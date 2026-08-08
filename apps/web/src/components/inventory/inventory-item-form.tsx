'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  INVENTORY_INDOOR_OUTDOOR_OPTIONS,
  INVENTORY_MARKETPLACE_VISIBILITY_OPTIONS,
  INVENTORY_RESOURCE_STATUSES,
  INVENTORY_ITEM_TYPES,
  UNIT_OF_MEASURE_OPTIONS,
  type InventoryCategoryRecord,
  type InventoryIndoorOutdoor,
  type InventoryMarketplaceVisibility,
  type InventoryResourceStatus,
  type InventoryItemType,
  type UnitOfMeasure,
} from '../../lib/inventory-types';
import type { SupplierRecord } from '../../lib/suppliers-types';

export type InventoryItemFormValues = {
  sku: string;
  publicName: string;
  internalName: string;
  barcode: string;
  qrCode: string;
  name: string;
  description: string;
  shortDescription: string;
  longDescription: string;
  internalNotes: string;
  marketplaceTitle: string;
  marketplaceDescription: string;
  aiSummary: string;
  aiKeywords: string;
  aiTags: string;
  aiConfidence: string;
  categoryId: string;
  subCategory: string;
  brand: string;
  preferredSupplierId: string;
  resourceStatus: InventoryResourceStatus;
  itemType: InventoryItemType;
  unitOfMeasure: UnitOfMeasure;
  style: string;
  theme: string;
  colour: string;
  material: string;
  dimensions: string;
  weight: string;
  capacity: string;
  indoorOutdoor: InventoryIndoorOutdoor;
  suitableEventTypes: string;
  manualTags: string;
  keywords: string;
  aiGeneratedTags: string;
  marketplaceVisibility: InventoryMarketplaceVisibility;
  photoUrls: string;
  primaryPhotoUrl: string;
  photoAssetsJson: string;
  costPrice: string;
  replacementValue: string;
  rentalPrice: string;
  sellingPrice: string;
  taxable: boolean;
  active: boolean;
  trackQuantity: boolean;
  trackSerialNumbers: boolean;
  minimumStock: string;
  reorderLevel: string;
  notes: string;
};

type InventoryItemFormProps = {
  mode: 'create' | 'edit';
  values: InventoryItemFormValues;
  categories: InventoryCategoryRecord[];
  suppliers: SupplierRecord[];
  saving: boolean;
  error: string;
  success: string;
  canSubmit: boolean;
  cancelHref: string;
  onChange: (next: InventoryItemFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type AiSuggestionDecision = 'accept' | 'edit' | 'ignore';

export function InventoryItemForm({
  mode,
  values,
  categories,
  suppliers,
  saving,
  error,
  success,
  canSubmit,
  cancelHref,
  onChange,
  onSubmit,
}: InventoryItemFormProps) {
  const [summaryDecision, setSummaryDecision] = useState<AiSuggestionDecision>('edit');
  const [keywordsDecision, setKeywordsDecision] = useState<AiSuggestionDecision>('edit');
  const [tagsDecision, setTagsDecision] = useState<AiSuggestionDecision>('edit');

  function setDecision(
    decision: AiSuggestionDecision,
    target: 'summary' | 'keywords' | 'tags',
  ) {
    if (target === 'summary') {
      setSummaryDecision(decision);
      if (decision === 'accept') {
        onChange({ ...values, marketplaceDescription: values.aiSummary });
      }
      if (decision === 'ignore') {
        onChange({ ...values, aiSummary: '' });
      }
      return;
    }

    if (target === 'keywords') {
      setKeywordsDecision(decision);
      if (decision === 'accept') {
        onChange({ ...values, keywords: values.aiKeywords });
      }
      if (decision === 'ignore') {
        onChange({ ...values, aiKeywords: '' });
      }
      return;
    }

    setTagsDecision(decision);
    if (decision === 'accept') {
      onChange({ ...values, manualTags: values.aiGeneratedTags || values.aiTags });
    }
    if (decision === 'ignore') {
      onChange({ ...values, aiGeneratedTags: '', aiTags: '' });
    }
  }

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Create Resource Item' : 'Edit Resource Item'}
      </h2>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">1. Item Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            SKU
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.sku}
              onChange={(event) => onChange({ ...values, sku: event.target.value })}
              maxLength={80}
              required
            />
          </label>

          <label className="text-sm text-zinc-700">
            Public Name
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.publicName}
              onChange={(event) =>
                onChange({ ...values, publicName: event.target.value })
              }
              maxLength={180}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Internal Name
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.internalName}
              onChange={(event) =>
                onChange({ ...values, internalName: event.target.value })
              }
              maxLength={180}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Barcode
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.barcode}
              onChange={(event) =>
                onChange({ ...values, barcode: event.target.value })
              }
              maxLength={120}
            />
          </label>

          <label className="text-sm text-zinc-700">
            QR Code
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.qrCode}
              onChange={(event) =>
                onChange({ ...values, qrCode: event.target.value })
              }
              maxLength={120}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Resource Name
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.name}
              onChange={(event) => onChange({ ...values, name: event.target.value })}
              maxLength={180}
              required
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Description
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.description}
              onChange={(event) =>
                onChange({ ...values, description: event.target.value })
              }
              maxLength={3000}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Short Description
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.shortDescription}
              onChange={(event) =>
                onChange({ ...values, shortDescription: event.target.value })
              }
              maxLength={300}
            />
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">2. Classification</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-zinc-700">
            Category
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.categoryId}
              onChange={(event) =>
                onChange({ ...values, categoryId: event.target.value })
              }
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Sub Category
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.subCategory}
              onChange={(event) =>
                onChange({ ...values, subCategory: event.target.value })
              }
              maxLength={120}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Brand
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.brand}
              onChange={(event) => onChange({ ...values, brand: event.target.value })}
              maxLength={120}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Item Type
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.itemType}
              onChange={(event) =>
                onChange({
                  ...values,
                  itemType: event.target.value as InventoryItemType,
                })
              }
              required
            >
              {INVENTORY_ITEM_TYPES.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Unit of Measure
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.unitOfMeasure}
              onChange={(event) =>
                onChange({
                  ...values,
                  unitOfMeasure: event.target.value as UnitOfMeasure,
                })
              }
              required
            >
              {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Resource Status
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.resourceStatus}
              onChange={(event) =>
                onChange({
                  ...values,
                  resourceStatus: event.target.value as InventoryResourceStatus,
                })
              }
            >
              {INVENTORY_RESOURCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <details className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Manual Information and AI Suggestions
        </summary>

        <p className="mt-4 text-xs text-zinc-600">
          Manual fields remain the source of truth. AI suggestions can be accepted, edited,
          or ignored without blocking manual workflow.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="md:col-span-2 text-sm font-semibold text-zinc-800">Manual Information</p>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Long Description
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.longDescription}
              onChange={(event) =>
                onChange({ ...values, longDescription: event.target.value })
              }
              maxLength={6000}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Marketplace Title
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.marketplaceTitle}
              onChange={(event) =>
                onChange({ ...values, marketplaceTitle: event.target.value })
              }
              maxLength={180}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Marketplace Description
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.marketplaceDescription}
              onChange={(event) =>
                onChange({ ...values, marketplaceDescription: event.target.value })
              }
              maxLength={3000}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Internal Notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.internalNotes}
              onChange={(event) =>
                onChange({ ...values, internalNotes: event.target.value })
              }
              maxLength={4000}
            />
          </label>

          <p className="md:col-span-2 mt-2 text-sm font-semibold text-zinc-800">AI Suggestions</p>

          <div className="md:col-span-2 rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-sm font-medium text-zinc-800">AI Summary Suggestion</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${summaryDecision === 'accept' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('accept', 'summary')}
              >
                Accept
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${summaryDecision === 'edit' ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('edit', 'summary')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${summaryDecision === 'ignore' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('ignore', 'summary')}
              >
                Ignore
              </button>
            </div>

            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={values.aiSummary}
              onChange={(event) => onChange({ ...values, aiSummary: event.target.value })}
              maxLength={3000}
            />
          </div>

          <label className="text-sm text-zinc-700">
            AI Keywords (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.aiKeywords}
              onChange={(event) =>
                onChange({ ...values, aiKeywords: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            AI Tags (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.aiTags}
              onChange={(event) =>
                onChange({ ...values, aiTags: event.target.value })
              }
            />
          </label>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
            <p className="font-medium text-zinc-800">AI Keywords Decision</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${keywordsDecision === 'accept' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('accept', 'keywords')}
              >
                Accept
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${keywordsDecision === 'edit' ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('edit', 'keywords')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${keywordsDecision === 'ignore' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('ignore', 'keywords')}
              >
                Ignore
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
            <p className="font-medium text-zinc-800">AI Tags Decision</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${tagsDecision === 'accept' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('accept', 'tags')}
              >
                Accept
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${tagsDecision === 'edit' ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('edit', 'tags')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 text-xs ${tagsDecision === 'ignore' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-zinc-300 text-zinc-700'}`}
                onClick={() => setDecision('ignore', 'tags')}
              >
                Ignore
              </button>
            </div>
          </div>

          <label className="text-sm text-zinc-700">
            AI Confidence (0-1)
            <input
              type="number"
              step="0.0001"
              min={0}
              max={1}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.aiConfidence}
              onChange={(event) =>
                onChange({ ...values, aiConfidence: event.target.value })
              }
            />
          </label>
        </div>
      </details>

      <details className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Classification and Search Metadata
        </summary>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-zinc-700">
            Style
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.style}
              onChange={(event) => onChange({ ...values, style: event.target.value })}
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Theme
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.theme}
              onChange={(event) => onChange({ ...values, theme: event.target.value })}
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Colour
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.colour}
              onChange={(event) => onChange({ ...values, colour: event.target.value })}
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Material
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.material}
              onChange={(event) =>
                onChange({ ...values, material: event.target.value })
              }
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Dimensions
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.dimensions}
              onChange={(event) =>
                onChange({ ...values, dimensions: event.target.value })
              }
              maxLength={160}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Weight
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.weight}
              onChange={(event) => onChange({ ...values, weight: event.target.value })}
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Capacity
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.capacity}
              onChange={(event) => onChange({ ...values, capacity: event.target.value })}
              maxLength={80}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Indoor/Outdoor
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.indoorOutdoor}
              onChange={(event) =>
                onChange({
                  ...values,
                  indoorOutdoor: event.target.value as InventoryIndoorOutdoor,
                })
              }
            >
              {INVENTORY_INDOOR_OUTDOOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Suitable Event Types (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.suitableEventTypes}
              onChange={(event) =>
                onChange({ ...values, suitableEventTypes: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Keywords (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.keywords}
              onChange={(event) => onChange({ ...values, keywords: event.target.value })}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Manual Tags (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.manualTags}
              onChange={(event) =>
                onChange({ ...values, manualTags: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            AI Generated Tags (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.aiGeneratedTags}
              onChange={(event) =>
                onChange({ ...values, aiGeneratedTags: event.target.value })
              }
            />
          </label>
        </div>
      </details>

      <details className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Marketplace and Photos
        </summary>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Marketplace Visibility
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.marketplaceVisibility}
              onChange={(event) =>
                onChange({
                  ...values,
                  marketplaceVisibility: event.target
                    .value as InventoryMarketplaceVisibility,
                })
              }
            >
              {INVENTORY_MARKETPLACE_VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-700">
            Primary Photo URL
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.primaryPhotoUrl}
              onChange={(event) =>
                onChange({ ...values, primaryPhotoUrl: event.target.value })
              }
              placeholder="https://cdn.example.com/photo-1.jpg"
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Photo URLs (one per line, order preserved)
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.photoUrls}
              onChange={(event) =>
                onChange({ ...values, photoUrls: event.target.value })
              }
              placeholder="https://cdn.example.com/photo-1.jpg&#10;https://cdn.example.com/photo-2.jpg"
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Photo Metadata Foundation (JSON array)
            <textarea
              className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs"
              value={values.photoAssetsJson}
              onChange={(event) =>
                onChange({ ...values, photoAssetsJson: event.target.value })
              }
              placeholder='[{"url":"https://cdn.example.com/photo-1.jpg","isPrimary":true,"aiAnalysisSummary":null,"backgroundEnhancementStatus":"pending"}]'
            />
          </label>
        </div>
      </details>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">3. Pricing</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Cost Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.costPrice}
              onChange={(event) =>
                onChange({ ...values, costPrice: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Replacement Value
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.replacementValue}
              onChange={(event) =>
                onChange({ ...values, replacementValue: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Rental Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.rentalPrice}
              onChange={(event) =>
                onChange({ ...values, rentalPrice: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Selling Price
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.sellingPrice}
              onChange={(event) =>
                onChange({ ...values, sellingPrice: event.target.value })
              }
            />
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">4. Stock Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Minimum Stock
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.minimumStock}
              onChange={(event) =>
                onChange({ ...values, minimumStock: event.target.value })
              }
            />
          </label>

          <label className="text-sm text-zinc-700">
            Reorder Level
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.reorderLevel}
              onChange={(event) =>
                onChange({ ...values, reorderLevel: event.target.value })
              }
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={values.trackQuantity}
              onChange={(event) =>
                onChange({ ...values, trackQuantity: event.target.checked })
              }
              className="h-4 w-4"
            />
            Track Quantity
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={values.trackSerialNumbers}
              onChange={(event) =>
                onChange({
                  ...values,
                  trackSerialNumbers: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Track Serial Numbers
          </label>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">5. Supplier and Status</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Preferred Supplier
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={values.preferredSupplierId}
              onChange={(event) =>
                onChange({
                  ...values,
                  preferredSupplierId: event.target.value,
                })
              }
            >
              <option value="">No preferred supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 pt-6">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={values.taxable}
                onChange={(event) =>
                  onChange({ ...values, taxable: event.target.checked })
                }
                className="h-4 w-4"
              />
              Taxable
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={values.active}
                onChange={(event) =>
                  onChange({ ...values, active: event.target.checked })
                }
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">6. Notes</h3>
        <label className="text-sm text-zinc-700">
          Notes
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            maxLength={2000}
          />
        </label>
      </section>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Resource'
              : 'Save Resource'}
        </button>
      </div>
    </form>
  );
}

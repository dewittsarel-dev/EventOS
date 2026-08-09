'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../../components/app-shell/session-context';
import { InventoryItemForm, type InventoryItemFormValues } from '../../../../../components/inventory/inventory-item-form';
import {
  getInventoryItem,
  listInventoryCategories,
  updateInventoryItem,
} from '../../../../../lib/inventory-api';
import {
  type InventoryCategoryRecord,
  type InventoryItemRecord,
  type InventoryItemType,
  type UnitOfMeasure,
} from '../../../../../lib/inventory-types';
import { listSuppliers } from '../../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../../lib/suppliers-types';

function joinCsv(values: string[]) {
  return values.join(', ');
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function joinLines(values: string[]) {
  return values.join('\n');
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parsePhotoAssets(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Photo metadata must be a JSON array.');
  }

  return parsed.filter(
    (entry): entry is Record<string, unknown> =>
      typeof entry === 'object' && entry !== null,
  );
}

function itemToForm(item: InventoryItemRecord): InventoryItemFormValues {
  return {
    sku: item.sku,
    publicName: item.publicName ?? '',
    internalName: item.internalName ?? '',
    barcode: item.barcode ?? '',
    qrCode: item.qrCode ?? '',
    name: item.name,
    description: item.description ?? '',
    shortDescription: item.shortDescription ?? '',
    longDescription: item.longDescription ?? '',
    internalNotes: item.internalNotes ?? '',
    marketplaceTitle: item.marketplaceTitle ?? '',
    marketplaceDescription: item.marketplaceDescription ?? '',
    aiSummary: item.aiSummary ?? '',
    aiKeywords: joinCsv(item.aiKeywords),
    aiTags: joinCsv(item.aiTags),
    aiConfidence: item.aiConfidence === null ? '' : String(item.aiConfidence),
    categoryId: item.categoryId,
    subCategory: item.subCategory ?? '',
    brand: item.brand ?? '',
    preferredSupplierId: item.preferredSupplierId ?? '',
    resourceStatus: item.resourceStatus,
    itemType: item.itemType,
    unitOfMeasure: item.unitOfMeasure,
    style: item.style ?? '',
    theme: item.theme ?? '',
    colour: item.colour ?? '',
    material: item.material ?? '',
    dimensions: item.dimensions ?? '',
    weight: item.weight ?? '',
    capacity: item.capacity ?? '',
    indoorOutdoor: item.indoorOutdoor,
    suitableEventTypes: joinCsv(item.suitableEventTypes),
    manualTags: joinCsv(item.manualTags),
    keywords: joinCsv(item.keywords),
    aiGeneratedTags: joinCsv(item.aiGeneratedTags),
    marketplaceVisibility: item.marketplaceVisibility,
    photoUrls: joinLines(item.photoUrls),
    primaryPhotoUrl: item.primaryPhotoUrl ?? '',
    photoAssetsJson: item.photoAssets ? JSON.stringify(item.photoAssets, null, 2) : '',
    costPrice: item.costPrice === null ? '' : String(item.costPrice),
    replacementValue:
      item.replacementValue === null ? '' : String(item.replacementValue),
    rentalPrice: item.rentalPrice === null ? '' : String(item.rentalPrice),
    sellingPrice: item.sellingPrice === null ? '' : String(item.sellingPrice),
    taxable: item.taxable,
    active: item.active,
    trackQuantity: item.trackQuantity,
    trackSerialNumbers: item.trackSerialNumbers,
    minimumStock: item.minimumStock === null ? '' : String(item.minimumStock),
    reorderLevel: item.reorderLevel === null ? '' : String(item.reorderLevel),
    notes: item.notes ?? '',
  };
}

export default function EditInventoryItemPage() {
  const params = useParams<{ id: string }>();
  const itemId = String(params.id);

  const { session } = useAppSession();

  const [item, setItem] = useState<InventoryItemRecord | null>(null);
  const [form, setForm] = useState<InventoryItemFormValues | null>(null);
  const [categories, setCategories] = useState<InventoryCategoryRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [itemResponse, categoriesResponse, suppliersResponse] = await Promise.all([
          getInventoryItem(requestOptions, itemId),
          listInventoryCategories(requestOptions, {
            organizationId: session.organizationId,
            active: true,
            page: 1,
            limit: 100,
          }),
          listSuppliers(requestOptions, {
            organizationId: session.organizationId,
            page: 1,
            limit: 100,
            active: true,
          }),
        ]);

        if (!cancelled) {
          setItem(itemResponse);
          setForm(itemToForm(itemResponse));
          setCategories(categoriesResponse.data);
          setSuppliers(suppliersResponse.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load resource item.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, itemId, requestOptions, session.organizationId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please sign in before editing this resource.');
      return;
    }

    if (!form.sku.trim()) {
      setError('SKU is required.');
      return;
    }

    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }

    if (!form.categoryId) {
      setError('Category is required.');
      return;
    }

    setSaving(true);

    try {
      const photoAssets = parsePhotoAssets(form.photoAssetsJson);

      const updated = await updateInventoryItem(requestOptions, itemId, {
        sku: form.sku.trim(),
        publicName: form.publicName.trim() || undefined,
        internalName: form.internalName.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        qrCode: form.qrCode.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        longDescription: form.longDescription.trim() || undefined,
        internalNotes: form.internalNotes.trim() || undefined,
        marketplaceTitle: form.marketplaceTitle.trim() || undefined,
        marketplaceDescription: form.marketplaceDescription.trim() || undefined,
        aiSummary: form.aiSummary.trim() || undefined,
        aiKeywords: parseCsv(form.aiKeywords),
        aiTags: parseCsv(form.aiTags),
        aiConfidence: form.aiConfidence ? Number(form.aiConfidence) : undefined,
        categoryId: form.categoryId,
        subCategory: form.subCategory.trim() || undefined,
        brand: form.brand.trim() || undefined,
        preferredSupplierId: form.preferredSupplierId || undefined,
        resourceStatus: form.resourceStatus,
        itemType: form.itemType as InventoryItemType,
        unitOfMeasure: form.unitOfMeasure as UnitOfMeasure,
        style: form.style.trim() || undefined,
        theme: form.theme.trim() || undefined,
        colour: form.colour.trim() || undefined,
        material: form.material.trim() || undefined,
        dimensions: form.dimensions.trim() || undefined,
        weight: form.weight.trim() || undefined,
        capacity: form.capacity.trim() || undefined,
        indoorOutdoor: form.indoorOutdoor,
        suitableEventTypes: parseCsv(form.suitableEventTypes),
        manualTags: parseCsv(form.manualTags),
        keywords: parseCsv(form.keywords),
        aiGeneratedTags: parseCsv(form.aiGeneratedTags),
        marketplaceVisibility: form.marketplaceVisibility,
        photoUrls: parseLines(form.photoUrls),
        primaryPhotoUrl: form.primaryPhotoUrl.trim() || undefined,
        photoAssets: photoAssets.length > 0 ? photoAssets : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        replacementValue: form.replacementValue
          ? Number(form.replacementValue)
          : undefined,
        rentalPrice: form.rentalPrice ? Number(form.rentalPrice) : undefined,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        taxable: form.taxable,
        active: form.active,
        trackQuantity: form.trackQuantity,
        trackSerialNumbers: form.trackSerialNumbers,
        minimumStock: form.minimumStock ? Number(form.minimumStock) : undefined,
        reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
        notes: form.notes.trim() || undefined,
      });

      setItem(updated);
      setForm(itemToForm(updated));
      setSuccess('Resource item updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update resource item.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Resource Item" />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to edit resource items.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading resource item...
        </div>
      ) : null}

      {error && !form ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canLoad && form ? (
        <InventoryItemForm
          mode="edit"
          values={form}
          categories={categories}
          suppliers={suppliers}
          saving={saving}
          error={error}
          success={success}
          canSubmit={categories.length > 0}
          cancelHref={`/inventory/items/${item?.id ?? itemId}`}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : null}
    </div>
  );
}

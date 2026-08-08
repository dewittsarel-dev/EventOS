'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { InventoryItemForm, type InventoryItemFormValues } from '../../../../components/inventory/inventory-item-form';
import {
  createInventoryItem,
  listInventoryCategories,
} from '../../../../lib/inventory-api';
import {
  type InventoryCategoryRecord,
  type InventoryItemType,
  type UnitOfMeasure,
} from '../../../../lib/inventory-types';
import { listSuppliers } from '../../../../lib/suppliers-api';
import type { SupplierRecord } from '../../../../lib/suppliers-types';

function parseCsv(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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

const defaultForm: InventoryItemFormValues = {
  sku: '',
  publicName: '',
  internalName: '',
  barcode: '',
  qrCode: '',
  name: '',
  description: '',
  shortDescription: '',
  longDescription: '',
  internalNotes: '',
  marketplaceTitle: '',
  marketplaceDescription: '',
  aiSummary: '',
  aiKeywords: '',
  aiTags: '',
  aiConfidence: '',
  categoryId: '',
  subCategory: '',
  brand: '',
  preferredSupplierId: '',
  resourceStatus: 'Active',
  itemType: 'Equipment',
  unitOfMeasure: 'Each',
  style: '',
  theme: '',
  colour: '',
  material: '',
  dimensions: '',
  weight: '',
  capacity: '',
  indoorOutdoor: 'Both',
  suitableEventTypes: '',
  manualTags: '',
  keywords: '',
  aiGeneratedTags: '',
  marketplaceVisibility: 'Private',
  photoUrls: '',
  primaryPhotoUrl: '',
  photoAssetsJson: '',
  costPrice: '',
  replacementValue: '',
  rentalPrice: '',
  sellingPrice: '',
  taxable: false,
  active: true,
  trackQuantity: true,
  trackSerialNumbers: false,
  minimumStock: '',
  reorderLevel: '',
  notes: '',
};

export default function NewInventoryItemPage() {
  const { session } = useAppSession();

  const [form, setForm] = useState<InventoryItemFormValues>(defaultForm);
  const [categories, setCategories] = useState<InventoryCategoryRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  const [loadingRefs, setLoadingRefs] = useState(false);
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

    async function loadReferenceData() {
      if (!canLoad || !session.organizationId) {
        return;
      }

      setLoadingRefs(true);
      setError('');

      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
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
          setCategories(categoriesResponse.data);
          setSuppliers(suppliersResponse.data);

          if (!form.categoryId && categoriesResponse.data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: categoriesResponse.data[0].id }));
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load categories and suppliers.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRefs(false);
        }
      }
    }

    void loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, form.categoryId, requestOptions, session.organizationId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
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

      await createInventoryItem(requestOptions, {
        organizationId: session.organizationId,
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

      setSuccess('Resource item created successfully.');
      setForm({
        ...defaultForm,
        categoryId: categories[0]?.id ?? '',
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create resource item.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Resource Item"
        description="Add a new resource item to the active organization."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to create resource items.
        </div>
      ) : null}

      {loadingRefs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading categories and suppliers...
        </div>
      ) : null}

      {canLoad && !loadingRefs && categories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Create a category before assigning one to a resource item.
        </div>
      ) : null}

      {canLoad && !loadingRefs && categories.length > 0 ? (
        <InventoryItemForm
          mode="create"
          values={form}
          categories={categories}
          suppliers={suppliers}
          saving={saving}
          error={error}
          success={success}
          canSubmit={categories.length > 0}
          cancelHref="/inventory/items"
          onChange={setForm}
          onSubmit={onSubmit}
        />
      ) : null}
    </div>
  );
}

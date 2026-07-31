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

const defaultForm: InventoryItemFormValues = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  preferredSupplierId: '',
  itemType: 'Equipment',
  unitOfMeasure: 'Each',
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
      await createInventoryItem(requestOptions, {
        organizationId: session.organizationId,
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        preferredSupplierId: form.preferredSupplierId || undefined,
        itemType: form.itemType as InventoryItemType,
        unitOfMeasure: form.unitOfMeasure as UnitOfMeasure,
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

      setSuccess('Inventory item created successfully.');
      setForm({
        ...defaultForm,
        categoryId: categories[0]?.id ?? '',
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create inventory item.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Inventory Item"
        description="Add a new inventory item to the active organization."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to create inventory items.
        </div>
      ) : null}

      {loadingRefs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading categories and suppliers...
        </div>
      ) : null}

      {canLoad && !loadingRefs && categories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Create a category before assigning one to an inventory item.
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

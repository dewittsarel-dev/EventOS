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

function itemToForm(item: InventoryItemRecord): InventoryItemFormValues {
  return {
    sku: item.sku,
    barcode: item.barcode ?? '',
    name: item.name,
    description: item.description ?? '',
    categoryId: item.categoryId,
    preferredSupplierId: item.preferredSupplierId ?? '',
    itemType: item.itemType,
    unitOfMeasure: item.unitOfMeasure,
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
              : 'Failed to load inventory item.',
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
      setError('Please save Bearer token first.');
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
      const updated = await updateInventoryItem(requestOptions, itemId, {
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

      setItem(updated);
      setForm(itemToForm(updated));
      setSuccess('Inventory item updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update inventory item.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Inventory Item" />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to edit inventory items.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading inventory item...
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

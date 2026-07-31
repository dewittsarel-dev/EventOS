'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  createInventoryCategory,
  deleteInventoryCategory,
  listInventoryCategories,
  updateInventoryCategory,
} from '../../../lib/inventory-api';
import type { InventoryCategoryRecord } from '../../../lib/inventory-types';

export default function InventoryCategoriesPage() {
  const { session } = useAppSession();

  const [categories, setCategories] = useState<InventoryCategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [savingCreate, setSavingCreate] = useState(false);

  const [editTarget, setEditTarget] = useState<InventoryCategoryRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  const loadCategories = useCallback(async () => {
    if (!canLoad || !session.organizationId) {
      setCategories([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await listInventoryCategories(requestOptions, {
        organizationId: session.organizationId,
        page: 1,
        limit: 100,
      });
      setCategories(response.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load categories.',
      );
    } finally {
      setLoading(false);
    }
  }, [canLoad, requestOptions, session.organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCategories]);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.organizationId) {
      setError('Please select an organization.');
      return;
    }

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSavingCreate(true);

    try {
      await createInventoryCategory(requestOptions, {
        organizationId: session.organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        active,
      });

      setName('');
      setDescription('');
      setActive(true);
      setSuccess('Category created successfully.');
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create category.',
      );
    } finally {
      setSavingCreate(false);
    }
  }

  function startEdit(category: InventoryCategoryRecord) {
    setEditTarget(category);
    setEditName(category.name);
    setEditDescription(category.description ?? '');
    setEditActive(category.active);
    setError('');
    setSuccess('');
  }

  async function onSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTarget) {
      return;
    }

    if (!editName.trim()) {
      setError('Category name is required.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      await updateInventoryCategory(requestOptions, editTarget.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        active: editActive,
      });

      setEditTarget(null);
      setSuccess('Category updated successfully.');
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update category.',
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDelete(id: string) {
    const confirmed = window.confirm('Delete this category?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteInventoryCategory(requestOptions, id);
      setSuccess('Category deleted.');
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete category.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inventory Categories"
        description="Create and maintain reusable item classifications."
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to manage categories.
        </div>
      ) : null}

      {canLoad ? (
        <form
          onSubmit={onCreate}
          className="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <h2 className="text-sm font-semibold text-zinc-800">Create Category</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-sm text-zinc-700">
              Name
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="text-sm text-zinc-700 md:col-span-2">
              Description
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingCreate}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {savingCreate ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading categories...
        </div>
      ) : canLoad && categories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No categories found. Create a category before assigning one to an inventory item.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Description</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2">{category.name}</td>
                  <td className="px-3 py-2 text-zinc-700">{category.description ?? '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">{category.active ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void onDelete(category.id);
                        }}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editTarget ? (
        <form
          onSubmit={onSaveEdit}
          className="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <h2 className="text-sm font-semibold text-zinc-800">Edit Category</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-sm text-zinc-700">
              Name
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </label>
            <label className="text-sm text-zinc-700 md:col-span-2">
              Description
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(event) => setEditActive(event.target.checked)}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {savingEdit ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

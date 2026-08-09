'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
} from '../../../lib/roles-api';
import {
  emptyPermissions,
  type CreateRolePayload,
  type RoleRecord,
  type UpdateRolePayload,
} from '../../../lib/roles-types';
import { ConfirmDeleteRoleDialog } from './components/confirm-delete-role-dialog';
import { RoleDialogForm } from './components/role-dialog-form';

export default function RolesPage() {
  const { session, activeOrganization } = useAppSession();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  const [busyAction, setBusyAction] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({
      token: session.token,
      baseUrl: session.baseUrl,
    }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      if (!canLoad || !session.organizationId) {
        if (!cancelled) {
          setRoles([]);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await listRoles(requestOptions, session.organizationId);

        if (!cancelled) {
          setRoles(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : 'Failed to load roles.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  function sortRoles(rows: RoleRecord[]) {
    return [...rows].sort((left, right) => left.name.localeCompare(right.name));
  }

  async function handleCreate(payload: CreateRolePayload) {
    if (!session.organizationId) {
      return;
    }

    setBusyAction('create');
    setError('');

    try {
      const created = await createRole(requestOptions, session.organizationId, payload);
      setRoles((prev) => sortRoles([...prev, created]));
      setSuccess('Role created successfully.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEdit(payload: UpdateRolePayload) {
    if (!session.organizationId || !editTarget) {
      return;
    }

    setBusyAction('edit');
    setBusyRoleId(editTarget.id);
    setError('');

    try {
      const updated = await updateRole(
        requestOptions,
        session.organizationId,
        editTarget.id,
        payload,
      );

      setRoles((prev) =>
        sortRoles(prev.map((candidate) => (candidate.id === updated.id ? updated : candidate))),
      );
      setSuccess('Role updated successfully.');
    } finally {
      setBusyAction(null);
      setBusyRoleId(null);
    }
  }

  async function handleDelete() {
    if (!session.organizationId || !deleteTarget) {
      return;
    }

    if (deleteTarget.isSystem) {
      setError('System roles cannot be deleted.');
      return;
    }

    setBusyAction('delete');
    setBusyRoleId(deleteTarget.id);
    setError('');

    try {
      await deleteRole(requestOptions, session.organizationId, deleteTarget.id);
      setRoles((prev) => prev.filter((candidate) => candidate.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccess('Role deleted successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to delete role.',
      );
    } finally {
      setBusyAction(null);
      setBusyRoleId(null);
    }
  }

  function systemPill(isSystem: boolean) {
    if (isSystem) {
      return 'inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700';
    }

    return 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700';
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Roles"
        description="Manage reusable role definitions and grouped permissions for the active organization."
        actions={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => {
              setSuccess('');
              setCreateOpen(true);
            }}
            disabled={!canLoad}
          >
            Create Role
          </button>
        }
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Sign in and select an organization to manage roles.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading roles...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {canLoad && !loading && roles.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No roles configured for {activeOrganization?.name ?? 'this organization'}.
        </div>
      ) : null}

      {canLoad && !loading && roles.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Role Name</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Number of Users</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">System Role</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const rowBusy = busyRoleId === role.id;
                    return (
                      <tr key={role.id} className="border-t border-zinc-200">
                        <td className="px-4 py-3 text-zinc-900">{role.name}</td>
                        <td className="px-4 py-3 text-zinc-700">{role.description || '-'}</td>
                        <td className="px-4 py-3 text-zinc-700">{role.userCount}</td>
                        <td className="px-4 py-3">
                          <span className={systemPill(role.isSystem)}>
                            {role.isSystem ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                              onClick={() => {
                                setSuccess('');
                                setEditTarget(role);
                              }}
                              disabled={rowBusy}
                            >
                              Edit Role
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                              onClick={() => {
                                setSuccess('');
                                setDeleteTarget(role);
                              }}
                              disabled={rowBusy || role.isSystem}
                              title={role.isSystem ? 'System roles cannot be deleted' : undefined}
                            >
                              Delete Custom Role
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {roles.map((role) => {
              const rowBusy = busyRoleId === role.id;
              return (
                <article key={role.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{role.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{role.description || '-'}</p>
                    </div>
                    <span className={systemPill(role.isSystem)}>{role.isSystem ? 'Yes' : 'No'}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                    Number of Users: {role.userCount}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      onClick={() => {
                        setSuccess('');
                        setEditTarget(role);
                      }}
                      disabled={rowBusy}
                    >
                      Edit Role
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                      onClick={() => {
                        setSuccess('');
                        setDeleteTarget(role);
                      }}
                      disabled={rowBusy || role.isSystem}
                    >
                      Delete Custom Role
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <RoleDialogForm
        key="create-role"
        title="Create Role"
        description="Define a custom role and grouped access permissions."
        submitLabel="Create Role"
        busyLabel="Creating..."
        open={createOpen}
        busy={busyAction === 'create'}
        initialPermissions={emptyPermissions()}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <RoleDialogForm
        key={editTarget?.id ?? 'edit-role-none'}
        title="Edit Role"
        description="Update role details and grouped permissions."
        submitLabel="Save Changes"
        busyLabel="Saving..."
        open={Boolean(editTarget)}
        busy={busyAction === 'edit'}
        initialName={editTarget?.name}
        initialDescription={editTarget?.description}
        initialPermissions={editTarget?.permissions}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDeleteRoleDialog
        open={Boolean(deleteTarget)}
        busy={busyAction === 'delete'}
        roleName={deleteTarget?.name || 'this role'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

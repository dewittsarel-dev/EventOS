'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  deleteOrganizationUser,
  disableOrganizationUser,
  enableOrganizationUser,
  inviteOrganizationUser,
  listOrganizationUsers,
  updateOrganizationUser,
} from '../../../lib/organization-users-api';
import type {
  InviteOrganizationUserPayload,
  OrganizationUserRecord,
  UpdateOrganizationUserPayload,
} from '../../../lib/organization-users-types';
import { ConfirmDeleteUserDialog } from './components/confirm-delete-user-dialog';
import { EditUserDialog } from './components/edit-user-dialog';
import { InviteUserDialog } from './components/invite-user-dialog';

export default function UsersPage() {
  const { session, activeOrganization } = useAppSession();

  const [users, setUsers] = useState<OrganizationUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isInviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationUserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizationUserRecord | null>(null);

  const [busyAction, setBusyAction] = useState<
    'invite' | 'edit' | 'delete' | 'disable' | 'enable' | null
  >(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

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

    async function runLoad() {
      if (!canLoad || !session.organizationId) {
        if (!cancelled) {
          setUsers([]);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await listOrganizationUsers(
          requestOptions,
          session.organizationId,
        );

        if (!cancelled) {
          setUsers(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load organization users.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [canLoad, requestOptions, session.organizationId]);

  async function handleInvite(payload: InviteOrganizationUserPayload) {
    if (!session.organizationId) {
      return;
    }

    setBusyAction('invite');
    setError('');

    try {
      const invited = await inviteOrganizationUser(
        requestOptions,
        session.organizationId,
        payload,
      );

      setUsers((prev) => {
        const existingIndex = prev.findIndex(
          (candidate) => candidate.userId === invited.userId,
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = invited;
          return next;
        }

        return [...prev, invited];
      });

      setSuccess('User invited successfully.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEdit(payload: UpdateOrganizationUserPayload) {
    if (!session.organizationId || !editTarget) {
      return;
    }

    setBusyAction('edit');
    setBusyUserId(editTarget.userId);
    setError('');

    try {
      const updated = await updateOrganizationUser(
        requestOptions,
        session.organizationId,
        editTarget.userId,
        payload,
      );

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.userId === updated.userId ? updated : candidate,
        ),
      );

      setSuccess('User details saved.');
    } finally {
      setBusyAction(null);
      setBusyUserId(null);
    }
  }

  async function handleStatusToggle(user: OrganizationUserRecord) {
    if (!session.organizationId) {
      return;
    }

    const shouldDisable = user.status === 'Active';

    setBusyAction(shouldDisable ? 'disable' : 'enable');
    setBusyUserId(user.userId);
    setError('');

    try {
      const updated = shouldDisable
        ? await disableOrganizationUser(
            requestOptions,
            session.organizationId,
            user.userId,
          )
        : await enableOrganizationUser(
            requestOptions,
            session.organizationId,
            user.userId,
          );

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.userId === updated.userId ? updated : candidate,
        ),
      );

      setSuccess(shouldDisable ? 'User disabled.' : 'User enabled.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update user status.',
      );
    } finally {
      setBusyAction(null);
      setBusyUserId(null);
    }
  }

  async function handleDelete() {
    if (!session.organizationId || !deleteTarget) {
      return;
    }

    setBusyAction('delete');
    setBusyUserId(deleteTarget.userId);
    setError('');

    try {
      await deleteOrganizationUser(
        requestOptions,
        session.organizationId,
        deleteTarget.userId,
      );

      setUsers((prev) =>
        prev.filter((candidate) => candidate.userId !== deleteTarget.userId),
      );
      setDeleteTarget(null);
      setSuccess('User deleted from organization.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete organization user.',
      );
    } finally {
      setBusyAction(null);
      setBusyUserId(null);
    }
  }

  function statusPill(status: OrganizationUserRecord['status']) {
    if (status === 'Active') {
      return 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700';
    }

    return 'inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700';
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Users"
        description="Manage organization users, access roles, and access status."
        actions={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => {
              setSuccess('');
              setInviteOpen(true);
            }}
            disabled={!canLoad}
          >
            Invite User
          </button>
        }
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Sign in and select an organization to manage users.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading users...
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

      {canLoad && !loading && users.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No users are assigned to {activeOrganization?.name ?? 'this organization'}.
        </div>
      ) : null}

      {canLoad && !loading && users.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const rowBusy = busyUserId === user.userId;
                    return (
                      <tr key={user.membershipId} className="border-t border-zinc-200">
                        <td className="px-4 py-3 text-zinc-900">{user.name || '-'}</td>
                        <td className="px-4 py-3 text-zinc-700">{user.email}</td>
                        <td className="px-4 py-3 text-zinc-700">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className={statusPill(user.status)}>{user.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                              onClick={() => {
                                setSuccess('');
                                setEditTarget(user);
                              }}
                              disabled={rowBusy}
                            >
                              Edit User
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                              onClick={() => {
                                void handleStatusToggle(user);
                              }}
                              disabled={rowBusy}
                            >
                              {user.status === 'Active' ? 'Disable User' : 'Enable User'}
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                              onClick={() => {
                                setSuccess('');
                                setDeleteTarget(user);
                              }}
                              disabled={rowBusy}
                            >
                              Delete User
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
            {users.map((user) => {
              const rowBusy = busyUserId === user.userId;

              return (
                <article
                  key={user.membershipId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{user.name || '-'}</p>
                      <p className="text-sm text-zinc-600">{user.email}</p>
                    </div>
                    <span className={statusPill(user.status)}>{user.status}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                    {user.role}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      onClick={() => {
                        setSuccess('');
                        setEditTarget(user);
                      }}
                      disabled={rowBusy}
                    >
                      Edit User
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                      onClick={() => {
                        void handleStatusToggle(user);
                      }}
                      disabled={rowBusy}
                    >
                      {user.status === 'Active' ? 'Disable User' : 'Enable User'}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                      onClick={() => {
                        setSuccess('');
                        setDeleteTarget(user);
                      }}
                      disabled={rowBusy}
                    >
                      Delete User
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <InviteUserDialog
        open={isInviteOpen}
        busy={busyAction === 'invite'}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <EditUserDialog
        key={editTarget?.userId ?? 'edit-none'}
        open={Boolean(editTarget)}
        busy={busyAction === 'edit'}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDeleteUserDialog
        open={Boolean(deleteTarget)}
        busy={busyAction === 'delete'}
        userName={deleteTarget?.name || deleteTarget?.email || 'this user'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

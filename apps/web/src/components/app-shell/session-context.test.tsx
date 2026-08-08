import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser, WorkspaceOrganization } from '../../lib/auth-api';
import { SESSION_STORAGE_KEY } from '../../lib/session-storage';
import { AppSessionProvider, useAppSession } from './session-context';

const getWorkspaceContext = vi.fn();

vi.mock('../../lib/auth-api', () => ({
  ApiRequestError: class ApiRequestError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  getWorkspaceContext: (...args: unknown[]) => getWorkspaceContext(...args),
}));

function TestProbe({
  onModuleLoad,
}: {
  onModuleLoad?: (organizationId: string) => void;
}) {
  const {
    session,
    user,
    organizations,
    activeOrganization,
    metaError,
    isAuthenticated,
    logout,
  } = useAppSession();

  useEffect(() => {
    if (!onModuleLoad) {
      return;
    }

    if (session.token && session.organizationId) {
      onModuleLoad(session.organizationId);
    }
  }, [onModuleLoad, session.organizationId, session.token]);

  return (
    <div>
      <div data-testid="token">{session.token}</div>
      <div data-testid="organization-id">{session.organizationId}</div>
      <div data-testid="user-name">{user?.name ?? 'none'}</div>
      <div data-testid="user-email">{user?.email ?? 'none'}</div>
      <div data-testid="active-organization">{activeOrganization?.name ?? 'none'}</div>
      <div data-testid="organization-count">{organizations.length}</div>
      <div data-testid="meta-error">{metaError || 'none'}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function storeSnapshot(params: {
  token?: string;
  organizationId?: string;
  user?: AuthUser | null;
  organizations?: WorkspaceOrganization[];
}) {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      baseUrl: 'http://localhost:3001',
      token: params.token ?? '',
      organizationId: params.organizationId ?? '',
      user: params.user ?? null,
      organizations: params.organizations ?? [],
    }),
  );
}

describe('AppSessionProvider persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getWorkspaceContext.mockReset();
  });

  it('restores session, user, and organization display info after refresh', async () => {
    getWorkspaceContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    storeSnapshot({
      token: 'token-refresh',
      organizationId: 'org-1',
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    render(
      <AppSessionProvider>
        <TestProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe(
        'Demo Administrator',
      );
      expect(screen.getByTestId('active-organization').textContent).toBe(
        'EventOS Demo Organization',
      );
    });

    await waitFor(() => {
      expect(getWorkspaceContext).toHaveBeenCalledWith(
        'http://localhost:3001',
        'token-refresh',
      );
    });
  });

  it('restores session again after app-shell remount', async () => {
    getWorkspaceContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    storeSnapshot({
      token: 'token-remount',
      organizationId: 'org-1',
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    const firstRender = render(
      <AppSessionProvider>
        <TestProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    firstRender.unmount();

    render(
      <AppSessionProvider>
        <TestProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe(
        'Demo Administrator',
      );
      expect(screen.getByTestId('organization-id').textContent).toBe('org-1');
    });
  });

  it('keeps session and cached user during temporary API failure', async () => {
    getWorkspaceContext.mockRejectedValue(new Error('Failed to fetch'));

    storeSnapshot({
      token: 'token-failure',
      organizationId: 'org-1',
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    render(
      <AppSessionProvider>
        <TestProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('meta-error').textContent).toContain('Failed to fetch');
    });

    expect(screen.getByTestId('user-name').textContent).toBe('Demo Administrator');
    expect(screen.getByTestId('organization-id').textContent).toBe('org-1');

    const stored = JSON.parse(
      window.localStorage.getItem(SESSION_STORAGE_KEY) ?? '{}',
    ) as { token?: string; organizationId?: string };

    expect(stored.token).toBe('token-failure');
    expect(stored.organizationId).toBe('org-1');
  });

  it('clears session only on explicit logout', async () => {
    getWorkspaceContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    storeSnapshot({
      token: 'token-logout',
      organizationId: 'org-1',
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    render(
      <AppSessionProvider>
        <TestProbe />
      </AppSessionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('organization-id').textContent).toBe('');

    const stored = JSON.parse(
      window.localStorage.getItem(SESSION_STORAGE_KEY) ?? '{}',
    ) as { token?: string; organizationId?: string };

    expect(stored.token).toBe('');
    expect(stored.organizationId).toBe('');
  });

  it('restores organization id before module data loading starts', async () => {
    const onModuleLoad = vi.fn();

    getWorkspaceContext.mockImplementation(
      () =>
        new Promise(() => {
          // Keep unresolved to prove module can start with restored organization.
        }),
    );

    storeSnapshot({
      token: 'token-module',
      organizationId: 'org-1',
      user: {
        id: 'user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      organizations: [
        {
          id: 'org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
    });

    render(
      <AppSessionProvider>
        <TestProbe onModuleLoad={onModuleLoad} />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(onModuleLoad).toHaveBeenCalledWith('org-1');
    });

    expect(screen.getByTestId('active-organization').textContent).toBe(
      'EventOS Demo Organization',
    );
  });
});

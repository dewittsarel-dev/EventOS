'use client';

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiRequestError,
  getWorkspaceContext,
  type AuthUser,
  type WorkspaceOrganization,
} from '../../lib/auth-api';
import {
  clearSessionSnapshot,
  readSessionSnapshot,
  type SessionValues,
  writeSessionSnapshot,
} from '../../lib/session-storage';

type UserProfile = AuthUser;

type OrganizationRecord = WorkspaceOrganization;

type SessionContextValue = {
  session: SessionValues;
  setSession: (next: SessionValues) => void;
  user: UserProfile | null;
  organizations: OrganizationRecord[];
  activeOrganization: OrganizationRecord | null;
  loadingMeta: boolean;
  metaError: string;
  isAuthenticated: boolean;
  isSessionHydrated: boolean;
  logout: () => void;
  setOrganizationId: (organizationId: string) => void;
};

const defaultSession: SessionValues = {
  baseUrl: 'http://localhost:3001',
  token: '',
  organizationId: '',
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function decodeBase64Url(value: string) {
  if (typeof globalThis.atob !== 'function') {
    return null;
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );

  return globalThis.atob(padded);
}

function isTokenExpired(token: string) {
  if (!token) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length < 2) {
    return false;
  }

  try {
    const payload = decodeBase64Url(parts[1]);

    if (!payload) {
      return false;
    }

    const parsed = JSON.parse(payload) as { exp?: number };

    if (typeof parsed.exp !== 'number') {
      return false;
    }

    return parsed.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionValues>(defaultSession);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [reloadAttempt, setReloadAttempt] = useState(0);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      const initialSnapshot = readSessionSnapshot();
      const initialTokenExpired = isTokenExpired(initialSnapshot.token);

      setSessionState({
        baseUrl: initialSnapshot.baseUrl || defaultSession.baseUrl,
        token: initialTokenExpired ? '' : initialSnapshot.token,
        organizationId: initialTokenExpired ? '' : initialSnapshot.organizationId,
      });
      setUser(initialTokenExpired ? null : initialSnapshot.user);
      setOrganizations(initialTokenExpired ? [] : initialSnapshot.organizations);
      setIsSessionHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(hydrateTimer);
    };
  }, []);

  const persistSessionSnapshot = useCallback(
    (
      nextSession: SessionValues,
      nextUser: UserProfile | null,
      nextOrganizations: OrganizationRecord[],
    ) => {
      writeSessionSnapshot({
        baseUrl: nextSession.baseUrl,
        token: nextSession.token,
        organizationId: nextSession.organizationId,
        user: nextUser,
        organizations: nextOrganizations,
      });
    },
    [],
  );

  const setSession = useCallback((next: SessionValues) => {
    const normalizedNext = {
      ...next,
      baseUrl: normalizeBaseUrl(next.baseUrl || defaultSession.baseUrl),
    };

    setSessionState(normalizedNext);
    persistSessionSnapshot(normalizedNext, user, organizations);
  }, [organizations, persistSessionSnapshot, user]);

  const logout = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      token: '',
      organizationId: '',
    }));
    setUser(null);
    setOrganizations([]);
    setMetaError('');
    clearSessionSnapshot(session.baseUrl || defaultSession.baseUrl);
  }, [session.baseUrl]);

  const clearSessionForInvalidAuth = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      token: '',
      organizationId: '',
    }));
    setUser(null);
    setOrganizations([]);
    clearSessionSnapshot(session.baseUrl || defaultSession.baseUrl);
  }, [session.baseUrl]);

  const setOrganizationId = useCallback((organizationId: string) => {
    setSessionState((prev) => {
      const next = {
        ...prev,
        organizationId,
      };
      persistSessionSnapshot(next, user, organizations);
      return next;
    });
  }, [organizations, persistSessionSnapshot, user]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadMeta() {
      if (!isSessionHydrated) {
        return;
      }

      if (!session.token) {
        setUser(null);
        setOrganizations([]);
        setMetaError('');
        return;
      }

      if (isTokenExpired(session.token)) {
        setUser(null);
        setOrganizations([]);
        setMetaError('Session expired. Please sign in again.');
        clearSessionForInvalidAuth();
        return;
      }

      setLoadingMeta(true);
      setMetaError('');

      try {
        const workspace = await getWorkspaceContext(
          normalizeBaseUrl(session.baseUrl),
          session.token,
        );
        const meBody: UserProfile = workspace.user as AuthUser;
        const organizationItems = workspace.organizations ?? [];
        const hasSelectedOrganization = organizationItems.some(
          (organization) => organization.id === session.organizationId,
        );
        const nextOrganizationId = hasSelectedOrganization
          ? session.organizationId
          : (organizationItems[0]?.id ?? '');

        if (!cancelled) {
          setUser(meBody);
          setOrganizations(organizationItems);

          if (nextOrganizationId !== session.organizationId) {
            setSessionState((prev) => {
              const next = {
                ...prev,
                organizationId: nextOrganizationId,
              };
              persistSessionSnapshot(next, meBody, organizationItems);
              return next;
            });
          } else {
            persistSessionSnapshot(session, meBody, organizationItems);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMetaError(
            error instanceof Error
              ? error.message
              : 'Failed to load workspace metadata.',
          );

          if (error instanceof ApiRequestError && error.status === 401) {
            clearSessionForInvalidAuth();
            return;
          }

          retryTimer = setTimeout(() => {
            setReloadAttempt((attempt) => attempt + 1);
          }, 1500);
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    }

    void loadMeta();

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [
    clearSessionForInvalidAuth,
    isSessionHydrated,
    persistSessionSnapshot,
    reloadAttempt,
    session,
    session.baseUrl,
    session.organizationId,
    session.token,
  ]);

  const activeOrganization = useMemo(() => {
    if (!session.organizationId) {
      return null;
    }

    return (
      organizations.find(
        (organization) => organization.id === session.organizationId,
      ) ?? null
    );
  }, [organizations, session.organizationId]);

  const isAuthenticated =
    Boolean(session.token) && !isTokenExpired(session.token);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession,
      user,
      organizations,
      activeOrganization,
      loadingMeta,
      metaError,
      isAuthenticated,
      isSessionHydrated,
      logout,
      setOrganizationId,
    }),
    [
      activeOrganization,
      isAuthenticated,
      isSessionHydrated,
      loadingMeta,
      metaError,
      organizations,
      logout,
      session,
      setOrganizationId,
      setSession,
      user,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }

  return context;
}

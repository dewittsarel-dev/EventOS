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
import { getWorkspaceContext, type AuthUser, type WorkspaceOrganization } from '../../lib/auth-api';

type SessionValues = {
  baseUrl: string;
  token: string;
  organizationId: string;
};

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
  updatedAt?: string;
};

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
  logout: () => void;
  setOrganizationId: (organizationId: string) => void;
};

const STORAGE_KEY = 'eventos.events.session';

const defaultSession: SessionValues = {
  baseUrl: 'http://localhost:3001',
  token: '',
  organizationId: '',
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return defaultSession;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return defaultSession;
  }

  try {
    const parsed = JSON.parse(stored) as SessionValues;

    return {
      baseUrl: parsed.baseUrl || defaultSession.baseUrl,
      token: parsed.token || '',
      organizationId: parsed.organizationId || '',
    };
  } catch {
    return defaultSession;
  }
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionValues>(() => readStoredSession());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState('');

  const setSession = useCallback((next: SessionValues) => {
    const normalizedNext = {
      ...next,
      baseUrl: normalizeBaseUrl(next.baseUrl || defaultSession.baseUrl),
    };

    setSessionState(normalizedNext);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedNext));
  }, []);

  const logout = useCallback(() => {
    setSessionState((prev) => {
      const next = {
        ...prev,
        token: '',
        organizationId: '',
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setUser(null);
    setOrganizations([]);
    setMetaError('');
  }, []);

  const setOrganizationId = useCallback((organizationId: string) => {
    setSessionState((prev) => {
      const next = {
        ...prev,
        organizationId,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      if (!session.token) {
        setUser(null);
        setOrganizations([]);
        setMetaError('');
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

              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMetaError(
            error instanceof Error
              ? error.message
              : 'Failed to load workspace metadata.',
          );
          setUser(null);
          setOrganizations([]);

          const message = error instanceof Error ? error.message : '';
          if (message.toLowerCase().includes('401')) {
            setSessionState((prev) => {
              const next = {
                ...prev,
                token: '',
                organizationId: '',
              };
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
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
    };
  }, [session.baseUrl, session.organizationId, session.token]);

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

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession,
      user,
      organizations,
      activeOrganization,
      loadingMeta,
      metaError,
      isAuthenticated: Boolean(session.token),
      logout,
      setOrganizationId,
    }),
    [
      activeOrganization,
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

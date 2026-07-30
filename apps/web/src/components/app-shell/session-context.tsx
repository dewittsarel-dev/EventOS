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

type SessionValues = {
  baseUrl: string;
  token: string;
  organizationId: string;
};

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
};

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationListResponse = {
  data: OrganizationRecord[];
};

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
    setSessionState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        };

        const [meResponse, orgResponse] = await Promise.all([
          fetch(`${normalizeBaseUrl(session.baseUrl)}/auth/me`, {
            headers,
            cache: 'no-store',
          }),
          fetch(
            `${normalizeBaseUrl(session.baseUrl)}/organizations?page=1&limit=100`,
            {
              headers,
              cache: 'no-store',
            },
          ),
        ]);

        if (!meResponse.ok) {
          throw new Error('Failed to load user profile from access token.');
        }

        const meBody = (await meResponse.json()) as UserProfile;

        let organizationItems: OrganizationRecord[] = [];

        if (orgResponse.ok) {
          const organizationsBody =
            (await orgResponse.json()) as OrganizationListResponse;
          organizationItems = organizationsBody.data ?? [];
        }

        if (!cancelled) {
          setUser(meBody);
          setOrganizations(organizationItems);
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
  }, [session.baseUrl, session.token]);

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

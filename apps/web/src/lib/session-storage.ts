import type { AuthUser, WorkspaceOrganization } from './auth-api';

export type SessionValues = {
  baseUrl: string;
  token: string;
  organizationId: string;
};

export type SessionSnapshot = SessionValues & {
  user: AuthUser | null;
  organizations: WorkspaceOrganization[];
};

export const SESSION_STORAGE_KEY = 'eventos.workspace.session.v1';

const LEGACY_SESSION_KEYS = ['eventos.events.session', 'eventos.app-session'] as const;

const DEFAULT_BASE_URL = 'http://localhost:3001';

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function defaultSnapshot(): SessionSnapshot {
  return {
    baseUrl: DEFAULT_BASE_URL,
    token: '',
    organizationId: '',
    user: null,
    organizations: [],
  };
}

function parseStoredSnapshot(raw: string): SessionSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    const organizations = Array.isArray(parsed.organizations)
      ? parsed.organizations.filter(
          (organization): organization is WorkspaceOrganization =>
            Boolean(
              organization &&
                typeof organization.id === 'string' &&
                typeof organization.name === 'string' &&
                typeof organization.slug === 'string',
            ),
        )
      : [];

    const user =
      parsed.user &&
      typeof parsed.user.id === 'string' &&
      typeof parsed.user.email === 'string' &&
      (typeof parsed.user.name === 'string' || parsed.user.name === null)
        ? parsed.user
        : null;

    return {
      baseUrl:
        typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim().length > 0
          ? normalizeBaseUrl(parsed.baseUrl.trim())
          : DEFAULT_BASE_URL,
      token: typeof parsed.token === 'string' ? parsed.token : '',
      organizationId:
        typeof parsed.organizationId === 'string' ? parsed.organizationId : '',
      user,
      organizations,
    };
  } catch {
    return null;
  }
}

function parseLegacySession(raw: string): SessionSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SessionValues>;

    return {
      baseUrl:
        typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim().length > 0
          ? normalizeBaseUrl(parsed.baseUrl.trim())
          : DEFAULT_BASE_URL,
      token: typeof parsed.token === 'string' ? parsed.token : '',
      organizationId:
        typeof parsed.organizationId === 'string' ? parsed.organizationId : '',
      user: null,
      organizations: [],
    };
  } catch {
    return null;
  }
}

export function readSessionSnapshot(): SessionSnapshot {
  if (typeof window === 'undefined') {
    return defaultSnapshot();
  }

  const current = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (current) {
    const parsedCurrent = parseStoredSnapshot(current);
    if (parsedCurrent) {
      return parsedCurrent;
    }
  }

  for (const legacyKey of LEGACY_SESSION_KEYS) {
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw) {
      continue;
    }

    const parsedLegacy = parseLegacySession(raw);
    if (!parsedLegacy) {
      continue;
    }

    writeSessionSnapshot(parsedLegacy);
    return parsedLegacy;
  }

  return defaultSnapshot();
}

export function writeSessionSnapshot(snapshot: SessionSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedSnapshot: SessionSnapshot = {
    ...snapshot,
    baseUrl: normalizeBaseUrl(snapshot.baseUrl || DEFAULT_BASE_URL),
    token: snapshot.token || '',
    organizationId: snapshot.organizationId || '',
    user: snapshot.user ?? null,
    organizations: Array.isArray(snapshot.organizations)
      ? snapshot.organizations
      : [],
  };

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(normalizedSnapshot),
  );
}

export function clearSessionSnapshot(baseUrl = DEFAULT_BASE_URL) {
  writeSessionSnapshot({
    ...defaultSnapshot(),
    baseUrl: normalizeBaseUrl(baseUrl),
  });
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type WorkspaceContextResponse = {
  user: AuthUser;
  organizations: WorkspaceOrganization[];
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function apiRequest<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function loginWithPassword(
  baseUrl: string,
  payload: { email: string; password: string },
) {
  return apiRequest<LoginResponse>(baseUrl, '/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getWorkspaceContext(baseUrl: string, token: string) {
  return apiRequest<WorkspaceContextResponse>(baseUrl, '/auth/workspace', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

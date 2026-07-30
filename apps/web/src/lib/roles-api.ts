import type {
  CreateRolePayload,
  RoleListResponse,
  RoleRecord,
  UpdateRolePayload,
} from './roles-types';

type RequestOptions = {
  token: string;
  baseUrl: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
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

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function withOrganizationId(path: string, organizationId: string) {
  const params = new URLSearchParams();
  params.set('organizationId', organizationId);
  return `${path}?${params.toString()}`;
}

export function listRoles(options: RequestOptions, organizationId: string) {
  return apiRequest<RoleListResponse>(withOrganizationId('/roles', organizationId), options);
}

export function getRole(options: RequestOptions, organizationId: string, roleId: string) {
  return apiRequest<RoleRecord>(
    withOrganizationId(`/roles/${roleId}`, organizationId),
    options,
  );
}

export function createRole(
  options: RequestOptions,
  organizationId: string,
  payload: CreateRolePayload,
) {
  return apiRequest<RoleRecord>(withOrganizationId('/roles', organizationId), options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRole(
  options: RequestOptions,
  organizationId: string,
  roleId: string,
  payload: UpdateRolePayload,
) {
  return apiRequest<RoleRecord>(
    withOrganizationId(`/roles/${roleId}`, organizationId),
    options,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteRole(options: RequestOptions, organizationId: string, roleId: string) {
  return apiRequest<void>(withOrganizationId(`/roles/${roleId}`, organizationId), options, {
    method: 'DELETE',
  });
}

import type {
  InviteOrganizationUserPayload,
  OrganizationUserListResponse,
  OrganizationUserRecord,
  UpdateOrganizationUserPayload,
} from './organization-users-types';

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

export function listOrganizationUsers(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<OrganizationUserListResponse>(
    withOrganizationId('/organization/users', organizationId),
    options,
  );
}

export function inviteOrganizationUser(
  options: RequestOptions,
  organizationId: string,
  payload: InviteOrganizationUserPayload,
) {
  return apiRequest<OrganizationUserRecord>(
    withOrganizationId('/organization/users', organizationId),
    options,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function updateOrganizationUser(
  options: RequestOptions,
  organizationId: string,
  userId: string,
  payload: UpdateOrganizationUserPayload,
) {
  return apiRequest<OrganizationUserRecord>(
    withOrganizationId(`/organization/users/${userId}`, organizationId),
    options,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function disableOrganizationUser(
  options: RequestOptions,
  organizationId: string,
  userId: string,
) {
  return apiRequest<OrganizationUserRecord>(
    withOrganizationId(`/organization/users/${userId}/disable`, organizationId),
    options,
    {
      method: 'PATCH',
    },
  );
}

export function enableOrganizationUser(
  options: RequestOptions,
  organizationId: string,
  userId: string,
) {
  return apiRequest<OrganizationUserRecord>(
    withOrganizationId(`/organization/users/${userId}/enable`, organizationId),
    options,
    {
      method: 'PATCH',
    },
  );
}

export function deleteOrganizationUser(
  options: RequestOptions,
  organizationId: string,
  userId: string,
) {
  return apiRequest<void>(
    withOrganizationId(`/organization/users/${userId}`, organizationId),
    options,
    {
      method: 'DELETE',
    },
  );
}

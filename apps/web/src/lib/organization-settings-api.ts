import type {
  OrganizationSettingsRecord,
  UpdateOrganizationLogoPayload,
  UpdateOrganizationSettingsPayload,
} from './organization-settings-types';

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

export function getOrganizationSettings(
  options: RequestOptions,
  organizationId: string,
) {
  const params = new URLSearchParams();
  params.set('organizationId', organizationId);

  return apiRequest<OrganizationSettingsRecord>(
    `/organization?${params.toString()}`,
    options,
  );
}

export function updateOrganizationSettings(
  options: RequestOptions,
  organizationId: string,
  payload: UpdateOrganizationSettingsPayload,
) {
  const params = new URLSearchParams();
  params.set('organizationId', organizationId);

  return apiRequest<OrganizationSettingsRecord>(
    `/organization?${params.toString()}`,
    options,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export function updateOrganizationLogo(
  options: RequestOptions,
  organizationId: string,
  payload: UpdateOrganizationLogoPayload,
) {
  const params = new URLSearchParams();
  params.set('organizationId', organizationId);

  return apiRequest<OrganizationSettingsRecord>(
    `/organization/logo?${params.toString()}`,
    options,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

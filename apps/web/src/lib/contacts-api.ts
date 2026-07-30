import type {
  ContactListResponse,
  ContactRecord,
  CreateContactPayload,
} from './contacts-types';

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

  return (await response.json()) as T;
}

export async function listContacts(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<ContactListResponse>(
    `/contacts?organizationId=${organizationId}`,
    options,
  );
}

export async function createContact(
  options: RequestOptions,
  payload: CreateContactPayload,
) {
  return apiRequest<ContactRecord>('/contacts', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

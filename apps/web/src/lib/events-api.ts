import type {
  ContactListResponse,
  EventListResponse,
  EventPayload,
  EventRecord,
  EventStatus,
  OrganizationUserListResponse,
} from './events-types';

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
      // Keep default message when body parsing fails.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listEvents(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    assignedUserId?: string;
    status?: EventStatus | 'ALL';
    sort?: 'asc' | 'desc';
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.eventType) {
    query.set('eventType', params.eventType);
  }

  if (params.assignedUserId) {
    query.set('assignedUserId', params.assignedUserId);
  }

  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.sort) {
    query.set('sort', params.sort);
  }

  return apiRequest<EventListResponse>(`/events?${query.toString()}`, options);
}

export async function getEvent(options: RequestOptions, id: string) {
  return apiRequest<EventRecord>(`/events/${id}`, options);
}

export async function createEvent(options: RequestOptions, payload: EventPayload) {
  return apiRequest<EventRecord>('/events', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(
  options: RequestOptions,
  id: string,
  payload: Partial<EventPayload>,
) {
  return apiRequest<EventRecord>(`/events/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(options: RequestOptions, id: string) {
  await apiRequest<void>(`/events/${id}`, options, {
    method: 'DELETE',
  });
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

export async function listOrganizationUsers(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<OrganizationUserListResponse>(
    `/organization/users?organizationId=${organizationId}`,
    options,
  );
}

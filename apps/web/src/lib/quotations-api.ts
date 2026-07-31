import type {
  ContactListResponse,
  CreateQuotationPayload,
  EventListResponse,
  QuotationListResponse,
  QuotationRecord,
  QuotationStatus,
  UpdateQuotationPayload,
} from './quotations-types';

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

export async function listQuotations(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: QuotationStatus | 'ALL';
    contactId?: string;
    eventId?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'totalCents' | 'quoteNumber';
    sort?: 'asc' | 'desc';
    includeArchived?: boolean;
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

  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.contactId) {
    query.set('contactId', params.contactId);
  }

  if (params.eventId) {
    query.set('eventId', params.eventId);
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  if (params.sort) {
    query.set('sort', params.sort);
  }

  if (params.includeArchived !== undefined) {
    query.set('includeArchived', String(params.includeArchived));
  }

  return apiRequest<QuotationListResponse>(
    `/quotations?${query.toString()}`,
    options,
  );
}

export async function getQuotation(options: RequestOptions, id: string) {
  return apiRequest<QuotationRecord>(`/quotations/${id}`, options);
}

export async function createQuotation(
  options: RequestOptions,
  payload: CreateQuotationPayload,
) {
  return apiRequest<QuotationRecord>('/quotations', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateQuotation(
  options: RequestOptions,
  id: string,
  payload: UpdateQuotationPayload,
) {
  return apiRequest<QuotationRecord>(`/quotations/${id}`, options, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateQuotationStatus(
  options: RequestOptions,
  id: string,
  status: QuotationStatus,
) {
  return apiRequest<QuotationRecord>(`/quotations/${id}/status`, options, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function archiveQuotation(options: RequestOptions, id: string) {
  await apiRequest<void>(`/quotations/${id}/archive`, options, {
    method: 'PATCH',
  });
}

export async function deleteQuotation(options: RequestOptions, id: string) {
  await apiRequest<void>(`/quotations/${id}`, options, {
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

export async function listEvents(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<EventListResponse>(
    `/events?organizationId=${organizationId}&page=1&limit=100`,
    options,
  );
}

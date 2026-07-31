import type {
  SupplierListResponse,
  SupplierPayload,
  SupplierRecord,
  SupplierSortBy,
  SupplierUpdatePayload,
} from './suppliers-types';

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

export async function listSuppliers(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    preferredSupplier?: boolean;
    active?: boolean;
    sortBy?: SupplierSortBy;
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

  if (params.category && params.category !== 'ALL') {
    query.set('category', params.category);
  }

  if (params.preferredSupplier !== undefined) {
    query.set('preferredSupplier', String(params.preferredSupplier));
  }

  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  return apiRequest<SupplierListResponse>(`/suppliers?${query.toString()}`, options);
}

export async function getSupplier(options: RequestOptions, id: string) {
  return apiRequest<SupplierRecord>(`/suppliers/${id}`, options);
}

export async function createSupplier(
  options: RequestOptions,
  payload: SupplierPayload,
) {
  return apiRequest<SupplierRecord>('/suppliers', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(
  options: RequestOptions,
  id: string,
  payload: SupplierUpdatePayload,
) {
  return apiRequest<SupplierRecord>(`/suppliers/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSupplier(options: RequestOptions, id: string) {
  await apiRequest<void>(`/suppliers/${id}`, options, {
    method: 'DELETE',
  });
}

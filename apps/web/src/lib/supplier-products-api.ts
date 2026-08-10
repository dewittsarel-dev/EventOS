import type {
  SupplierProductListResponse,
  SupplierProductPayload,
  SupplierProductRecord,
  SupplierProductSortBy,
  SupplierProductUpdatePayload,
} from './supplier-products-types';

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

export async function listSupplierProducts(
  options: RequestOptions,
  params: {
    organizationId: string;
    supplierId: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    active?: boolean;
    sortBy?: SupplierProductSortBy;
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

  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  return apiRequest<SupplierProductListResponse>(
    `/suppliers/${params.supplierId}/products?${query.toString()}`,
    options,
  );
}

export async function getSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
) {
  return apiRequest<SupplierProductRecord>(
    `/suppliers/${supplierId}/products/${productId}?organizationId=${organizationId}`,
    options,
  );
}

export async function createSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  payload: SupplierProductPayload,
) {
  return apiRequest<SupplierProductRecord>(`/suppliers/${supplierId}/products`, options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
  payload: SupplierProductUpdatePayload,
) {
  return apiRequest<SupplierProductRecord>(
    `/suppliers/${supplierId}/products/${productId}?organizationId=${organizationId}`,
    options,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function archiveSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
) {
  return apiRequest<SupplierProductRecord>(
    `/suppliers/${supplierId}/products/${productId}/archive?organizationId=${organizationId}`,
    options,
    {
      method: 'PATCH',
    },
  );
}

export async function restoreSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
) {
  return apiRequest<SupplierProductRecord>(
    `/suppliers/${supplierId}/products/${productId}/restore?organizationId=${organizationId}`,
    options,
    {
      method: 'PATCH',
    },
  );
}

async function productWorkflowAction(
  action: 'submit-review' | 'publish' | 'withdraw',
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
) {
  return apiRequest<SupplierProductRecord>(
    `/suppliers/${supplierId}/products/${productId}/${action}?organizationId=${organizationId}`,
    options,
    { method: 'PATCH' },
  );
}

export function submitSupplierProductForReview(options: RequestOptions, supplierId: string, productId: string, organizationId: string) {
  return productWorkflowAction('submit-review', options, supplierId, productId, organizationId);
}

export function publishSupplierProduct(options: RequestOptions, supplierId: string, productId: string, organizationId: string) {
  return productWorkflowAction('publish', options, supplierId, productId, organizationId);
}

export function withdrawSupplierProduct(options: RequestOptions, supplierId: string, productId: string, organizationId: string) {
  return productWorkflowAction('withdraw', options, supplierId, productId, organizationId);
}

export async function deleteSupplierProduct(
  options: RequestOptions,
  supplierId: string,
  productId: string,
  organizationId: string,
) {
  await apiRequest<void>(
    `/suppliers/${supplierId}/products/${productId}?organizationId=${organizationId}`,
    options,
    {
      method: 'DELETE',
    },
  );
}

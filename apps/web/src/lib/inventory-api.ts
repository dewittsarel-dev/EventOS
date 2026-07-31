import type {
  CreateInventoryCategoryPayload,
  CreateInventoryItemPayload,
  CreateOpeningBalancePayload,
  CreateStockAdjustmentPayload,
  CreateStockTransferPayload,
  CreateStorageLocationPayload,
  InventoryCategoryRecord,
  InventoryItemRecord,
  InventoryOverview,
  InventorySortBy,
  PagedResponse,
  StockLevelRecord,
  StockMovementRecord,
  StorageLocationRecord,
  StockMovementType,
  UpdateInventoryCategoryPayload,
  UpdateInventoryItemPayload,
  UpdateStorageLocationPayload,
  InventoryItemType,
} from './inventory-types';

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

export async function getInventoryOverview(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<InventoryOverview>(
    `/inventory/overview?organizationId=${organizationId}`,
    options,
  );
}

export async function listInventoryCategories(
  options: RequestOptions,
  params: {
    organizationId: string;
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  return apiRequest<PagedResponse<InventoryCategoryRecord>>(
    `/inventory/categories?${query.toString()}`,
    options,
  );
}

export async function createInventoryCategory(
  options: RequestOptions,
  payload: CreateInventoryCategoryPayload,
) {
  return apiRequest<InventoryCategoryRecord>('/inventory/categories', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryCategory(
  options: RequestOptions,
  id: string,
  payload: UpdateInventoryCategoryPayload,
) {
  return apiRequest<InventoryCategoryRecord>(`/inventory/categories/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteInventoryCategory(options: RequestOptions, id: string) {
  await apiRequest<void>(`/inventory/categories/${id}`, options, {
    method: 'DELETE',
  });
}

export async function listStorageLocations(
  options: RequestOptions,
  params: {
    organizationId: string;
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  return apiRequest<PagedResponse<StorageLocationRecord>>(
    `/inventory/locations?${query.toString()}`,
    options,
  );
}

export async function getStorageLocation(options: RequestOptions, id: string) {
  return apiRequest<StorageLocationRecord>(`/inventory/locations/${id}`, options);
}

export async function createStorageLocation(
  options: RequestOptions,
  payload: CreateStorageLocationPayload,
) {
  return apiRequest<StorageLocationRecord>('/inventory/locations', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStorageLocation(
  options: RequestOptions,
  id: string,
  payload: UpdateStorageLocationPayload,
) {
  return apiRequest<StorageLocationRecord>(`/inventory/locations/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteStorageLocation(options: RequestOptions, id: string) {
  await apiRequest<void>(`/inventory/locations/${id}`, options, {
    method: 'DELETE',
  });
}

export async function listInventoryItems(
  options: RequestOptions,
  params: {
    organizationId: string;
    search?: string;
    categoryId?: string;
    itemType?: InventoryItemType;
    active?: boolean;
    preferredSupplierId?: string;
    lowStockOnly?: boolean;
    sortBy?: InventorySortBy;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.categoryId && params.categoryId !== 'ALL') {
    query.set('categoryId', params.categoryId);
  }

  if (params.itemType) {
    query.set('itemType', params.itemType);
  }

  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  if (params.preferredSupplierId && params.preferredSupplierId !== 'ALL') {
    query.set('preferredSupplierId', params.preferredSupplierId);
  }

  if (params.lowStockOnly !== undefined) {
    query.set('lowStockOnly', String(params.lowStockOnly));
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  return apiRequest<PagedResponse<InventoryItemRecord>>(
    `/inventory/items?${query.toString()}`,
    options,
  );
}

export async function getInventoryItem(options: RequestOptions, id: string) {
  return apiRequest<InventoryItemRecord>(`/inventory/items/${id}`, options);
}

export async function createInventoryItem(
  options: RequestOptions,
  payload: CreateInventoryItemPayload,
) {
  return apiRequest<InventoryItemRecord>('/inventory/items', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(
  options: RequestOptions,
  id: string,
  payload: UpdateInventoryItemPayload,
) {
  return apiRequest<InventoryItemRecord>(`/inventory/items/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteInventoryItem(options: RequestOptions, id: string) {
  await apiRequest<void>(`/inventory/items/${id}`, options, {
    method: 'DELETE',
  });
}

export async function listStockLevels(
  options: RequestOptions,
  params: {
    organizationId: string;
    inventoryItemId?: string;
    storageLocationId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.inventoryItemId && params.inventoryItemId !== 'ALL') {
    query.set('inventoryItemId', params.inventoryItemId);
  }

  if (params.storageLocationId && params.storageLocationId !== 'ALL') {
    query.set('storageLocationId', params.storageLocationId);
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  return apiRequest<PagedResponse<StockLevelRecord>>(
    `/inventory/stock-levels?${query.toString()}`,
    options,
  );
}

export async function listStockMovements(
  options: RequestOptions,
  params: {
    organizationId: string;
    inventoryItemId?: string;
    storageLocationId?: string;
    movementType?: StockMovementType;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.inventoryItemId && params.inventoryItemId !== 'ALL') {
    query.set('inventoryItemId', params.inventoryItemId);
  }

  if (params.storageLocationId && params.storageLocationId !== 'ALL') {
    query.set('storageLocationId', params.storageLocationId);
  }

  if (params.movementType) {
    query.set('movementType', params.movementType);
  }

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  return apiRequest<PagedResponse<StockMovementRecord>>(
    `/inventory/movements?${query.toString()}`,
    options,
  );
}

export async function createOpeningBalance(
  options: RequestOptions,
  payload: CreateOpeningBalancePayload,
) {
  return apiRequest<StockMovementRecord>('/inventory/opening-balance', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createStockAdjustment(
  options: RequestOptions,
  payload: CreateStockAdjustmentPayload,
) {
  return apiRequest<StockMovementRecord>('/inventory/adjustments', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createStockTransfer(
  options: RequestOptions,
  payload: CreateStockTransferPayload,
) {
  return apiRequest<{
    transferOut: StockMovementRecord;
    transferIn: StockMovementRecord;
  }>('/inventory/transfers', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

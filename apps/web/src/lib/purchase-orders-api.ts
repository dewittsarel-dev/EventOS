import type {
  AIPurchaseOrderUploadDraftRecord,
  CreateAIPurchaseOrderUploadDraftPayload,
  CreateAIPurchaseOrderUploadDraftResponse,
  CreateGoodsReceiptPayload,
  CreatePurchaseOrderDraftPayload,
  CreatePurchaseOrderPayload,
  GoodsReceiptRecord,
  PagedResponse,
  PurchaseOrderDraftRecord,
  PurchaseOrderDraftReviewPayload,
  PurchaseOrderRecord,
  PurchaseOrderSortBy,
  PurchaseOrderStatus,
  SupplierPurchaseHistory,
  UpdatePurchaseOrderPayload,
} from './purchase-orders-types';

type RequestOptions = {
  token: string;
  baseUrl: string;
};

export class PurchaseOrdersApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PurchaseOrdersApiError';
    this.status = status;
  }
}

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

    throw new PurchaseOrdersApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listPurchaseOrders(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    supplierId?: string;
    status?: PurchaseOrderStatus | 'ALL';
    orderDateFrom?: string;
    orderDateTo?: string;
    expectedDeliveryFrom?: string;
    expectedDeliveryTo?: string;
    overdueOnly?: boolean;
    sortBy?: PurchaseOrderSortBy;
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

  if (params.supplierId && params.supplierId !== 'ALL') {
    query.set('supplierId', params.supplierId);
  }

  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.orderDateFrom) {
    query.set('orderDateFrom', params.orderDateFrom);
  }

  if (params.orderDateTo) {
    query.set('orderDateTo', params.orderDateTo);
  }

  if (params.expectedDeliveryFrom) {
    query.set('expectedDeliveryFrom', params.expectedDeliveryFrom);
  }

  if (params.expectedDeliveryTo) {
    query.set('expectedDeliveryTo', params.expectedDeliveryTo);
  }

  if (params.overdueOnly !== undefined) {
    query.set('overdueOnly', String(params.overdueOnly));
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  return apiRequest<PagedResponse<PurchaseOrderRecord>>(
    `/purchase-orders?${query.toString()}`,
    options,
  );
}

export async function createPurchaseOrder(
  options: RequestOptions,
  payload: CreatePurchaseOrderPayload,
) {
  return apiRequest<PurchaseOrderRecord>('/purchase-orders', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPurchaseOrderDraft(
  options: RequestOptions,
  payload: CreatePurchaseOrderDraftPayload,
) {
  const formData = new FormData();
  formData.set('organizationId', payload.organizationId);

  if (payload.sourceText) {
    formData.set('sourceText', payload.sourceText);
  }

  if (payload.sourceFile) {
    formData.set('sourceFile', payload.sourceFile);
  }

  const response = await fetch(
    `${normalizeBaseUrl(options.baseUrl)}/purchase-orders/drafts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
      body: formData,
      cache: 'no-store',
    },
  );

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

    throw new PurchaseOrdersApiError(response.status, message);
  }

  return (await response.json()) as PurchaseOrderDraftRecord;
}

export async function createAIPurchaseOrderUploadDraft(
  options: RequestOptions,
  payload: CreateAIPurchaseOrderUploadDraftPayload,
) {
  const formData = new FormData();
  formData.set('sourceFile', payload.sourceFile);

  const query = new URLSearchParams();
  query.set('organizationId', payload.organizationId);

  const response = await fetch(
    `${normalizeBaseUrl(options.baseUrl)}/purchase-orders/drafts/ai-upload?${query.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
      body: formData,
      cache: 'no-store',
    },
  );

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

    throw new PurchaseOrdersApiError(response.status, message);
  }

  return (await response.json()) as CreateAIPurchaseOrderUploadDraftResponse;
}

export async function getAIPurchaseOrderUploadDraft(
  options: RequestOptions,
  draftId: string,
) {
  return apiRequest<AIPurchaseOrderUploadDraftRecord>(
    `/purchase-orders/drafts/ai-upload/${draftId}`,
    options,
  );
}

export async function getAIPurchaseOrderUploadDocumentBlob(
  options: RequestOptions,
  draftId: string,
  documentId: string,
) {
  const response = await fetch(
    `${normalizeBaseUrl(options.baseUrl)}/purchase-orders/drafts/ai-upload/${draftId}/documents/${documentId}/content`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
      cache: 'no-store',
    },
  );

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

    throw new PurchaseOrdersApiError(response.status, message);
  }

  return response.blob();
}

export async function getPurchaseOrderDraft(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderDraftRecord>(`/purchase-orders/drafts/${id}`, options);
}

export async function updatePurchaseOrderDraftReview(
  options: RequestOptions,
  id: string,
  payload: PurchaseOrderDraftReviewPayload,
) {
  return apiRequest<PurchaseOrderDraftRecord>(`/purchase-orders/drafts/${id}`, options, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function commitPurchaseOrderDraft(
  options: RequestOptions,
  id: string,
) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/drafts/${id}/commit`, options, {
    method: 'POST',
  });
}

export async function getPurchaseOrder(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}`, options);
}

export async function updatePurchaseOrder(
  options: RequestOptions,
  id: string,
  payload: UpdatePurchaseOrderPayload,
) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}`, options, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePurchaseOrder(options: RequestOptions, id: string) {
  await apiRequest<void>(`/purchase-orders/${id}`, options, {
    method: 'DELETE',
  });
}

export async function archivePurchaseOrder(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/archive`, options, {
    method: 'PATCH',
  });
}

export async function restorePurchaseOrder(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/restore`, options, {
    method: 'PATCH',
  });
}

export async function submitPurchaseOrderForApproval(
  options: RequestOptions,
  id: string,
) {
  return apiRequest<PurchaseOrderRecord>(
    `/purchase-orders/${id}/submit-approval`,
    options,
    {
      method: 'PATCH',
    },
  );
}

export async function approvePurchaseOrder(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/approve`, options, {
    method: 'PATCH',
  });
}

export async function returnPurchaseOrderToDraft(
  options: RequestOptions,
  id: string,
) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/return-draft`, options, {
    method: 'PATCH',
  });
}

export async function markPurchaseOrderSent(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/mark-sent`, options, {
    method: 'PATCH',
  });
}

export async function cancelPurchaseOrder(options: RequestOptions, id: string) {
  return apiRequest<PurchaseOrderRecord>(`/purchase-orders/${id}/cancel`, options, {
    method: 'PATCH',
  });
}

export async function getPurchaseOrderOutstanding(
  options: RequestOptions,
  id: string,
) {
  return apiRequest<{
    purchaseOrderId: string;
    purchaseOrderNumber: string;
    status: PurchaseOrderStatus;
    lines: Array<{
      purchaseOrderLineItemId: string;
      inventoryItemId: string;
      inventoryItemName: string;
      quantityOrdered: number;
      quantityReceived: number;
      quantityOutstanding: number;
    }>;
  }>(`/purchase-orders/${id}/outstanding`, options);
}

export async function listPurchaseOrderReceipts(
  options: RequestOptions,
  id: string,
) {
  return apiRequest<GoodsReceiptRecord[]>(`/purchase-orders/${id}/receipts`, options);
}

export async function listGoodsReceipts(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    purchaseOrderId?: string;
    supplierId?: string;
    receivedDateFrom?: string;
    receivedDateTo?: string;
    search?: string;
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

  if (params.purchaseOrderId) {
    query.set('purchaseOrderId', params.purchaseOrderId);
  }

  if (params.supplierId) {
    query.set('supplierId', params.supplierId);
  }

  if (params.receivedDateFrom) {
    query.set('receivedDateFrom', params.receivedDateFrom);
  }

  if (params.receivedDateTo) {
    query.set('receivedDateTo', params.receivedDateTo);
  }

  if (params.search) {
    query.set('search', params.search);
  }

  return apiRequest<PagedResponse<GoodsReceiptRecord>>(
    `/goods-receipts?${query.toString()}`,
    options,
  );
}

export async function getGoodsReceipt(options: RequestOptions, id: string) {
  return apiRequest<GoodsReceiptRecord>(`/goods-receipts/${id}`, options);
}

export async function createGoodsReceipt(
  options: RequestOptions,
  payload: CreateGoodsReceiptPayload,
) {
  return apiRequest<GoodsReceiptRecord>('/goods-receipts', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSupplierPurchaseHistory(
  options: RequestOptions,
  organizationId: string,
  supplierId: string,
) {
  return apiRequest<SupplierPurchaseHistory>(
    `/purchase-orders/suppliers/${supplierId}/history?organizationId=${organizationId}`,
    options,
  );
}

export type ResourceRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  imageUrls: string[];
  resourceType: 'ASSET' | 'BULK_ITEM' | 'CONSUMABLE' | 'SERVICE' | 'STAFF' | 'VEHICLE' | 'VENUE';
  quantityMode: 'SERIALIZED' | 'QUANTITY' | 'CAPACITY' | 'UNLIMITED';
  sku: string | null;
  status: string;
  visibility: 'PRIVATE' | 'MARKETPLACE' | 'HIDDEN';
  unit: string;
  totalQuantity: number | null;
  condition: string;
  rentalPrice: number | null;
};

export type ResourcePayload = {
  organizationId?: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  imageUrls?: string[];
  resourceType: ResourceRecord['resourceType'];
  quantityMode: ResourceRecord['quantityMode'];
  sku?: string;
  visibility: ResourceRecord['visibility'];
  unit: string;
  totalQuantity?: number;
  rentalPrice?: number;
};

type Options = { baseUrl: string; token: string };

async function request<T>(options: Options, path: string, init?: RequestInit) {
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function createResource(options: Options, payload: ResourcePayload & { organizationId: string }) {
  return request<ResourceRecord>(options, '/resources', { method: 'POST', body: JSON.stringify(payload) });
}

export function getResource(options: Options, id: string) {
  return request<ResourceRecord>(options, `/resources/${id}`);
}

export function updateResource(options: Options, id: string, payload: Omit<ResourcePayload, 'organizationId'>) {
  return request<ResourceRecord>(options, `/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

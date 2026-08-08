import type { MarketplaceEnquiry, MarketplaceListingPage } from './marketplace-public-types';

const apiBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function listMarketplaceListings(params: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return request<MarketplaceListingPage>(`/public/marketplace/listings?${query}`);
}

export function createMarketplaceEnquiry(payload: { resourceId: string; customerName: string; customerEmail: string; customerPhone?: string; eventDate?: string; eventLocation?: string; quantity?: number; message: string }) {
  return request<{ id: string; status: string; createdAt: string; message: string }>('/public/marketplace/enquiries', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listMarketplaceEnquiries(options: { baseUrl: string; token: string; organizationId: string }) {
  const query = new URLSearchParams({ organizationId: options.organizationId });
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}/marketplace/enquiries?${query}`, {
    headers: { Authorization: `Bearer ${options.token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Marketplace inbox could not be loaded (${response.status})`);
  return response.json() as Promise<MarketplaceEnquiry[]>;
}

export async function updateMarketplaceEnquiryStatus(options: {
  baseUrl: string;
  token: string;
  organizationId: string;
  enquiryId: string;
  status: MarketplaceEnquiry['status'];
}) {
  const response = await fetch(
    `${options.baseUrl.replace(/\/$/, '')}/marketplace/enquiries/${options.enquiryId}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${options.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: options.organizationId,
        status: options.status,
      }),
    },
  );
  if (!response.ok) throw new Error(`Marketplace enquiry could not be updated (${response.status})`);
  return response.json() as Promise<{
    id: string;
    status: MarketplaceEnquiry['status'];
    updatedAt: string;
  }>;
}

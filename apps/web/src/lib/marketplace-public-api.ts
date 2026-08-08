import type { MarketplaceEnquiry, MarketplaceListing, MarketplaceListingPage, MarketplaceOpportunity } from './marketplace-public-types';

const apiBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function listMarketplaceListings(params: { search?: string; category?: string; resourceType?: string; supplier?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.resourceType) query.set('resourceType', params.resourceType);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return request<MarketplaceListingPage>(`/public/marketplace/listings?${query}`);
}

export function getMarketplaceListing(id: string) {
  return request<MarketplaceListing>(`/public/marketplace/listings/${encodeURIComponent(id)}`);
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

type PrivateMarketplaceOptions = { baseUrl: string; token: string; organizationId: string };

async function privateMarketplaceRequest<T>(options: PrivateMarketplaceOptions, path: string, init: RequestInit) {
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function createMarketplaceOpportunity(options: PrivateMarketplaceOptions, enquiryId: string) {
  return privateMarketplaceRequest<MarketplaceOpportunity>(options, `/marketplace/enquiries/${enquiryId}/opportunity`, { method: 'POST', body: JSON.stringify({ organizationId: options.organizationId }) });
}

export function updateMarketplaceOpportunity(options: PrivateMarketplaceOptions, opportunityId: string, input: { status?: MarketplaceOpportunity['status']; title?: string; eventType?: string; eventDate?: string; venue?: string; estimatedValueCents?: number; qualificationNotes?: string }) {
  return privateMarketplaceRequest<MarketplaceOpportunity>(options, `/marketplace/opportunities/${opportunityId}`, { method: 'PATCH', body: JSON.stringify({ organizationId: options.organizationId, ...input }) });
}

export function convertMarketplaceOpportunity(options: PrivateMarketplaceOptions, opportunityId: string, input: { confirmationEvidenceType: string; confirmationReference: string; title: string; eventType: string; eventDate: string; startTime: string; endTime: string; venue: string; budgetCents?: number }) {
  return privateMarketplaceRequest<{ opportunity: MarketplaceOpportunity; event: { id: string; title: string; status: string }; contact: { id: string; name: string } }>(options, `/marketplace/opportunities/${opportunityId}/convert-to-event`, { method: 'POST', body: JSON.stringify({ organizationId: options.organizationId, ...input }) });
}

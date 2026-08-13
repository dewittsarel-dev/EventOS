import type { MarketplaceCustomer, MarketplaceCustomerEnquiry, MarketplaceCustomerSession, MarketplaceEnquiry, MarketplaceEventConcept, MarketplaceEventConceptInput, MarketplaceListing, MarketplaceListingPage, MarketplaceOpportunity, MarketplaceShortlistItem } from './marketplace-public-types';

const apiBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
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

export type MarketplaceSolutionRequestInput = {
  supplierSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  requestTitle: string;
  serviceCategories: string[];
  eventType?: string;
  eventDate?: string;
  eventLocation?: string;
  guestCount?: number;
  budgetCents?: number;
  desiredOutcomes?: string[];
  scheduleNotes?: string;
  accessNotes?: string;
  attachmentUrls?: string[];
  message: string;
};

export function createMarketplaceSolutionRequest(payload: MarketplaceSolutionRequestInput) {
  return request<{ id: string; status: string; createdAt: string; message: string }>('/public/marketplace/solution-requests', { method: 'POST', body: JSON.stringify(payload) });
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

export async function updateMarketplaceEnquiryStatus(options: { baseUrl: string; token: string; organizationId: string; enquiryId: string; status: MarketplaceEnquiry['status'] }) {
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}/marketplace/enquiries/${options.enquiryId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: options.organizationId,
      status: options.status,
    }),
  });
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
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
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

export type CreateMarketplacePreliminaryQuoteInput = {
  currency?: string;
  discountCents?: number;
  deliveryFeeCents?: number;
  taxCents?: number;
  paymentTerms?: string;
  validUntil?: string;
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
    notes?: string;
  }>;
};

export function createMarketplacePreliminaryQuote(options: PrivateMarketplaceOptions, enquiryId: string, input: CreateMarketplacePreliminaryQuoteInput) {
  return privateMarketplaceRequest(options, `/marketplace/enquiries/${enquiryId}/preliminary-quotes`, {
    method: 'POST',
    body: JSON.stringify({ organizationId: options.organizationId, ...input }),
  });
}

export function sendMarketplacePreliminaryQuote(options: PrivateMarketplaceOptions, enquiryId: string, quoteId: string) {
  return privateMarketplaceRequest(options, `/marketplace/enquiries/${enquiryId}/preliminary-quotes/${quoteId}/send`, {
    method: 'POST',
    body: JSON.stringify({ organizationId: options.organizationId }),
  });
}

const customerRequest = <T>(token: string, path: string, init?: RequestInit) => request<T>(`/public/marketplace/customer${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
export const registerMarketplaceCustomer = (input: { email: string; password: string; name: string; phone?: string }) => request<MarketplaceCustomerSession>('/public/marketplace/customer/register', { method: 'POST', body: JSON.stringify(input) });
export const loginMarketplaceCustomer = (input: { email: string; password: string }) => request<MarketplaceCustomerSession>('/public/marketplace/customer/login', { method: 'POST', body: JSON.stringify(input) });
export const getMarketplaceCustomer = (token: string) => customerRequest<MarketplaceCustomer>(token, '/me');
export const listCustomerEnquiries = (token: string) => customerRequest<MarketplaceCustomerEnquiry[]>(token, '/enquiries');
export const createCustomerEnquiry = (token: string, input: { resourceId: string; eventDate?: string; eventLocation?: string; quantity?: number; message: string }) => customerRequest<{ id: string; status: string; createdAt: string }>(token, '/enquiries', { method: 'POST', body: JSON.stringify(input) });
export const sendCustomerEnquiryMessage = (token: string, enquiryId: string, body: string) => customerRequest(token, `/enquiries/${enquiryId}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
export const listCustomerShortlist = (token: string) => customerRequest<MarketplaceShortlistItem[]>(token, '/shortlist');
export const addCustomerShortlist = (token: string, resourceId: string) => customerRequest(token, '/shortlist', { method: 'POST', body: JSON.stringify({ resourceId }) });
export const removeCustomerShortlist = (token: string, resourceId: string) => customerRequest(token, `/shortlist/${resourceId}`, { method: 'DELETE' });
export const listCustomerEventConcepts = (token: string) => customerRequest<MarketplaceEventConcept[]>(token, '/event-concepts');
export const createCustomerEventConcept = (token: string, title: string) => customerRequest<MarketplaceEventConcept>(token, '/event-concepts', { method: 'POST', body: JSON.stringify({ title }) });
export const getCustomerEventConcept = (token: string, conceptId: string) => customerRequest<MarketplaceEventConcept>(token, `/event-concepts/${conceptId}`);
export const updateCustomerEventConcept = (token: string, conceptId: string, input: MarketplaceEventConceptInput) => customerRequest<MarketplaceEventConcept>(token, `/event-concepts/${conceptId}`, { method: 'PATCH', body: JSON.stringify(input) });
export const addCustomerEventConceptSelection = (token: string, conceptId: string, input: { resourceId: string; discoveryPath: MarketplaceEventConcept['lastDiscoveryPath']; quantity?: number; notes?: string }) => customerRequest<MarketplaceEventConcept>(token, `/event-concepts/${conceptId}/selections`, { method: 'POST', body: JSON.stringify(input) });
export const removeCustomerEventConceptSelection = (token: string, conceptId: string, resourceId: string) => customerRequest<MarketplaceEventConcept>(token, `/event-concepts/${conceptId}/selections/${resourceId}`, { method: 'DELETE' });

export async function sendMarketplaceEnquiryMessage(options: PrivateMarketplaceOptions, enquiryId: string, body: string) {
  return privateMarketplaceRequest(options, `/marketplace/enquiries/${enquiryId}/messages?organizationId=${encodeURIComponent(options.organizationId)}`, { method: 'POST', body: JSON.stringify({ body }) });
}

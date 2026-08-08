import type {
  CommercialComparison,
  CommercialPurchaseOrderDraft,
  CommercialQuote,
  CommercialRfq,
  CommercialSubstitutionImpact,
  CommercialWorkspace,
} from './commercial-types';

type Options = { token: string; baseUrl: string };

async function request<T>(options: Options, path: string, init?: RequestInit) {
  const base = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.token}`, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch { /* Keep fallback. */ }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

const root = (eventId: string) => `/events/${eventId}/commercial-workspaces`;

export const listCommercialWorkspaces = (options: Options, eventId: string) =>
  request<CommercialWorkspace[]>(options, root(eventId));

export const generateCommercialWorkspace = (options: Options, eventId: string, packageId: string, input: { submissionDeadline: string; specialNotes?: string }) =>
  request<CommercialWorkspace>(options, `${root(eventId)}/from-procurement-package/${packageId}`, { method: 'POST', body: JSON.stringify(input) });

export const approveCommercialRfq = (options: Options, eventId: string, workspaceId: string, rfqId: string) =>
  request<CommercialRfq>(options, `${root(eventId)}/${workspaceId}/rfqs/${rfqId}/approve`, { method: 'POST' });

export const sendCommercialRfq = (options: Options, eventId: string, workspaceId: string, rfqId: string) =>
  request<CommercialRfq>(options, `${root(eventId)}/${workspaceId}/rfqs/${rfqId}/send`, { method: 'POST' });

export const submitCommercialQuote = (options: Options, eventId: string, workspaceId: string, rfqId: string, input: {
  currency?: string; deliveryFee?: number; taxAmount?: number; paymentTerms?: string; validUntil?: string;
  lines: Array<{ requirementItemId: string; offeredDescription: string; quantityOffered: number; unitPrice: number; qualificationNotes?: string; availabilityNotes?: string; expectedDeliveryDate?: string; isSubstitution?: boolean }>;
}) => request<CommercialQuote>(options, `${root(eventId)}/${workspaceId}/rfqs/${rfqId}/quotes`, { method: 'POST', body: JSON.stringify(input) });

export const compareCommercialQuotes = (options: Options, eventId: string, workspaceId: string) =>
  request<CommercialComparison>(options, `${root(eventId)}/${workspaceId}/comparison`);

export const reviewCommercialSubstitution = (options: Options, eventId: string, workspaceId: string, impactId: string, status: 'Approved' | 'Rejected', notes?: string) =>
  request<CommercialSubstitutionImpact>(options, `${root(eventId)}/${workspaceId}/substitutions/${impactId}/review`, { method: 'POST', body: JSON.stringify({ status, notes }) });

export const createCommercialAwards = (options: Options, eventId: string, workspaceId: string, lines: Array<{ quoteLineId: string; quantity: number }>) =>
  request(options, `${root(eventId)}/${workspaceId}/awards`, { method: 'POST', body: JSON.stringify({ lines }) });

export const prepareCommercialPurchaseOrderDrafts = (options: Options, eventId: string, workspaceId: string) =>
  request<CommercialPurchaseOrderDraft[]>(options, `${root(eventId)}/${workspaceId}/purchase-order-drafts`, { method: 'POST' });

export const approveCommercialPurchaseOrderDraft = (options: Options, eventId: string, workspaceId: string, draftId: string) =>
  request<CommercialPurchaseOrderDraft>(options, `${root(eventId)}/${workspaceId}/purchase-order-drafts/${draftId}/approve`, { method: 'POST' });


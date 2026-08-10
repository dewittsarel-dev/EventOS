import type { CommercialAgreement, ContractTemplate, ContractTemplateSourceType } from './contracts-types';

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

export const listContractTemplates = (options: Options, organizationId: string) =>
  request<ContractTemplate[]>(options, `/organizations/${organizationId}/contract-templates`);

export const createContractTemplate = (options: Options, organizationId: string, input: {
  name: string;
  description?: string;
  sourceType: ContractTemplateSourceType;
  importedFileName?: string;
  importedFileReference?: string;
  content: string;
}) => request<ContractTemplate>(options, `/organizations/${organizationId}/contract-templates`, { method: 'POST', body: JSON.stringify(input) });

export const approveContractTemplate = (options: Options, organizationId: string, templateId: string) =>
  request<ContractTemplate>(options, `/organizations/${organizationId}/contract-templates/${templateId}/approve`, { method: 'POST' });

const agreementRoot = (eventId: string, workspaceId: string) =>
  `/events/${eventId}/commercial-workspaces/${workspaceId}/agreements`;

export const listCommercialAgreements = (options: Options, eventId: string, workspaceId: string) =>
  request<CommercialAgreement[]>(options, agreementRoot(eventId, workspaceId));

export const generateCommercialAgreement = (options: Options, eventId: string, workspaceId: string, input: { templateId: string; supplierId: string; title?: string }) =>
  request<CommercialAgreement>(options, agreementRoot(eventId, workspaceId), { method: 'POST', body: JSON.stringify(input) });

export const approveCommercialAgreement = (options: Options, eventId: string, workspaceId: string, agreementId: string) =>
  request<CommercialAgreement>(options, `${agreementRoot(eventId, workspaceId)}/${agreementId}/approve`, { method: 'POST' });

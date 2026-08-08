import type { AssetGovernanceSummary, AssetSearchResult } from './asset-management-types';

type Options = { token: string; baseUrl: string };
async function request<T>(options: Options, path: string, init?: RequestInit) {
  const base = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.token}`, ...(init?.headers ?? {}) }, cache: 'no-store' });
  if (!response.ok) { let message = `Request failed with status ${response.status}`; try { const body = (await response.json()) as { message?: string | string[] }; message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message; } catch { /* Keep fallback. */ } throw new Error(message); }
  return (await response.json()) as T;
}

export const searchAssets = (options: Options, organizationId: string, search = '') => request<AssetSearchResult>(options, `/asset-management/search?organizationId=${encodeURIComponent(organizationId)}&search=${encodeURIComponent(search)}`);
export const getAssetGovernanceSummary = (options: Options, organizationId: string) => request<AssetGovernanceSummary>(options, `/asset-management/governance-summary?organizationId=${encodeURIComponent(organizationId)}`);
export const createAssetReservation = (options: Options, input: { organizationId: string; eventId: string; requirementItemId: string; assetDefinitionId: string; assetInstanceId?: string; quantity: number; startDateTime: string; endDateTime: string; priority?: number }) => request<{ id: string; status: string }>(options, '/asset-management/reservations', { method: 'POST', body: JSON.stringify(input) });
export const changeAssetReservationStatus = (options: Options, id: string, status: 'Confirmed' | 'Released' | 'Fulfilled' | 'Cancelled', reason?: string) => request(options, `/asset-management/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) });
export const createAssetOperation = (options: Options, input: { organizationId: string; eventId: string; operationType: string; lines: Array<{ requirementItemId?: string; assetEntityType: string; assetEntityId: string; quantityPlanned: number }> }) => request<{ id: string; status: string }>(options, '/asset-management/operations', { method: 'POST', body: JSON.stringify(input) });
export const changeAssetOperationStatus = (options: Options, id: string, status: 'Ready' | 'InProgress' | 'Exception' | 'Completed' | 'Cancelled', exceptionNotes?: string) => request(options, `/asset-management/operations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, exceptionNotes }) });
export const recordAssetDeployment = (options: Options, input: { organizationId: string; eventId: string; requirementItemId?: string; assetEntityType: string; assetEntityId: string; quantity?: number; deploymentArea?: string; setupStatus: string; conditionAtDeploy?: string }) => request(options, '/asset-management/deployments', { method: 'POST', body: JSON.stringify(input) });
export const recordAssetInspection = (options: Options, input: { organizationId: string; eventId: string; assetEntityType: string; assetEntityId: string; inspectionType: string; outcome: 'Pass' | 'PassWithNotes' | 'Fail' | 'Quarantine'; conditionGrade?: string; notes?: string }) => request(options, '/asset-management/inspections', { method: 'POST', body: JSON.stringify(input) });
export const createAssetIncident = (options: Options, input: { organizationId: string; eventId: string; assetEntityType: string; assetEntityId: string; incidentType: 'Damage' | 'Loss' | 'Missing' | 'Theft' | 'Failure'; quantity?: number; occurredAt: string; description: string; estimatedLoss?: number }) => request(options, '/asset-management/incidents', { method: 'POST', body: JSON.stringify(input) });


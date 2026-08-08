import type {
  CreateProcurementPackageInput,
  ProcurementAnalysis,
  ProcurementPackage,
} from './procurement-types';

type Options = { token: string; baseUrl: string };

async function request<T>(options: Options, path: string, init?: RequestInit) {
  const baseUrl = options.baseUrl.endsWith('/')
    ? options.baseUrl.slice(0, -1)
    : options.baseUrl;
  const response = await fetch(`${baseUrl}${path}`, {
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
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      // Keep the status fallback for non-JSON failures.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

const packagePath = (eventId: string) =>
  `/events/${eventId}/procurement-packages`;

export const listProcurementPackages = (options: Options, eventId: string) =>
  request<ProcurementPackage[]>(options, packagePath(eventId));

export const createProcurementPackage = (
  options: Options,
  eventId: string,
  input: CreateProcurementPackageInput,
) =>
  request<ProcurementPackage>(options, packagePath(eventId), {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const analyseProcurementPackage = (
  options: Options,
  eventId: string,
  packageId: string,
) =>
  request<ProcurementAnalysis>(
    options,
    `${packagePath(eventId)}/${packageId}/analyse`,
    { method: 'POST' },
  );

export const selectProcurementSolution = (
  options: Options,
  eventId: string,
  packageId: string,
  solutionId: string,
) =>
  request<ProcurementPackage>(
    options,
    `${packagePath(eventId)}/${packageId}/solutions/${solutionId}/select`,
    { method: 'POST' },
  );

export const requestProcurementQuotations = (
  options: Options,
  eventId: string,
  packageId: string,
) =>
  request<{
    handoff: 'M008_COMMERCIAL_WORKSPACE';
    rfqsPrepared: false;
    rfqsSent: false;
    operatorApprovalStillRequired: true;
  }>(options, `${packagePath(eventId)}/${packageId}/request-quotations`, {
    method: 'POST',
  });


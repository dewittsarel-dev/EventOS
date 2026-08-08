import type {
  EventLifecycleContinuity,
  EventLifecycleSynchronization,
} from './event-lifecycle-types';

type RequestOptions = {
  token: string;
  baseUrl: string;
  organizationId: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function lifecycleRequest<T>(
  options: RequestOptions,
  eventId: string,
  action: 'continuity' | 'synchronize',
  method: 'GET' | 'POST',
) {
  const response = await fetch(
    `${normalizeBaseUrl(options.baseUrl)}/organizations/${options.organizationId}/events/${eventId}/lifecycle/${action}`,
    {
      method,
      headers: { Authorization: `Bearer ${options.token}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
    } catch {
      // Keep the status-based fallback for non-JSON failures.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getEventLifecycle(options: RequestOptions, eventId: string) {
  return lifecycleRequest<EventLifecycleContinuity>(
    options,
    eventId,
    'continuity',
    'GET',
  );
}

export function synchronizeEventLifecycle(
  options: RequestOptions,
  eventId: string,
) {
  return lifecycleRequest<EventLifecycleSynchronization>(
    options,
    eventId,
    'synchronize',
    'POST',
  );
}

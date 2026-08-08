import type {
  ClientBriefInput,
  ClientBriefVersion,
  EventDesignInput,
  EventDesignVersion,
  RequirementSet,
  RequirementSetInput,
} from './event-planning-types';

type Options = { token: string; baseUrl: string };

async function request<T>(options: Options, path: string, init?: RequestInit) {
  const baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
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
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
    } catch {
      // Preserve fallback for non-JSON failures.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const listClientBriefs = (options: Options, eventId: string) =>
  request<ClientBriefVersion[]>(options, `/events/${eventId}/client-brief-versions`);

export const createClientBrief = (options: Options, eventId: string, input: ClientBriefInput) =>
  request<ClientBriefVersion>(options, `/events/${eventId}/client-brief-versions`, { method: 'POST', body: JSON.stringify(input) });

export const listEventDesigns = (options: Options, eventId: string) =>
  request<EventDesignVersion[]>(options, `/events/${eventId}/event-design-versions`);

export const createEventDesign = (options: Options, eventId: string, input: EventDesignInput) =>
  request<EventDesignVersion>(options, `/events/${eventId}/event-design-versions`, { method: 'POST', body: JSON.stringify(input) });

export const approveEventDesign = (options: Options, eventId: string, designId: string) =>
  request<EventDesignVersion>(options, `/events/${eventId}/event-design-versions/${designId}/approve`, { method: 'POST' });

export const listRequirementSets = (options: Options, eventId: string) =>
  request<RequirementSet[]>(options, `/events/${eventId}/requirement-sets`);

export const createRequirementSet = (options: Options, eventId: string, input: RequirementSetInput) =>
  request<RequirementSet>(options, `/events/${eventId}/requirement-sets`, { method: 'POST', body: JSON.stringify(input) });

export const approveRequirementSet = (options: Options, eventId: string, setId: string) =>
  request<RequirementSet>(options, `/events/${eventId}/requirement-sets/${setId}/approve`, { method: 'POST' });

export const overrideRequirementQuantity = (
  options: Options,
  eventId: string,
  setId: string,
  input: { requirementCode: string; quantityRequired: number; reason: string },
) => request<RequirementSet>(
  options,
  `/events/${eventId}/requirement-sets/${setId}/quantity-override`,
  { method: 'POST', body: JSON.stringify(input) },
);

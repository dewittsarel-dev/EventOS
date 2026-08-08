import type { MoodBoard, MoodBoardComparison, MoodBoardObjectSource } from './mood-board-types';

type Options = { token: string; baseUrl: string };

async function request<T>(options: Options, path: string, init?: RequestInit) {
  const base = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.token}` },
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

export const listMoodBoards = (options: Options, eventId: string) =>
  request<MoodBoard[]>(options, `/events/${eventId}/mood-boards`);

export const createMoodBoard = (options: Options, eventId: string, input: {
  requirementSetId: string;
  title: string;
  basedOnMoodBoardId?: string;
  scenes: Array<{
    sceneKey: string;
    name: string;
    description?: string;
    objects: Array<{
      objectKey?: string;
      requirementItemId: string;
      name: string;
      source: MoodBoardObjectSource;
      sourceReferenceId: string;
      supplierName?: string;
      marketplaceListingId?: string;
      imageUrl: string;
      locked?: boolean;
      presentation?: Record<string, unknown>;
    }>;
  }>;
}) => request<MoodBoard>(options, `/events/${eventId}/mood-boards`, { method: 'POST', body: JSON.stringify(input) });

export const submitMoodBoardReview = (options: Options, eventId: string, boardId: string) =>
  request<MoodBoard>(options, `/events/${eventId}/mood-boards/${boardId}/submit-review`, { method: 'POST' });

export const commentOnMoodBoard = (options: Options, eventId: string, boardId: string, comment: string) =>
  request(options, `/events/${eventId}/mood-boards/${boardId}/comments`, { method: 'POST', body: JSON.stringify({ comment }) });

export const requestMoodBoardChanges = (options: Options, eventId: string, boardId: string, comment: string) =>
  request<MoodBoard>(options, `/events/${eventId}/mood-boards/${boardId}/request-changes`, { method: 'POST', body: JSON.stringify({ comment }) });

export const approveMoodBoard = (options: Options, eventId: string, boardId: string) =>
  request<MoodBoard>(options, `/events/${eventId}/mood-boards/${boardId}/approve`, { method: 'POST' });

export const compareMoodBoards = (options: Options, eventId: string, fromBoardId: string, toBoardId: string) =>
  request<MoodBoardComparison>(options, `/events/${eventId}/mood-boards/${fromBoardId}/compare/${toBoardId}`);

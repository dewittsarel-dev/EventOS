import type {
  MeetingActionItemPayload,
  MeetingActionItemUpdatePayload,
  MeetingAttendeePayload,
  MeetingAttendeeUpdatePayload,
  MeetingNoteListResponse,
  MeetingNotePayload,
  MeetingNoteRecord,
  MeetingType,
} from './meeting-notes-types';

type RequestOptions = {
  token: string;
  baseUrl: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}${path}`, {
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
      const body = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listMeetingNotes(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    eventId?: string;
    meetingType?: MeetingType | 'ALL';
    dateFrom?: string;
    dateTo?: string;
    sort?: 'newest' | 'oldest' | 'upcoming';
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.eventId) {
    query.set('eventId', params.eventId);
  }

  if (params.meetingType && params.meetingType !== 'ALL') {
    query.set('meetingType', params.meetingType);
  }

  if (params.dateFrom) {
    query.set('dateFrom', params.dateFrom);
  }

  if (params.dateTo) {
    query.set('dateTo', params.dateTo);
  }

  if (params.sort) {
    query.set('sort', params.sort);
  }

  return apiRequest<MeetingNoteListResponse>(`/meeting-notes?${query.toString()}`, options);
}

export function getMeetingNote(options: RequestOptions, id: string) {
  return apiRequest<MeetingNoteRecord>(`/meeting-notes/${id}`, options);
}

export function createMeetingNote(options: RequestOptions, payload: MeetingNotePayload) {
  return apiRequest<MeetingNoteRecord>('/meeting-notes', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMeetingNote(
  options: RequestOptions,
  id: string,
  payload: Partial<MeetingNotePayload>,
) {
  return apiRequest<MeetingNoteRecord>(`/meeting-notes/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMeetingNote(options: RequestOptions, id: string) {
  return apiRequest<void>(`/meeting-notes/${id}`, options, {
    method: 'DELETE',
  });
}

export function addMeetingAttendee(
  options: RequestOptions,
  meetingNoteId: string,
  payload: MeetingAttendeePayload,
) {
  return apiRequest<MeetingNoteRecord>(`/meeting-notes/${meetingNoteId}/attendees`, options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMeetingAttendee(
  options: RequestOptions,
  meetingNoteId: string,
  attendeeId: string,
  payload: MeetingAttendeeUpdatePayload,
) {
  return apiRequest<MeetingNoteRecord>(
    `/meeting-notes/${meetingNoteId}/attendees/${attendeeId}`,
    options,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function removeMeetingAttendee(
  options: RequestOptions,
  meetingNoteId: string,
  attendeeId: string,
) {
  return apiRequest<void>(`/meeting-notes/${meetingNoteId}/attendees/${attendeeId}`, options, {
    method: 'DELETE',
  });
}

export function addMeetingActionItem(
  options: RequestOptions,
  meetingNoteId: string,
  payload: MeetingActionItemPayload,
) {
  return apiRequest<MeetingNoteRecord>(
    `/meeting-notes/${meetingNoteId}/action-items`,
    options,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function updateMeetingActionItem(
  options: RequestOptions,
  meetingNoteId: string,
  actionItemId: string,
  payload: MeetingActionItemUpdatePayload,
) {
  return apiRequest<MeetingNoteRecord>(
    `/meeting-notes/${meetingNoteId}/action-items/${actionItemId}`,
    options,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function removeMeetingActionItem(
  options: RequestOptions,
  meetingNoteId: string,
  actionItemId: string,
) {
  return apiRequest<void>(
    `/meeting-notes/${meetingNoteId}/action-items/${actionItemId}`,
    options,
    {
      method: 'DELETE',
    },
  );
}

export function convertMeetingActionItemToTask(
  options: RequestOptions,
  meetingNoteId: string,
  actionItemId: string,
) {
  return apiRequest<MeetingNoteRecord>(
    `/meeting-notes/${meetingNoteId}/action-items/${actionItemId}/convert-task`,
    options,
    {
      method: 'POST',
    },
  );
}

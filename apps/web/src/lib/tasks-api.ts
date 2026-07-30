import type {
  ContactListResponse,
  EventListResponse,
  QuotationListResponse,
  TaskListResponse,
  TaskPayload,
  TaskRecord,
  TaskStatus,
  TaskUpdatePayload,
} from './tasks-types';

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
      // Keep fallback message when response body is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listTasks(
  options: RequestOptions,
  params: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    eventId?: string;
    assignedContactId?: string;
    status?: TaskStatus | 'ALL';
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent' | 'ALL';
    dueFrom?: string;
    dueTo?: string;
    sortBy?: 'dueDate' | 'createdAt' | 'updatedAt' | 'priority';
    sort?: 'asc' | 'desc';
    includeArchived?: boolean;
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

  if (params.assignedContactId) {
    query.set('assignedContactId', params.assignedContactId);
  }

  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.priority && params.priority !== 'ALL') {
    query.set('priority', params.priority);
  }

  if (params.dueFrom) {
    query.set('dueFrom', params.dueFrom);
  }

  if (params.dueTo) {
    query.set('dueTo', params.dueTo);
  }

  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  if (params.sort) {
    query.set('sort', params.sort);
  }

  if (params.includeArchived !== undefined) {
    query.set('includeArchived', String(params.includeArchived));
  }

  return apiRequest<TaskListResponse>(`/tasks?${query.toString()}`, options);
}

export async function getTask(options: RequestOptions, id: string) {
  return apiRequest<TaskRecord>(`/tasks/${id}`, options);
}

export async function createTask(options: RequestOptions, payload: TaskPayload) {
  return apiRequest<TaskRecord>('/tasks', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  options: RequestOptions,
  id: string,
  payload: TaskUpdatePayload,
) {
  return apiRequest<TaskRecord>(`/tasks/${id}`, options, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function completeTask(
  options: RequestOptions,
  id: string,
  completedAt?: string,
) {
  return apiRequest<TaskRecord>(`/tasks/${id}/complete`, options, {
    method: 'PATCH',
    body: JSON.stringify(completedAt ? { completedAt } : {}),
  });
}

export async function archiveTask(options: RequestOptions, id: string) {
  await apiRequest<void>(`/tasks/${id}/archive`, options, {
    method: 'PATCH',
  });
}

export async function deleteTask(options: RequestOptions, id: string) {
  await apiRequest<void>(`/tasks/${id}`, options, {
    method: 'DELETE',
  });
}

export async function listContacts(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<ContactListResponse>(
    `/contacts?organizationId=${organizationId}`,
    options,
  );
}

export async function listEvents(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<EventListResponse>(
    `/events?organizationId=${organizationId}&page=1&limit=200`,
    options,
  );
}

export async function listQuotations(
  options: RequestOptions,
  organizationId: string,
) {
  return apiRequest<QuotationListResponse>(
    `/quotations?organizationId=${organizationId}&page=1&limit=200`,
    options,
  );
}

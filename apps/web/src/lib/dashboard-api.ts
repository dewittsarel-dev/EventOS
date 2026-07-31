import type { DashboardOverviewResponse } from './dashboard-types';

type RequestOptions = {
  token: string;
  baseUrl: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function dashboardRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string | string[] };
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

  return (await response.json()) as T;
}

export async function getDashboardOverview(
  options: RequestOptions,
  params: {
    organizationId: string;
    upcomingLimit?: number;
    tasksLimit?: number;
    activityLimit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);

  if (params.upcomingLimit) {
    query.set('upcomingLimit', String(params.upcomingLimit));
  }

  if (params.tasksLimit) {
    query.set('tasksLimit', String(params.tasksLimit));
  }

  if (params.activityLimit) {
    query.set('activityLimit', String(params.activityLimit));
  }

  return dashboardRequest<DashboardOverviewResponse>(
    `/dashboard/overview?${query.toString()}`,
    options,
  );
}

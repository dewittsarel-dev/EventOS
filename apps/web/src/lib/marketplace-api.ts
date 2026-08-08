import type {
  MarketplaceCapabilityRequirement,
  MarketplaceCapabilitySearchResponse,
  MarketplaceSearchMode,
  MarketplaceSupplierShortfallSummary,
} from './marketplace-types';

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

export async function searchMarketplaceCapability(
  options: RequestOptions,
  params: {
    requirement: MarketplaceCapabilityRequirement;
    searchMode: MarketplaceSearchMode;
  },
) {
  return apiRequest<MarketplaceCapabilitySearchResponse>(
    '/marketplace/capability/search',
    options,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
  );
}

export async function getSupplierShortfallSummary(
  options: RequestOptions,
  params: {
    requirement: MarketplaceCapabilityRequirement;
    searchMode: MarketplaceSearchMode;
    primarySupplierId: string;
  },
) {
  return apiRequest<MarketplaceSupplierShortfallSummary>(
    '/marketplace/capability/supplier-shortfall-summary',
    options,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
  );
}

const WEBSITE_PROTOCOL_PATTERN = /^https?:\/\//i;

function hasWhitespace(value: string) {
  return /\s/.test(value);
}

export function normalizeSupplierWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (WEBSITE_PROTOCOL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function validateSupplierWebsite(value: string) {
  const normalized = normalizeSupplierWebsite(value);

  if (!normalized) {
    return {
      normalized,
      error: null,
    };
  }

  if (hasWhitespace(normalized)) {
    return {
      normalized,
      error: 'Website must be a valid URL, for example https://example.com.',
    };
  }

  try {
    const parsed = new URL(normalized);

    if (!/^https?:$/.test(parsed.protocol)) {
      return {
        normalized,
        error: 'Website must use http:// or https://.',
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        normalized,
        error: 'Website must be a valid URL, for example https://example.com.',
      };
    }

    return {
      normalized,
      error: null,
    };
  } catch {
    return {
      normalized,
      error: 'Website must be a valid URL, for example https://example.com.',
    };
  }
}

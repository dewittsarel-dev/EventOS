import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
] as const;

const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization'] as const;

function normalizeOrigins(originsCsv: string | undefined) {
  if (!originsCsv) {
    return [];
  }

  return originsCsv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function buildCorsOptions(): CorsOptions {
  const configuredOrigins = normalizeOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const isNonProduction = process.env.NODE_ENV !== 'production';

  const allowedOrigins = isNonProduction
    ? Array.from(new Set([...configuredOrigins, 'http://localhost:3000']))
    : configuredOrigins;

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: [...DEFAULT_METHODS],
    allowedHeaders: [...DEFAULT_ALLOWED_HEADERS],
    credentials: true,
    optionsSuccessStatus: 204,
  };
}

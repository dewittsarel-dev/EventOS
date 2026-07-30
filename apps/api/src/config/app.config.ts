import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessTokenTtl:
    process.env.JWT_EXPIRES_IN ?? process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
}));

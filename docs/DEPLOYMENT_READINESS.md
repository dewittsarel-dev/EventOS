# Deployment Readiness

EventOS uses Cloudflare for the `eventosnetwork.com` domain and DNS, Vercel for the Next.js web application, and Railway for the NestJS API and managed PostgreSQL. The application architecture remains portable and does not depend on provider-specific business logic.

## Approved production topology

- `app.eventosnetwork.com`: private ClientOS application on Vercel.
- `marketplace.eventosnetwork.com`: public Marketplace on the same verified Next.js deployment.
- `api.eventosnetwork.com`: NestJS API on Railway.
- Railway PostgreSQL: authoritative production database, reachable only by the API.
- `www.eventosnetwork.com`: reserved for the later public marketing website and must not be attached to ClientOS.
- AI image-generation and payment providers remain separate decisions.

ClientOS and Marketplace currently share one Next.js package. A host-specific redirect sends the Marketplace domain root to `/marketplace`; all private and public data boundaries continue to be enforced by the API.

## Provider project settings

### Railway API and PostgreSQL

1. Create one Railway project named `EventOS Production`.
2. Add PostgreSQL and retain Railway's generated `DATABASE_URL` reference.
3. Add the GitHub repository as a service named `eventos-api`.
4. Keep the repository root as the build root. `railway.json` selects `Dockerfile.api`, applies migrations before release and checks `/health/ready` before accepting traffic.
5. Generate a Railway service domain temporarily, then attach `api.eventosnetwork.com` after the first healthy deployment.
6. Enable a paid plan, automated backups and an appropriate restore window before accepting real customer data.

### Vercel web application

1. Import the GitHub repository into the `EventOS` Vercel team.
2. Name the project `eventos-web` and set its Root Directory to `apps/web`.
3. Keep Framework Preset `Next.js`; use the repository's pnpm version and standard `pnpm build` command.
4. Configure the production environment variables below before deploying.
5. Attach `app.eventosnetwork.com` and `marketplace.eventosnetwork.com` only after the Railway API is healthy.
6. Do not attach `www.eventosnetwork.com` until the public marketing surface exists.

## Required production configuration

- `NODE_ENV=production`
- `DATABASE_URL` using TLS and a least-privilege application database user.
- `JWT_SECRET` generated from a high-entropy secret and stored only in the hosting secret manager.
- `JWT_ACCESS_TOKEN_TTL` with the approved session duration.
- `CORS_ALLOWED_ORIGINS` containing only the deployed ClientOS and Marketplace origins.
- `NEXT_PUBLIC_API_BASE_URL` pointing at the production API origin.
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=false`

Railway API variables:

```text
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generated high-entropy secret>
JWT_ACCESS_TOKEN_TTL=15m
CORS_ALLOWED_ORIGINS=https://app.eventosnetwork.com,https://marketplace.eventosnetwork.com
```

Railway provides `PORT` automatically; do not override it.

Vercel production variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.eventosnetwork.com
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
```

Never commit production values, database credentials or provider tokens.

## Health and deployment gates

- `GET /health/live` confirms the API process is alive without depending on PostgreSQL.
- `GET /health/ready` confirms database connectivity before traffic is routed to the API.
- Run API and web build, lint and test suites before deployment.
- Apply pending Prisma migrations as a separate controlled release step before switching application traffic.
- Railway executes `prisma migrate deploy` as a pre-deploy command; a failed migration prevents the new API release from receiving traffic.
- Verify ClientOS authentication and Marketplace customer authentication independently after deployment.

## Database protection

- Enable automated encrypted backups and point-in-time recovery with the selected managed PostgreSQL provider.
- Test restoration into a non-production database before launch and on a scheduled basis thereafter.
- Record migration start/end time, migration identifier and operator for every production release.
- Never use database reset commands in production.

## Logging and privacy

- Centralise structured application errors and request correlation identifiers.
- Do not log passwords, bearer tokens, JWT secrets, customer message content or payment details.
- Restrict production log access and configure retention before accepting real customer data.

## Public endpoint protection

- Helmet security headers are enabled for every API response.
- Marketplace customer endpoints are rate-limited, with tighter limits on registration and login; anonymous enquiry submission is independently limited.
- The built-in limiter is suitable for local and single-instance deployments. A multi-instance production deployment must use shared rate-limit storage.
- Configure the hosting platform's trusted-proxy boundary before relying on client-IP rate limits; do not trust arbitrary forwarded headers.
- Complete an independent penetration test and accessibility audit before accepting real customer or payment data.

## Rollback

- Roll application traffic back to the last verified image when application checks fail.
- Review each database migration before release; use a corrective forward migration when rollback would risk data loss.
- Keep Marketplace enquiry intake disabled if ClientOS processing or database readiness is unavailable.

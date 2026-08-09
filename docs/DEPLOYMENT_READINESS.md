# Deployment Readiness

EventOS remains provider-neutral. This runbook prepares ClientOS, Marketplace and PostgreSQL for production without choosing or provisioning paid services.

## Required decisions before deployment

- Hosting provider and region for the API and web application.
- Managed PostgreSQL provider, region, backup retention and recovery-point objective.
- ClientOS and Marketplace domains.
- Monthly infrastructure budget.
- AI image-generation and payment providers remain separate decisions.

## Required production configuration

- `NODE_ENV=production`
- `DATABASE_URL` using TLS and a least-privilege application database user.
- `JWT_SECRET` generated from a high-entropy secret and stored only in the hosting secret manager.
- `JWT_ACCESS_TOKEN_TTL` with the approved session duration.
- `CORS_ALLOWED_ORIGINS` containing only the deployed ClientOS and Marketplace origins.
- `NEXT_PUBLIC_API_BASE_URL` pointing at the production API origin.
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=false`

Never commit production values, database credentials or provider tokens.

## Health and deployment gates

- `GET /health/live` confirms the API process is alive without depending on PostgreSQL.
- `GET /health/ready` confirms database connectivity before traffic is routed to the API.
- Run API and web build, lint and test suites before deployment.
- Apply pending Prisma migrations as a separate controlled release step before switching application traffic.
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

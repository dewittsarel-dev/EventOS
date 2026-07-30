# Development Rules

## TypeScript and code quality

- Prefer strict TypeScript usage and keep new code readable and explicit.
- Do not introduce unsafe `any` unless the justification is documented and temporary.
- Preserve the existing strict-null-checking posture in the API configuration and avoid weakening compiler settings without a strong reason.
- Do not add unrelated formatting churn or broad refactors to feature work.

## NestJS conventions

- Keep controllers thin and focused on request/response handling.
- Put application logic in services.
- Keep persistence concerns in repository classes or Prisma-specific adapters.
- Use dependency injection and module-based ownership.
- Avoid cross-module coupling unless the dependency is explicit and necessary.

## Prisma conventions

- Keep Prisma schema changes versioned through migrations.
- Review migrations for correctness and reversibility where practical.
- Use the existing Prisma service and repository pattern rather than introducing ad hoc database access.
- Do not bypass the API layer with direct database calls from the web app.

## DTO and validation rules

- Use DTOs for request and response contracts.
- Validate request payloads with class-validator and use validation pipes.
- Prefer `whitelist` and `transform` behavior where appropriate.
- Keep validation rules aligned with the existing Organization module conventions.

## Swagger/OpenAPI requirements

- Add or update Swagger metadata when API endpoints change.
- Include meaningful `@ApiOperation`, `@ApiResponse` or `@ApiProperty` annotations for public-facing contract changes.
- Keep route documentation accurate and aligned with the implementation.

## Error handling

- Use NestJS exceptions such as `NotFoundException` or `BadRequestException` where appropriate.
- Keep error handling consistent and explicit rather than relying on generic failures.
- Do not expose secrets or internal detail in error responses.

## Pagination and filtering

- Follow the current pagination pattern used by the Organization module: `page`, `limit` and optional query filters.
- Keep response envelopes consistent with the existing metadata shape: `{ data, meta }`.
- Do not invent new pagination conventions without updating the related API docs and tests.

## Testing requirements

- Add or update unit tests for services and controllers when behavior changes.
- Add or update e2e tests where an endpoint contract changes.
- Preserve the existing Jest-based test structure in [apps/api](apps/api).
- Do not merge changes that break current behavior or leave tests failing.

## Naming and folder conventions

- Keep feature modules grouped by domain, such as `organizations`.
- Use existing naming patterns for controllers, services, DTOs and repository classes.
- Match the current repository structure rather than introducing a new architecture pattern for a single slice.

## Security and secrets

- Never commit secrets, environment files, tokens or credentials.
- Keep sensitive runtime values in environment variables or secure deployment tooling.
- Do not log secrets or internal connection strings.

## Git and migration rules

- Keep changes scoped to the package being developed.
- Review migrations as part of the package and ensure they are intentional.
- Do not make destructive database changes without a clear rollback or reversal plan.

## Verification commands

Every completed package must pass:

- pnpm --filter api build
- pnpm --filter api test -- --runInBand
- pnpm --filter api lint

Web verification commands currently available in the repository are:

- pnpm --filter web build
- pnpm --filter web lint

## Related documents

- [AGENTS.md](AGENTS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)
- [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)

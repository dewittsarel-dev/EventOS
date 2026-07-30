# Production Package Template

## Package ID and title

- Package ID:
- Title:

## Objective

Describe the intended outcome in one paragraph.

## In scope

-
-
-

## Out of scope

-
-
-

## Existing functionality to preserve

List current behavior that must not regress.

## Functional requirements

Capture the functional requirements in a numbered list.

## API contract

- Routes
- Request DTOs
- Response DTOs
- Swagger/OpenAPI updates

## Database changes

- Prisma schema changes
- Migration plan
- Rollback notes

## Security requirements

- Authentication and authorization expectations
- Secret handling expectations
- Data exposure constraints

## Tests required

- Unit tests
- Integration tests
- E2E tests

## Acceptance criteria

List measurable acceptance criteria.

## Verification commands

- pnpm --filter api build
- pnpm --filter api test -- --runInBand
- pnpm --filter api lint
- pnpm --filter web build
- pnpm --filter web lint

## Completion report format

- Summary
- Files changed
- Verification results
- Risks and follow-up items

## Files changed summary

-
-
-

## Known limitations

Document any known gaps or deferred work.

## Rollback notes

Describe how the package can be rolled back safely.

## Related documents

- [../AGENTS.md](../AGENTS.md)
- [../DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md)
- [../ROADMAP.md](../ROADMAP.md)

# Definition of Done

A production package is complete only when all of the following are true:

- The intended scope is implemented and verified.
- No unrelated files or refactors were introduced.
- Database changes are valid and reviewed.
- Build, test and lint checks pass for the relevant package.
- Swagger/OpenAPI documentation is updated when API contracts change.
- Error cases and regression scenarios are covered by tests.
- Existing behavior remains working.
- Secrets and sensitive data are not exposed.
- The roadmap and changelog are updated to reflect the current repository state.
- A completion report is supplied with verification results and file changes.

## Required verification

- pnpm --filter api build
- pnpm --filter api test -- --runInBand
- pnpm --filter api lint
- pnpm --filter web build
- pnpm --filter web lint

## Related documents

- [../AGENTS.md](../AGENTS.md)
- [../DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md)
- [PRODUCTION_PACKAGE_TEMPLATE.md](PRODUCTION_PACKAGE_TEMPLATE.md)
- [AI_WORKFLOW.md](AI_WORKFLOW.md)

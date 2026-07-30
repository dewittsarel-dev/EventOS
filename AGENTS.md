# AGENTS

This file is the primary instruction file for coding agents working in EventOS.

## Product context

EventOS is a shared platform and database ecosystem with two separate product surfaces:

- ClientOS/EventOS: the private business operating application used by suppliers, planners, venues, coordinators and event companies.
- Marketplace: the public customer-facing application used by customers, brides, corporate clients and event organisers.

Marketplace is intentionally limited to published information and customer-facing flows. It may send enquiries or bookings into ClientOS, but it should not become a second source of truth for private operations.

## Working rules

- Inspect the existing repository before changing code. Do not assume modules, routes, contracts or commands that are not present.
- Implement focused vertical slices. Keep work scoped to one package or one feature boundary at a time.
- Avoid unrelated refactoring, formatting-only churn, or broad architecture changes.
- Preserve existing functionality and tests. Do not break current behavior while adding new capability.
- Treat the architecture and product vision as frozen unless a verified defect requires a change.
- Stop and report before any destructive operation such as deleting files, resetting a database, force-pushing, or removing migrations without review.
- Never commit secrets, credentials, tokens, private keys or environment values.
- Review database changes carefully. Prefer reversible migrations where practical and document any irreversible step.
- Provide explicit completion reports with the files changed, verification results and any follow-up actions.

## Verification requirements

Every completed package must be verified with real commands:

- pnpm --filter api build
- pnpm --filter api test -- --runInBand
- pnpm --filter api lint

Where the web app already has runnable checks, use the current package scripts as well.

## Related documents

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)
- [ROADMAP.md](ROADMAP.md)
- [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)

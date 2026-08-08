# Architecture

## Monorepo structure

The repository is currently a pnpm workspace managed by Turbo.

- Root package configuration and workspace orchestration live in [package.json](package.json), [pnpm-workspace.yaml](pnpm-workspace.yaml) and [turbo.json](turbo.json).
- The API application lives in [apps/api](apps/api).
- The web application lives in [apps/web](apps/web).
- Prisma schema and migrations live under [apps/api/prisma](apps/api/prisma).

## Application stack

### API

The API is a NestJS application built with TypeScript and Prisma.

- Controllers handle HTTP input and output.
- Services contain application behavior and orchestration.
- Repositories encapsulate persistence with Prisma.
- DTOs define input and output contracts.
- Swagger/OpenAPI is enabled in the bootstrap entry point.
- A capability registry can now describe stable action boundaries for future non-UI callers such as AI, guided flows, Marketplace and mobile clients.

### Web

The web application is a Next.js application using the App Router. It is currently a thin shell and should be treated as a client surface rather than a place for core business rules.

- Reusable client-side business rules should live in `apps/web/src/lib/capabilities/<capability>` rather than being embedded directly in pages.

### Data layer

Prisma is the persistence layer for the current repository and is configured for PostgreSQL. The current schema includes User, Organization, Membership, AuditLog and OutboxEvent models.

## Module boundaries and ownership

- The API owns all server-side business rules, persistence and validation.
- The web application owns UI composition and client-side state. It should call the API rather than duplicating business logic.
- Shared contracts should live with the API layer. The current repository does not yet contain a dedicated shared package, so DTOs and response shapes should remain in the API boundary and be reused carefully.
- The private operating surface and the public Marketplace should both communicate with the API and should not maintain independent business-rule implementations.

## Current implementation notes

The current repository already includes a working Organization module:

- [apps/api/src/organizations/organization.controller.ts](apps/api/src/organizations/organization.controller.ts)
- [apps/api/src/organizations/organization.service.ts](apps/api/src/organizations/organization.service.ts)
- [apps/api/src/organizations/organization.prisma-repository.ts](apps/api/src/organizations/organization.prisma-repository.ts)

The current Organization flow supports:

- create
- list with pagination and name filtering
- get by id
- update
- delete

It uses validation pipes, Swagger annotations and Prisma-backed persistence.

## Responsibilities by layer

- Controller: parse input, delegate to a service, return the response shape.
- Service/application layer: enforce business rules, coordinate repository calls and raise domain-appropriate exceptions.
- Repository layer: perform database access with Prisma.
- Domain layer: not yet introduced in the current repository. If a future module needs one, it should live close to the feature and remain the source of domain concepts rather than being duplicated in the web app.
- Client capability service layer: encapsulate reusable UI-side calculations, defaults and mapping logic that should be shared across manual UI, guided workflows and future mobile clients.

## Capability architecture

The recommended architecture is capability-oriented rather than page-oriented.

- Each capability should expose stable application actions from the API.
- The web UI, guided wizards, AI, Marketplace and future mobile surfaces should call those actions instead of duplicating business logic.
- Marketplace remains a separate surface and must consume shared capability actions rather than owning independent operational rules.
- AI is not implemented yet, but the architecture now reserves an AI service port so future agent-driven workflows can invoke the same capability actions used by human-driven flows.

The current capability inventory is:

- Event
- EventExecution
- Inventory
- Resource
- Marketplace
- Booking
- PurchaseOrder
- Quote
- Client
- Transaction

## Future modules

The following modules are clearly future work and should not be assumed to exist yet:

- memberships and invitations
- authentication and authorization
- event core
- work and tasks
- documents
- governance
- finance
- command center

## Related documents

- [AGENTS.md](AGENTS.md)
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)
- [ROADMAP.md](ROADMAP.md)
- [docs/architecture/ARCHITECTURE-001-clientos-capability-alignment.md](docs/architecture/ARCHITECTURE-001-clientos-capability-alignment.md)
- [docs/architecture/ARCHITECTURE-002-resource-engine-phase-1.md](docs/architecture/ARCHITECTURE-002-resource-engine-phase-1.md)
- [docs/architecture/ARCHITECTURE-003-event-execution-engine-phase-1.md](docs/architecture/ARCHITECTURE-003-event-execution-engine-phase-1.md)

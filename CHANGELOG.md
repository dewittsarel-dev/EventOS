# Changelog

## Template

Each package entry should follow this structure:

- Date
- Package ID and title
- Summary
- Files changed
- Verification status
- Notes

## Current repository entries

### 2026-08-08 — ClientOS Event Lifecycle Workspace

- Added the first ClientOS vertical slice to the event details workspace.
- Exposed M004–M011 lifecycle progress, readiness blockers and controlled downstream synchronization through the existing authenticated API.
- Kept all readiness and approval decisions in the API; the interface does not duplicate business rules or perform automatic approvals.
- Verification status: all 27 web test files and 80 tests passed; web lint passed; production web build passed.

### 2026-08-08 — EventOS M004–M011 Backend Architecture

- Implemented the approved backend chain from Event Design and Requirements through Mood Board, Procurement, Commercial Workspace, Asset Management, Event Execution and Event Financial Control.
- Added explicit human approval gates, immutable/versioned records, source-module references and auditable operational transitions across the chain.
- Added the Event Lifecycle continuity and synchronization layer, which reports upstream blockers and prepares downstream draft records without automatic approval.
- Preserved ClientOS as the private operational source of truth, Marketplace as the public published surface, and external accounting as the statutory accounting source.
- Verification status: Prisma schema validation passed; API build, complete API tests and API lint passed; web build and web lint passed.

### 2026-07-29 — PP-006 Authentication and Authorization

- Added API registration and login flows with normalized emails, secure password hashing and JWT issuance.
- Added JWT bearer authentication, a protected current-user endpoint and reusable auth guard/decorator scaffolding.
- Added unit and e2e coverage for registration, login and protected access behavior.
- Verification status: build passed, tests passed, lint passed.

### 2026-07-29 — PP-004 Organization Update

- Added organization update support in the API layer.
- Added or preserved unit and e2e coverage for organization behavior.
- Verification status: build passed, tests passed, lint passed.

### 2026-07-29 — PP-003 Organization Read

- Added organization listing with pagination and name filtering.
- Added response DTOs and Swagger metadata for the read flow.
- Verification status: build passed, tests passed, lint passed.

### 2026-07-29 — PP-002 Organization Create

- Added organization creation support through the NestJS API.
- Added unit and e2e coverage for the create flow.
- Verification status: build passed, tests passed, lint passed.

### 2026-07-29 — PP-001 Repository Bootstrap

- Established the pnpm workspace, Turbo orchestration, NestJS API, Next.js web app and Prisma foundation.
- Verification status: build passed, tests passed, lint passed.

## Related documents

- [ROADMAP.md](ROADMAP.md)
- [docs/PRODUCTION_PACKAGE_TEMPLATE.md](docs/PRODUCTION_PACKAGE_TEMPLATE.md)
- [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)

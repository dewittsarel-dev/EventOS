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

### 2026-08-08 — Requirement Impact Review

- Added approved-baseline quantity comparison through M005 Requirement Impact Reports.
- Displays affected requirement codes, current and proposed quantities, change type and downstream procurement-review consequences.
- Requires an explicit Apply or Keep Current decision for every reported change before the API creates a new Requirement Set version.
- Verification status: all 31 web test files and 84 tests passed; web lint and production build passed; existing Requirement Impact API coverage remained green.

### 2026-08-08 — Controlled Requirement Quantity Overrides

- Added item-level quantity override controls to Requirement Set history.
- Overrides require a planner reason and invoke the M005 versioning action rather than editing an existing approved record.
- Requirement history now exposes item codes, quantities, sources and approval state with explicit approval controls.
- Verification status: all 30 web test files and 83 tests passed; web lint passed; production web build passed; unchanged API regression checks remained green.

### 2026-08-08 — Multi-Item Requirement Set Authoring

- Replaced single-item Requirement Set creation with a practical multi-item editor for products, services and resources.
- Added explicit source-to-target dependency authoring with direct, calculated and design dependency levels.
- Preserved the Requirement Engine as the authority for item numbering, versioning and dependency-graph validation.
- Verification status: all 29 web test files and 82 tests passed; web lint passed without warnings; production web build passed; unchanged API regression checks remained green.

### 2026-08-08 — Contextual ClientOS Event Workspace

- Added server-owned event health, current-stage and next-action guidance to lifecycle continuity.
- Reframed Event Details as a contextual workspace around the event, client, owner, status and approved journey rather than internal module labels.
- Directs incomplete definition and design work into the planning workspace while preserving controlled synchronization and human approvals.
- Verification status: all 29 API suites and 157 tests passed; API build and lint passed; all 28 web test files and 81 tests passed; web lint and production build passed.

### 2026-08-08 — Decision-First ClientOS Home

- Added a server-owned attention contract that prioritises overdue work, work due today, imminent events and open commercial review.
- Each attention item carries a source, plain-language explanation and direct action while explicitly confirming that no automated action or approval was performed.
- Repositioned ClientOS Home around “what matters now, why it matters and what to do next,” with operational statistics retained as supporting context.
- Verification status: all 29 API suites and 156 tests passed; API build and lint passed; all 28 web test files and 81 tests passed; web lint and production build passed.

### 2026-08-08 — ClientOS Navigation Alignment

- Replaced the database-oriented flat navigation with five primary user destinations: Home, Events, Documents, Activity and Settings.
- Kept existing contacts, meeting notes, suppliers, resources, purchasing and quotations available as supporting operational tools.
- Removed Marketplace from the private ClientOS navigation model while preserving its existing route for later development as a separate customer-facing surface.
- Added the Documents destination as an explicit relationship-based capability boundary without inventing document persistence before its backend slice exists.
- Verification status: all 28 web test files and 81 tests passed; web lint passed; production web build passed; API regression verification passed.

### 2026-08-08 — ClientOS Event Design and Requirements Foundation

- Added an authenticated event-planning workspace for immutable Client Brief versions, Event Design versions and Requirement Sets.
- Added explicit Event Design and Requirement Set approval controls while preserving the API as the owner of approval and versioning rules.
- Added direct workspace coverage and an event-level route into the planning flow.
- Verification status: all 28 web test files and 81 tests passed; web lint passed; production web build passed; API regression verification passed.

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

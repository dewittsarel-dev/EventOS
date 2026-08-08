# Roadmap

## Current repository state

The repository currently contains:

- a pnpm workspace with Turbo orchestration
- a NestJS API under [apps/api](apps/api)
- a Next.js web app under [apps/web](apps/web)
- Prisma schema and migrations for a shared platform data model
- a working Organization module with create, list, get, update and delete flows

The repository now contains the verified backend architecture from M004 through M011, including the cross-module lifecycle integration layer. The next development stage is the ClientOS user interface, followed by the Marketplace surface, end-to-end validation and deployment readiness.

## Status legend

- COMPLETE: implemented and verified in the repository
- IN PROGRESS: actively being developed in the current workstream
- NEXT: the next logical slice after the current verified work
- PLANNED: defined but not yet started
- BLOCKED: pending external dependency or unresolved constraint

## Package backlog

### PP-001 Repository Bootstrap — COMPLETE

- Established the monorepo structure, workspace tooling, API, web app and Prisma foundation.
- Verified by the current build and test flow.

### PP-002 Organization Create — COMPLETE

- Added organization creation through the API and supporting tests.

### PP-003 Organization Read — COMPLETE

- Added organization listing and read-by-id flows with pagination and filtering.

### PP-004 Organization Update — COMPLETE

- Added organization update support and corresponding tests.

### PP-005 Membership and Invitations — PLANNED

- Vertical slice 1: membership persistence and ownership.
- Vertical slice 2: invite issuance and acceptance workflow.

### PP-006 Authentication and Authorization — COMPLETE

- Added registration, login, JWT bearer authentication and current-user profile access for the API.
- Added a reusable auth guard and current-user decorator for future private-operation authorization work.
- Verification status: build passed, tests passed, lint passed.

### PP-007 Event Core — COMPLETE

- Vertical slice 1: event model and lifecycle state.
- Vertical slice 2: event ownership and visibility rules.

### PP-008 Work and Tasks — PLANNED

- Vertical slice 1: task model and assignment.
- Vertical slice 2: workflow state and notifications.

### PP-009 Documents — PLANNED

- Vertical slice 1: document model and storage contract.
- Vertical slice 2: document access rules.

### PP-010 Governance — PLANNED

- Vertical slice 1: audit log and approval concepts.
- Vertical slice 2: governance policy enforcement.

### PP-011 Finance — COMPLETE

- Vertical slice 1: budget and invoicing concepts.
- Vertical slice 2: finance workflow integration.

### PP-012 Command Center — COMPLETE

- Vertical slice 1: command center data model.
- Vertical slice 2: action-oriented operational views.

## EventOS architecture delivery

### M004–M011 Backend Chain — COMPLETE

- Event Design Studio and Requirement Engine.
- Mood Board Studio, Procurement Studio and Commercial Workspace.
- Asset Management, Event Execution and Finance & Event Financial Control.
- Event Lifecycle continuity reporting and controlled downstream synchronization.
- Human approval boundaries, immutable audit evidence and source-of-truth ownership preserved.

### ClientOS Product Interface — IN PROGRESS

- Build the private operational experience over the verified M004–M011 APIs.
- Prioritise focused vertical slices and role-appropriate workflows.
- ClientOS navigation alignment — COMPLETE: five calm primary destinations now separate user intent from supporting operational tools, and Marketplace is no longer presented as part of the private operating surface.
- Decision-first Home experience — COMPLETE: server-owned priorities now explain what needs attention, why it matters and the direct action available without performing approvals automatically.
- Contextual Event workspace — COMPLETE: each event now explains its lifecycle health, current stage, first blocker and next relevant action from server-owned continuity rules.
- Event Lifecycle workspace — COMPLETE: event details now show M004–M011 continuity, blockers and controlled synchronization without automating approvals.
- Event Design and Requirements foundation — COMPLETE: immutable Client Brief and Event Design versions, explicit approvals and initial Requirement Set creation are available from the event workspace.
- Multi-item Requirement Set authoring — COMPLETE: planners can author multiple products, services and resources together with explicit direct, calculated or design dependencies.
- Controlled quantity overrides — COMPLETE: planners can create a new auditable Requirement Set version for a changed quantity only when an explicit reason is supplied.
- Requirement impact controls — COMPLETE: proposed quantities are compared with an approved baseline and every reported change requires an explicit planner apply-or-keep decision before a new version is created.
- Mood Board Studio interface — COMPLETE: visual concepts remain linked to approved requirements and identified sources, with comments, change requests, locked objects and explicit visual approval that does not start procurement.
- Procurement Studio interface — COMPLETE: approved requirements can be grouped into governed sourcing packages, analysed against transparent buyer policy, compared across explainable Marketplace solutions and explicitly selected before a non-sending M008 handoff.
- Commercial Workspace interface — COMPLETE: selected procurement strategies now become governed RFQ drafts, separately approved and sent supplier conversations, immutable quote revisions, explainable comparisons, substitution review, explicit awards and unsent purchase-order drafts.
- Asset Management interface — COMPLETE: event requirements now connect to governed asset search, system-calculated availability, reservations, preparation operations, deployment evidence, return inspections, incidents and organization-level exception visibility.
- Event Execution interface — COMPLETE: events now have an operational command workspace for evidence-based tasks, explicit readiness gates, run of show, go-live authority, command logging, incidents, dispatch, collection and controlled closeout.
- Finance interface — COMPLETE: EventOS now exposes operational event financial truth, immutable budget versions, governed changes, commitments, client billing, cash controls, reconciliation and authorised financial close while preserving the external statutory ledger.
- Shared ClientOS capabilities — COMPLETE for the first draft: Documents now indexes source-owned evidence by relationship, Activity consolidates server-owned priorities, assigned work and recent changes, the notification bell opens that actionable stream, and full task management remains available.
- ClientOS workspace search — COMPLETE: the persistent shell search now finds major workspaces, settings and common creation actions with keyboard and mobile access instead of displaying a non-functional placeholder.
- Marketplace Product Interface — COMPLETE for the first draft: the public surface browses explicitly published Resource Engine records with availability state, accepts customer enquiries into dedicated intake records, and returns those enquiries to a private ClientOS management inbox. Private costs, exact stock counts, notes and operating records remain outside the public contract.

### Marketplace Product Interface — COMPLETE FOR FIRST DRAFT

- Public catalogue and enquiry intake are implemented over explicitly published data.
- ClientOS suppliers can create and edit Resource Engine records, explicitly publish or unpublish them, preview the public product, reply to enquiries and record audited enquiry outcomes privately.
- Customer accounts and payments remain refinement work after the first-draft checkpoint; no booking or payment is created silently from an enquiry.
- Marketplace discovery refinement — COMPLETE: customers can filter published resources by category and type, open rich listing details, browse supplier public catalogues and send listing-specific enquiries while private operational fields remain excluded.
- Marketplace opportunity conversion — COMPLETE for the first draft: an operator creates and qualifies a distinct sales opportunity, records confirmation evidence, and explicitly authorises creation of a Draft Event. Legacy direct status conversion is blocked, and AI cannot create or confirm the Event automatically.

### End-to-End and Deployment Readiness — IN PROGRESS

- Automated package verification and public Marketplace integration coverage are active.
- The Marketplace enquiry migration has been applied to the local approved development database.
- Responsive foundation refinement is complete for the shared shell, action-heavy page headers, ClientOS search, public Marketplace header and key event operations; key desktop routes were rechecked for horizontal overflow.
- Production hosting, managed PostgreSQL, secrets, observability and deployment verification require the chosen production environment and credentials.

## Future package guidance

Each future package should be delivered as a small vertical slice, verified end to end, and documented in the changelog before the next package starts.

## Related documents

- [AGENTS.md](AGENTS.md)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/PRODUCTION_PACKAGE_TEMPLATE.md](docs/PRODUCTION_PACKAGE_TEMPLATE.md)
- [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)

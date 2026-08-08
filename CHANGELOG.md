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

### 2026-08-08 — Public Marketplace and ClientOS Bridge

- Replaced the authenticated technical Marketplace prototype route with a separate responsive customer-facing catalogue over explicitly published inventory data.
- Added public search and customer enquiry intake while excluding supplier costs, stock counts, internal notes and other private operating records from the public contract.
- Added a private ClientOS Marketplace Management workspace for published-listing control, public preview and incoming customer enquiries.
- Preserved the existing authenticated Marketplace capability service for transparent procurement matching without presenting it as the customer storefront.
- Added a reversible Marketplace enquiry migration, API unit coverage, web client coverage and public HTTP integration coverage.
- Verification status: all 45 web test files and 101 tests passed; web lint and production build passed; all 30 API unit suites and 160 tests passed; all 14 API end-to-end suites and 48 HTTP journey tests passed; API build and lint passed; public catalogue, enquiry flow and representative ClientOS screens were verified at phone width without horizontal overflow.

### 2026-08-08 — Shared ClientOS Documents and Activity

- Replaced the Documents placeholder with a relationship-based index over source-owned event, commercial, purchasing, meeting, task and finance evidence.
- Added a dedicated Activity workspace combining server-owned attention items, assigned work and recent operational changes without performing approvals automatically.
- Connected the notification bell to the actionable Activity stream and retained Tasks as the detailed operational work manager.
- Preserved source-module ownership and avoided creating a duplicate folder tree, notification authority or workflow engine.
- Verification status: all 44 web test files and 99 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Event Financial Control

- Added an event-context financial-control workspace over the recovered M011 API and linked it from the Event workspace.
- Added decision-ready budget, forecast, commitment, receivable and cash summaries with explicit operational-versus-statutory source-of-truth disclosure.
- Added controlled WBS, budget versions, financial changes, supplier commitments, client billing, payment planning, reconciliation and financial close.
- Preserved immutable baselines and explicit human approval; EventOS does not silently move money, post accounting entries or replace the statutory accounting ledger.
- Verification status: all 42 web test files and 97 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Event Execution

- Added an event-context operational command workspace over the recovered M010 API and linked it from the Event workspace.
- Added execution-plan generation, evidence-based task control, explicit readiness gates, run-of-show cues and separate authorised go-live control.
- Added immutable command logging, operational incidents, dispatch, collection, breakdown controls and evidence-backed closeout.
- Preserved plan-versus-actual separation and the rule that AI may advise but cannot approve gates, override safety, accept handover or close the event.
- Verification status: all 40 web test files and 95 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Event Asset Management

- Added an event-context Asset Management workspace over the recovered M009 API and linked it from the Event workspace.
- Added governed asset search, system-calculated availability, requirement-linked reservations and event preparation operations.
- Added deployment evidence, return inspection outcomes, incident reporting and organization-level reservation, maintenance, incident and governance-exception visibility.
- Preserved separate availability, lifecycle, condition, custody and deployment concepts; failed or quarantined serialized assets do not silently return to available stock.
- Verification status: all 38 web test files and 93 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Commercial Workspace

- Added an event-context Commercial Workspace over the recovered M008 API and linked it from the Event workspace.
- Generates supplier-specific RFQ drafts from the selected Procurement Solution while keeping generation, human approval and sending as separate controlled actions.
- Added structured supplier quote revisions, requirement-level comparison, explainable AI recommendations, cross-module substitution review and explicit line awards.
- Added governed purchase-order draft preparation and approval while confirming that draft approval does not silently send an order or create an uncontrolled commitment.
- Verification status: all 36 web test files and 91 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Procurement Studio

- Added an event-context Procurement Studio over the recovered M007 API and linked it from the Event workspace.
- Groups approved requirements into sourcing packages with explicit buyer policies for cost, coordination, locality, reliability, sustainability, emerging-business support and Marketplace diversity.
- Presents explainable ranked procurement solutions, supplier allocations, cost, confidence and risk without hiding credible alternatives or applying hidden AI objectives.
- Requires explicit human solution selection and clearly separates that decision from the M008 quotation-workspace handoff; no RFQ, reservation, order or payment is created automatically.
- Verification status: all 34 web test files and 88 tests passed; web lint and production build passed; all 29 API suites and 157 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Mood Board Studio

- Added an event-context Mood Board Studio over the recovered M006 API.
- Creates sourced visual objects linked to approved requirement items, including governed Marketplace supplier/listing references and optional locked-object protection.
- Added client-review submission, immutable comments, change requests and explicit visual approval while confirming that approval does not start procurement.
- Added event-workspace navigation and responsive visual cards for board versions and review history.
- Verification status: all 32 web test files and 85 tests passed; web lint and production build passed; API regression verification passed.

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

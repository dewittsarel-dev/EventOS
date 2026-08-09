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

### 2026-08-09 — Production Request Observability

- Added an API-wide request correlation identifier that preserves safe caller identifiers or generates a UUID.
- Returned the correlation identifier in every API response through `x-request-id`.
- Added privacy-safe structured completion records containing only request ID, method, path, status and duration, with warning/error severity for unsuccessful responses.
- Documented the remaining external log aggregation and retention controls required before accepting real customer data.
- Verification status: API build passed; all 33 API suites and 181 tests passed; API lint passed; web lint and production build passed.

### 2026-08-09 — Cloudflare, Vercel and Railway Deployment Foundation

- Selected Cloudflare DNS, Vercel web hosting and Railway API/PostgreSQL without introducing provider-specific business logic.
- Added a multi-stage Node.js production container for the NestJS API with Prisma support.
- Added Railway configuration for pre-release Prisma migrations, database readiness health checks and controlled restart behavior.
- Added Vercel host routing from the Marketplace domain root to the public Marketplace surface while retaining the shared verified web package.
- Recorded the exact production domains, provider project settings, environment-variable boundaries and sequencing in the deployment runbook.
- Verification status: clean API production container build passed; API build and lint passed; all 32 API suites and 179 tests passed; all 55 web test files and 123 tests passed; web lint and production build passed.

### 2026-08-09 — End-to-End Business Journey Phase 2

- Extended Marketplace HTTP coverage across customer registration, authenticated enquiry creation and customer follow-up messaging while retaining the server-owned identity boundary.
- Replaced generic lifecycle blockers with direct actions into Mood Board, Procurement and Commercial workspaces.
- Added an explicit terminal lifecycle state after operational completion and Financial Close.
- Prevented downstream synchronization after the event lifecycle has closed.
- Documented the verified Marketplace-to-close journey, preserved approval boundaries and remaining production-environment gates.
- Verification status: API build passed; all 32 API suites and 179 tests passed; API lint passed; all 14 API end-to-end suites and 49 HTTP tests passed; all 55 web test files and 123 tests passed; web lint and production build passed.

### 2026-08-09 — Product-Wide Usability Phase 1

- Corrected the ClientOS mobile navigation button so it opens the drawer without navigating to Activity.
- Connected the notification control to the actionable Activity workspace and replaced exposed record identifiers in breadcrumbs with human-readable detail labels.
- Simplified account, organization, Home, Documents and sign-in language while keeping development connection controls available only in explicit development mode.
- Replaced technical bearer-token and organization-ID instructions across event, contact, supplier, quotation, task, meeting-note, resource and settings workflows.
- Added readable labels for internal task, purchase-order and supplier-category values.
- Improved Marketplace account loading, empty states, accessible labels and browser autocomplete behavior.
- Verified primary ClientOS and Marketplace routes at 390px mobile and 768px tablet widths with no horizontal page overflow.
- Verification status: all 55 web test files and 121 tests passed; web lint and production build passed; all 32 API suites and 175 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-09 — Marketplace Customer Experience and Public API Hardening

- Removed duplicate contact-detail entry for signed-in Marketplace customers; enquiries now clearly use the authenticated customer identity owned by the server.
- Added direct post-enquiry navigation to the customer planning workspace and improved form labelling and success announcements for assistive technology.
- Added standard HTTP security headers and conservative request limits for customer registration, login, messaging, shortlist actions and anonymous enquiry submission.
- Tightened validation for customer names, login inputs and enquiry messages so whitespace-only or oversized values are rejected before persistence.
- Verified the live Marketplace and customer sign-in surfaces at desktop and 390px mobile width with no horizontal overflow.
- Verification status: all 54 web test files and 118 tests passed; web lint and production build passed; all 32 API suites and 175 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-09 — Marketplace Customer Workspace and Deployment Foundation

- Added a customer-only Marketplace account and JWT session boundary that cannot authenticate into private ClientOS operations.
- Added an authenticated customer enquiry workspace with status tracking, supplier replies and two-way enquiry messages.
- Added saved Marketplace shortlists and a customer comparison view using only explicitly published listing data.
- Connected supplier replies from ClientOS Marketplace management to the customer workspace while retaining the enquiry as the governed intake record.
- Added responsive customer account, enquiry and comparison screens, accessible feedback states, server-owned customer identity and guarded ownership checks.
- Added provider-neutral deployment guidance, explicit environment configuration, database-backed readiness checks and independent process liveness checks.
- Applied the reversible Marketplace customer workspace migration to the approved local development database.
- Verification status: all 53 web test files and 117 tests passed; web lint and production build passed; all 32 API suites and 175 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-09 — Provider-Neutral Mood Board AI Render Packages

- Added an auditable render-request lifecycle for draft Mood Board scenes without selecting or contacting an external AI provider.
- Captured the exact board version, scene instructions, supplier images, source references, linked requirements, object presentation data and lock state in each immutable render input package.
- Added explicit governance flags confirming that locked objects must be preserved and that neither provider submission nor commercial commitment is authorised.
- Added ClientOS controls to prepare, review and cancel render packages; client-review and approved boards require a new draft revision before further rendering.
- Applied the reversible render-request migration to the approved local development database.
- Verification status: all 52 web test files and 116 tests passed; web lint and production build passed; all 30 API suites and 167 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-08 — Event Workspace Decision Guidance and Mood Board Revisions

- Added immutable Mood Board revision creation from an existing version while preserving locked objects and all untouched scenes.
- Added adjacent Mood Board version comparison with explicit affected-requirement warnings; procurement remains unchanged until planner review.
- Added a consistent decision-first summary to Procurement, Commercial, Asset Management, Event Execution and Finance workspaces.
- Derived each workspace stage, attention count and next safe action from authoritative workspace records instead of duplicating workflow state.
- Prioritised substitutions, governance exceptions, live incidents, readiness blockers, budget baselines, financial changes and reconciliation differences without automating operator decisions.
- Added focused cross-workspace guidance tests and updated route-level interaction coverage.
- Verification status: all 52 web test files and 116 tests passed; web lint and production build passed; all 30 API suites and 165 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-08 — Mood Board Structured Composition

- Replaced the technical one-object Mood Board form with a multi-object scene composer over approved Requirement Sets.
- Added direct selection of published Marketplace supplier images while preserving listing, supplier and requirement traceability.
- Added scene-level layout instructions and object-level placement/styling instructions as provider-independent inputs for later AI rendering.
- Added per-object locking and support for traceable planner-library, client-upload, external-design and AI-concept references.
- Kept visual approval separate from procurement and made no AI provider or automated commercial decision.
- Verification status: all 51 web test files and 112 tests passed; web lint and production build passed; all 30 API suites and 165 tests passed; API build and lint passed.

### 2026-08-08 — Governed Marketplace Opportunity Conversion

- Added a distinct, auditable sales-opportunity record between Marketplace enquiries and authoritative Events.
- Added ClientOS qualification controls for event details, estimated value, notes and explicit `Qualifying`, `Qualified` or `Lost` decisions.
- Added evidence-backed `Convert to Event`, which creates or reuses the customer Contact and creates the Event strictly as `Draft`.
- Blocked direct legacy `Converted` status updates so only the qualified conversion transaction can produce that outcome.
- Recorded opportunity creation, qualification and conversion in the immutable audit log, including operator and confirmation evidence.
- Applied the reversible migration to the approved local development database.
- Verification status: all 50 web test files and 111 tests passed; web build and lint passed; all 30 API suites and 165 tests passed; all 14 API end-to-end suites and 48 HTTP tests passed; API build and lint passed.

### 2026-08-08 — Marketplace Discovery Refinement

- Added public category, resource-type and supplier filters over explicitly published Resource Engine records.
- Added dedicated listing detail pages with multi-image galleries, public pricing/availability guidance, supplier identity and direct enquiry intake.
- Added public supplier catalogue pages using only approved organization identity and published resources.
- Restricted public supplier website links to HTTP/HTTPS and preserved the exclusion of costs, exact quantities, internal notes and operational records.
- Verified the real local journey from catalogue to listing detail to supplier catalogue with the demo Resource Engine listing and no horizontal overflow.
- Verification status: all 49 web test files and 109 tests passed; web build and lint passed; all 30 API suites and 162 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS and Marketplace Responsive Foundation

- Made action-heavy page headers horizontally accessible on phones while preserving wrapped desktop actions.
- Constrained the mobile navigation drawer, profile menu and ClientOS search overlay to the available viewport.
- Improved small-screen Marketplace sign-in branding and event Asset/Execution form layouts.
- Added shared form-control overflow safeguards without changing workflow or data behavior.
- Verified no horizontal document overflow on the live Home, Events, Marketplace and Marketplace Management routes at the available desktop viewport.
- Verification status: all 47 web test files and 106 tests passed; web build and lint passed; all 30 API suites and 161 tests passed; API build and lint passed.

### 2026-08-08 — ClientOS Workspace Search

- Replaced the persistent non-functional search placeholder with a command-style workspace and action finder.
- Added direct access to primary workspaces, operational tools, settings and common creation actions.
- Added `/` keyboard access, mobile-header access, Enter-to-open behavior and clear no-result guidance.
- Kept the scope honest: this slice searches ClientOS destinations and actions, not record contents.
- Verification status: all 47 web test files and 106 tests passed; web build and lint passed; all 30 API suites and 161 tests passed; API build and lint passed.

### 2026-08-08 — Marketplace Resource Engine Alignment

- Corrected the Marketplace publication source from legacy Inventory Item flags to `Resource.visibility = MARKETPLACE`, preserving the Resource Engine as the live availability and reservation authority.
- Added safe legacy-enquiry migration support while all new enquiries link directly to their Resource Engine listing.
- Added ClientOS Resource create/edit screens, explicit publish/unpublish controls, public preview, availability labels and a private enquiry workflow with email reply and audited status decisions.
- Verified a real local PostgreSQL journey from Resource creation through public discovery, enquiry intake, private supplier inbox and `Acknowledged` outcome.
- Verification status: all 30 API suites and 161 tests passed; all 14 API end-to-end suites and 48 HTTP journey tests passed; all 46 web test files and 103 tests passed; API/web build and lint passed; Resource editing, Marketplace management and public Marketplace passed phone-width overflow checks.

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

# Decisions

This log captures engineering and architecture decisions for EventOS.
Record decisions when they materially affect design, delivery sequencing, or operational policy.

## How to Use This Log

Each entry should contain:

- ID: stable identifier
- Date: decision date
- Status: proposed, accepted, superseded, or deprecated
- Context: what problem required a decision
- Decision: what was chosen
- Consequences: expected impact and trade-offs

## Decision Entries

## DEC-001

- Date: 2026-07-30
- Status: accepted
- Context: EventOS serves both private business operations and a public marketplace experience.
- Decision: Maintain one shared platform and data ecosystem with two distinct product surfaces:
  - ClientOS/EventOS for private operational workflows
  - Marketplace for published customer-facing flows
- Consequences:
  - Private operational state remains centralized.
  - Marketplace can drive enquiries and bookings but cannot become a second source of truth.

## DEC-002

- Date: 2026-07-30
- Status: accepted
- Context: Team needs a clear backend ownership boundary while the product evolves.
- Decision: Keep API as the owner of business rules, validation, and persistence orchestration.
- Consequences:
  - Web layer focuses on UI composition and API consumption.
  - Domain logic duplication in client surfaces is explicitly avoided.

## DEC-003

- Date: 2026-07-30
- Status: accepted
- Context: Delivery consistency is required across small and large packages.
- Decision: Enforce a package completion gate defined by Definition of Done and command-based verification.
- Consequences:
  - Packages must include validation evidence before closure.
  - Exceptions require explicit rationale and owner approval.

## DEC-004

- Date: 2026-07-30
- Status: accepted
- Context: Current repository has foundational modules and needs controlled expansion.
- Decision: Expand by focused vertical slices within module boundaries instead of broad refactors.
- Consequences:
  - Lower regression risk while new capabilities are added.
  - Better traceability for package outcomes and review quality.

## DEC-005

- Date: 2026-08-02
- Status: accepted
- Context: ClientOS needs future modules, AI callers, marketplace surfaces and guided workflows to reuse the same application behavior without copying business rules into pages or external clients.
- Decision: Introduce a capability-oriented architecture with explicit capability action definitions, API-side registry contracts, AI and Marketplace service ports, and client-side capability services for reusable UI logic.
- Consequences:
  - New modules have a clear extension path without changing current routes or UI composition.
  - Existing working modules can be migrated incrementally instead of through a broad rewrite.
  - Pages should increasingly act as presentation and orchestration shells rather than business-logic containers.

## DEC-006

- Date: 2026-08-02
- Status: accepted
- Context: Inventory, purchase orders, suppliers and events currently contain resource-adjacent concepts, but the platform lacks a generic resource abstraction that can later support multiple industries and external callers.
- Decision: Introduce Resource Engine as a standalone capability with generic resource model contracts, lifecycle action definitions and a dedicated service/module, while keeping current Inventory and related modules unchanged in Phase 1.
- Consequences:
  - Existing operational modules remain the active system of record until migration packages are planned.
  - Future resource workflows can evolve without coupling to event-specific nouns.
  - Marketplace, AI, dispatch and maintenance extensions can attach to a generic resource capability instead of to Inventory directly.

## DEC-007

- Date: 2026-08-02
- Status: accepted
- Context: Events currently exist as records, but the platform needs a future-safe way to orchestrate planning, reservation, procurement, staffing, dispatch and completion as an executable workflow without breaking current Event CRUD.
- Decision: Introduce Event Execution Engine as a standalone capability with lifecycle action contracts, a dedicated service/module and explicit phase-1 placeholders, while keeping the existing Event module unchanged.
- Consequences:
  - Current Event pages and CRUD behavior remain stable.
  - Future workflow orchestration can evolve independently from record management.
  - Resource, Purchase Order, Task and supplier-booking capabilities can later integrate through capability contracts instead of direct page-specific logic.

## DEC-008

- Date: 2026-08-10
- Status: accepted
- Context: EventOS must prepare agreements between customers, suppliers, planners, venues and other event parties while allowing each ClientOS organization to retain its own approved legal wording.
- Decision: Keep reusable contract templates and event-specific agreement versions inside private ClientOS. Generate agreement drafts from the authoritative commercial conversation and party records, require explicit human review and approval, and expose no contract content through public Marketplace records.
- Consequences:
  - Organizations may design a template or register an imported original with governed merge fields.
  - Generated agreements preserve immutable party and commercial snapshots for auditability.
  - EventOS may draft but never auto-sign or make an agreement binding without authorized human action.
  - Amendments and electronic-signature integrations can extend the versioned agreement record without creating another commercial source of truth.

## Superseding a Decision

When replacing a decision:

- add a new decision entry with a new ID
- mark prior entry as superseded
- reference the replacing ID in the old entry and the new entry

This keeps history intact and makes policy changes auditable.

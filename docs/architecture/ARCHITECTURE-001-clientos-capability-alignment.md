# ARCHITECTURE-001 ClientOS Capability Alignment

## Purpose

This package prepares EventOS to follow the ClientOS Constitution without rewriting working modules.
It introduces capability-oriented contracts, explicit AI and Marketplace extension points, and a reusable client-side service pattern for business rules that should not remain embedded in pages.

## Current architecture

### API

- NestJS modules own HTTP controllers, application services and Prisma persistence.
- Business rules mostly live in feature services such as purchase orders, suppliers and events.
- There is no shared capability catalog or invocation model for future AI, marketplace or mobile callers.

### Web

- Next.js pages compose UI and call API helper functions from `src/lib`.
- Some pages still contain local business-rule helpers such as calculations, defaulting and form-to-payload mapping.
- There is no explicit capability-facing client service layer for reuse by manual UI, guided flows or future mobile surfaces.

## Recommended architecture

### 1. Capability application layer

Each capability should expose a stable application service boundary from the API.
Controllers remain transport adapters only.
Future callers should target capability actions rather than page-specific flows.

Recommended capability shape:

- Capability module owns application services and DTOs.
- Application services own business rules and orchestration.
- Prisma or repository adapters own persistence concerns.
- External callers resolve capability actions through a registry/catalog rather than duplicating logic.

### 2. UI-to-service separation

Web pages should keep only:

- route parameters
- local UI state
- rendering
- user interaction wiring
- API error/success display

Reusable client-side business rules should move into `src/lib/capabilities/<capability>` services.
Examples:

- totals calculation
- defaulting selected product values
- line item normalization
- view-model mapping

### 3. AI service layer

AI is not implemented in this package.
The architecture now reserves a port for AI invocation so future agents can call capability actions through the same application services used by the UI.

### 4. Marketplace service layer

Marketplace is not implemented in this package.
The architecture now reserves a standalone marketplace service port so public-facing workflows can consume approved capability actions without becoming a second source of truth.

## Capability inventory

The prepared capability catalog includes:

- Event
- Inventory
- Marketplace
- Booking
- PurchaseOrder
- Quote
- Client
- Transaction

Each capability declares actions and intended consumers:

- manual-ui
- guided-wizard
- ai
- marketplace
- mobile-app

## Migration strategy

### Phase 1: Architecture scaffolding

- Introduce capability catalog and registry in the API.
- Introduce AI and Marketplace ports only.
- Extract page-level reusable rules into client capability services where low-risk and immediately useful.

### Phase 2: Module-by-module adoption

For each future or touched module:

- keep controllers thin
- keep business rules in API application services
- add or expand client capability services for shared UI logic
- avoid putting calculation or orchestration logic directly in pages
- register capability actions in the shared catalog

### Phase 3: External caller adoption

When AI, marketplace or mobile surfaces are built:

- invoke capability actions through the application-layer contracts
- do not create alternative business-rule implementations
- keep the API as the source of truth for state transitions and validation

## Non-goals

- No UI redesign
- No working module rewrite
- No AI implementation
- No Marketplace functionality implementation
- No change to existing authentication or authorization model beyond preserving behavior

## Expected outcome

Future modules can adopt a stable capability-oriented architecture with low regression risk, while existing modules continue to operate with current routes and UI structure.

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

## Superseding a Decision

When replacing a decision:

- add a new decision entry with a new ID
- mark prior entry as superseded
- reference the replacing ID in the old entry and the new entry

This keeps history intact and makes policy changes auditable.
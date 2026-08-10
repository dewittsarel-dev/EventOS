# EventOS Simulation and Launch Assurance

## Purpose

EventOS will not rely on early customers to discover fundamental workflow defects. A repeatable simulation environment will exercise ClientOS and Marketplace before launch and remain part of every material upgrade.

Simulation data is test evidence, not production business data. It must remain isolated from production and every simulated identity must be clearly labelled as synthetic.

## Baseline business population

The baseline contains exactly 150 deterministic synthetic businesses:

- 80 suppliers covering furniture, décor, floral, lighting, audiovisual, catering, entertainment, media, logistics, staffing and security.
- 20 event planners covering private and corporate work.
- 30 venues covering intimate, large and outdoor events.
- 20 specialist providers covering technical production, safety and compliance.

The catalogue deliberately includes micro, small, medium and large businesses across multiple cities. Images must be licensed test fixtures or generated specifically for simulation. Copied supplier photographs, real supplier identities and misleading public listings are prohibited.

The first catalogue definition is implemented in `apps/api/src/simulation/simulation-business-catalog.ts`. It is deterministic so failures can be reproduced and future releases can be compared with the same baseline.

## Scenario ladder

The simulator will grow through controlled slices:

1. Small private order: one customer, one supplier, one listing and a straightforward enquiry.
2. Small private event: planner, venue and a small supplier group with ordinary changes.
3. Medium multi-supplier event: competing quotes, substitutions, availability pressure and controlled approvals.
4. Large corporate event: multiple venues or spaces, production, logistics, staffing, finance controls and staged execution.
5. Extreme event: concurrent changes, stock conflicts, failures, cancellations, incidents and recovery actions.

Each level must cover the complete relevant journey from Marketplace discovery and enquiry through ClientOS qualification, Event creation, design, requirements, mood board, procurement, commercial control, assets, execution, finance and closeout.

## Required failure and governance coverage

- Conflicting reservations, partial stock and last-minute substitutions.
- Supplier non-response, rejection, cancellation and fulfilment failure.
- Customer changes, cancellation, refund and payment failure where those capabilities exist.
- Concurrent users, roles and approval boundaries.
- Dates, time zones, deadlines and late changes.
- Marketplace-to-ClientOS synchronization without a second source of truth.
- Private-data separation and record ownership.
- Explainable AI assistance, fair supplier discovery and human approval.
- Backup restoration, migration rehearsal, feature flags, rollback and upgrade continuity.
- Performance at the initial 50-business launch target and above the 150-business simulation baseline.

## Release gate

A release is not launch-ready merely because package tests pass. Before public launch, the simulator must produce repeatable evidence that:

- all critical end-to-end scenarios pass;
- no private ClientOS information is exposed through Marketplace;
- financial and operational approvals remain human-controlled;
- simulated data cannot appear as a real production listing;
- backup restoration and upgrade rollback have been rehearsed;
- failures are traceable to a stable scenario and synthetic record identifier.

## Delivery slices

- Slice 1 — deterministic 150-business catalogue and regression rules: complete.
- Slice 2 — isolated persistence seeding and cleanup safeguards.
- Slice 3 — realistic catalogues, inventory and approved image fixtures.
- Slice 4 — deterministic customers, enquiries and event scenario packs.
- Slice 5 — full M004–M011 workflow drivers and assertions.
- Slice 6 — concurrency, failure injection, performance and recovery rehearsal.
- Slice 7 — automated release report and formal launch gate.

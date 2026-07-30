# Definition of Done

This document defines the minimum completion standard for EventOS work packages.
A package is done only when all criteria below are met.

## 1. Scope and Product Fit

- The delivered change is within the approved package scope.
- The change aligns with the EventOS product split:
  - ClientOS/EventOS remains the private operational source of truth.
  - Marketplace remains public-facing and does not duplicate private workflow state.
- No unrelated refactor or architectural drift is introduced.

## 2. Functional Completion

- Acceptance criteria are implemented end-to-end.
- Happy path behavior works as specified.
- Error paths and validation behavior are handled and consistent.
- Existing behavior outside scope is preserved.

## 3. Code Quality and Boundaries

- Code follows existing repository conventions.
- Module boundaries are respected:
  - API owns business rules and persistence orchestration.
  - Web consumes API contracts and does not replicate server rules.
- Public interfaces are intentionally designed and documented in code where necessary.

## 4. Tests and Verification

- Relevant tests are added or updated.
- Existing tests continue to pass.
- Required package checks are run and pass:
  - pnpm --filter api build
  - pnpm --filter api test -- --runInBand
  - pnpm --filter api lint
- Any skipped test or deferred validation has explicit rationale and follow-up ownership.

## 5. Data and Migration Safety

- Schema changes are reviewed for backward compatibility.
- Migrations are reversible where practical.
- Risky or irreversible steps are called out before rollout.
- No test or sample data is promoted as production truth.

## 6. Security and Compliance

- No secrets, tokens, credentials, or private keys are committed.
- Access control implications are reviewed for new endpoints or flows.
- Audit-relevant actions preserve traceability expectations.

## 7. Documentation and Operational Readiness

- Engineering documents affected by the change are updated when needed.
- API behavior changes are reflected in DTOs, contracts, and route documentation.
- Rollout notes and follow-up actions are recorded when required.

## 8. Review and Handover

- Code review feedback is addressed or tracked.
- Trade-offs and non-obvious decisions are documented.
- Final completion report includes:
  - files changed
  - checks executed and results
  - known limitations and next actions

## Done Gate

A package is complete only when all sections above are satisfied or explicitly waived by engineering leadership with written rationale.
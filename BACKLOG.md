# Backlog

This backlog tracks engineering packages for EventOS in priority order.
Packages are outcome-oriented and scoped as vertical slices.

## Prioritization Model

Priority should consider:

- product impact and operational value
- architectural dependency order
- delivery risk and uncertainty
- verification cost and release readiness

Status values:

- proposed
- ready
- in progress
- blocked
- review
- done

## Active Backlog

## EF-001 Engineering Foundation Folder Structure

- Status: done
- Objective: establish core engineering directory structure.
- Scope:
  - .github/workflows
  - .github/ISSUE_TEMPLATE
  - docs and core docs subfolders
  - templates
  - packages
- Notes: structure exists and is aligned.

## EF-002 Core Engineering Documentation

- Status: done
- Objective: establish baseline engineering documents in repository root.
- Scope:
  - AGENTS
  - PROJECT_CONTEXT
  - ARCHITECTURE
  - DEFINITION_OF_DONE
  - CONTROL_CENTER
  - DECISIONS
  - BACKLOG
- Notes: root documentation set now exists with initial operational content.

## API-001 Authentication Baseline Hardening

- Status: proposed
- Objective: review and harden authentication contracts, guards, and error handling.
- Dependencies: none.
- Expected outcomes:
  - clarified auth behavior and failure modes
  - improved tests around token and protected routes

## API-002 Membership Domain Slice

- Status: proposed
- Objective: implement first membership management vertical slice.
- Dependencies:
  - API-001 for access assumptions
- Expected outcomes:
  - membership create/list/update behavior within API boundaries
  - verification coverage for membership scenarios

## WEB-001 Marketplace Intake Flow Skeleton

- Status: proposed
- Objective: define minimal public intake flow that posts enquiries into API.
- Dependencies:
  - stable API endpoint contract
- Expected outcomes:
  - clear separation between public intake and private workflow state
  - validated end-to-end request path

## OPS-001 CI Baseline for API Checks

- Status: proposed
- Objective: enforce required API verification commands in CI.
- Dependencies:
  - workflow conventions under .github/workflows
- Expected outcomes:
  - reproducible package quality gate in automated checks

## COM-002 Governed Contract Templates and Agreements

- Status: completed
- Objective: let ClientOS organizations retain their own contract wording and prepare reviewable agreements between event parties from authoritative commercial records.
- Dependencies:
  - M008 Commercial Workspace
  - organization, event and membership records
- Expected outcomes:
  - private designed or imported contract templates with approval state
  - immutable event-specific agreement versions and party snapshots
  - human approval controls and commercial-workspace traceability
  - no contract publication through Marketplace

## Backlog Hygiene Rules

- Keep items scoped and testable.
- Split oversized items before implementation begins.
- Re-prioritize during planning checkpoints in Control Center.
- Link major decisions to entries in Decisions when relevant.
- Move completed items to a done section or changelog reference when backlog becomes large.

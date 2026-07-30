# Control Center

This document defines how delivery is coordinated across packages in EventOS.
Control Center is the execution heartbeat for planning, sequencing, and risk control.

## Purpose

- Provide one operational view of active engineering work.
- Track package status from proposal to completion.
- Surface blockers, dependencies, and decision needs early.
- Keep scope aligned with product boundaries and architecture.

## Package Lifecycle

Every package should move through the same states:

1. Proposed: objective, scope, constraints, and expected outputs are defined.
2. Ready: dependencies, assumptions, and acceptance criteria are confirmed.
3. In Progress: implementation is underway with active ownership.
4. Review: code, tests, and documentation are being verified.
5. Done: Definition of Done is satisfied and evidence is recorded.
6. Archived: package is closed with outcomes and follow-up references.

## Ownership Model

- Package Owner: accountable for delivery and completion evidence.
- Technical Reviewer: validates architecture, quality, and safety.
- Product Stakeholder: confirms business intent and acceptance criteria.
- Integration Owner: confirms compatibility with adjacent modules.

One person may hold multiple roles in small slices, but all responsibilities must still be covered.

## Weekly Cadence

- Planning checkpoint: confirm priorities and dependencies.
- Mid-cycle checkpoint: review risks, scope drift, and blockers.
- Completion checkpoint: verify tests, docs, and rollout readiness.

Cadence should be lightweight but consistent. Missing a checkpoint requires explicit rescheduling.

## Standard Status Fields

Each active package should track these fields:

- Package ID
- Objective
- Owner
- Current state
- Dependencies
- Risks
- Decision required
- Verification status
- Target date

## Risk and Escalation Rules

Escalate immediately when:

- a package is blocked for more than one business day
- a cross-module dependency threatens sequencing
- a schema or migration change increases release risk
- acceptance criteria conflict with architecture constraints

Escalation should include current status, impact, options, and recommendation.

## Evidence Requirements

Before marking Done, package records must include:

- summary of delivered behavior
- list of changed files or modules
- verification commands and outcomes
- unresolved follow-up items with owners

## Relationship to Other Documents

- Backlog defines planned packages and prioritization.
- Decisions captures architecture and policy choices.
- Definition of Done defines completion quality.
- Architecture and Project Context define boundaries and intent.

Control Center does not replace these documents; it coordinates their execution.
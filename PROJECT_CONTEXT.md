# Project Context

## Business purpose

EventOS is an operating system for event businesses. It is not merely booking software. The platform should help event teams understand what matters next, why it matters and what action to take.

The North Star is:

> EventOS tells event teams what matters next, why it matters, and what action to take.

## User groups

### ClientOS/EventOS users

ClientOS/EventOS is the private operating application for internal teams and business operators. It serves suppliers, planners, venues, coordinators and event companies that need operational clarity, governance and coordinated execution.

### Marketplace users

Marketplace is the public-facing experience for customers, brides, corporate clients and event organisers. It exposes published information and drives enquiries or bookings into the private operating system.

## Ecosystem model

EventOS uses one shared platform and one shared database with two separate application experiences:

- ClientOS/EventOS manages private operations and business execution.
- Marketplace surfaces public information and hands off customer intent to the private platform.

This split keeps the private operating system as the authoritative source for business rules, workflow state and records while allowing public-facing experiences to remain lightweight and focused.

## Why this matters

The platform must support auditability, operational clarity, availability, finance, governance and action-oriented workflows. These concerns are foundational because event businesses need dependable execution, clear accountability and accurate records rather than isolated booking flows.

## Current repository snapshot

The current repository contains:

- a NestJS API under [apps/api](apps/api)
- a Next.js web application under [apps/web](apps/web)
- Prisma models and migration setup under [apps/api/prisma](apps/api/prisma)

The current implementation already includes organization CRUD and its related tests, while the wider product ecosystem is still being defined.

## Related documents

- [AGENTS.md](AGENTS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ROADMAP.md](ROADMAP.md)
- [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)

# M001 — CORE PRINCIPLES

**Product:** EventOS  
**Volume:** 01 — Core Principles  
**Version:** 1.0  
**Status:** Recovered from Approved Historical Architecture  
**Primary Source:** EC-001 — `Event OS` exported ChatGPT conversation

---

# 1. Purpose

This specification preserves the approved foundational principles that govern EventOS / ClientOS.

These principles define how the platform is designed and how all later modules must behave.

**Historical note:** the original approved constitution used numbered decisions. `Decision 004 — Marketplace Philosophy` is intentionally excluded from this volume and recovered under **M003 — Marketplace Philosophy**. The historical numbering is otherwise preserved.

---

# 2. Decision 001 — What is ClientOS?

## Decision

ClientOS is an **AI-first Business Operating System**.

Its purpose is to remove as much repetitive administration as possible while allowing the business owner to remain in complete control.

ClientOS is **not**:

- an Event Management System;
- a CRM;
- an ERP; or
- an Inventory System.

Those are capabilities inside ClientOS.

## Purpose

ClientOS exists to let business owners spend their time:

- serving customers;
- growing the business; and
- making decisions;

instead of:

- creating paperwork;
- updating spreadsheets;
- copying data;
- chasing suppliers; and
- manually creating documents.

## Core Objective

Every feature must answer:

> **Does this reduce manual administration?**

If the answer is no, it should not be built as a core EventOS capability.

## Development Impact

Every module must eventually support AI automation.

No module should require unnecessary manual data entry.

**Status:** Approved

---

# 3. Decision 002 — AI Philosophy

## Decision

Every capability in ClientOS must support three operating modes.

### Mode 1 — Manual

The user performs every action.

### Mode 2 — Guided

AI assists.

The user approves.

### Mode 3 — Autonomous

The user gives a high-level instruction.

AI performs repetitive work.

The user confirms important actions.

## Example

### Manual

The user completes the Create Event workflow manually.

### Guided

AI suggests:

- chairs;
- lighting;
- tasks; and
- suppliers.

The user accepts, rejects or edits the suggestions.

### Autonomous

The user can provide a high-level brief such as:

```text
Wedding
250 guests
Pretoria
Budget R450 000
```

AI may prepare the required EventOS work from that instruction.

## Important Rule

> **AI never removes manual control.**

Manual operation must always remain available.

## Development Impact

Manual and AI interaction must use the same underlying business capabilities.

**Status:** Approved

---

# 4. Decision 003 — Data Ownership

## Decision

Businesses always own their private business data.

ClientOS does not claim ownership of:

- Contacts;
- Events;
- Internal Inventory;
- Tasks;
- Notes;
- Financials; or
- Documents.

These belong to the business.

Marketplace data becomes visible only when the owner explicitly publishes it.

Publishing is optional.

## Marketplace Platform Data

Marketplace controls its platform-level functions including:

- Marketplace search;
- Marketplace rankings;
- Marketplace recommendation engine;
- Marketplace AI;
- Marketplace analytics; and
- Marketplace reputation system.

## Development Impact

Business objects must support visibility states appropriate to their domain, including the concepts of:

- Private;
- Published; and
- Archived.

**Status:** Approved

---

# 5. Decision 005 — The Golden Rule

## Decision

> **One Business Object. Multiple Ways To Create It.**

An Event may originate from:

- Manual workflow;
- AI;
- Marketplace Booking;
- Guided Wizard;
- future mobile applications; or
- other approved interfaces.

All routes create the **same Event business object**.

The same rule applies to:

- Purchase Orders;
- Inventory / Resources;
- Bookings;
- Clients;
- Tasks; and
- other EventOS business objects.

## Development Impact

Never create parallel objects such as:

```text
AIEvent
MarketplaceEvent
WizardEvent
```

Use:

```text
Event
```

The interface may differ.

The business object and business rules do not.

**Status:** Approved

---

# 6. Decision 006 — User Interface Philosophy

## Decision

ClientOS has:

- one backend;
- one business engine; and
- multiple ways to interact with it.

A capability may be accessed through:

- Manual UI;
- Guided workflow;
- AI;
- Marketplace;
- future mobile applications;
- future voice interfaces; or
- approved APIs.

The backend must not contain separate business rules based on how a request originated.

## Development Impact

> **Never duplicate business logic. Only the interface may differ.**

**Status:** Approved

---

# 7. Decision 007 — AI Is an Employee

## Decision

AI is not merely a chatbot.

AI is treated as a member of the operating team and should perform work comparable to a competent employee.

AI capabilities may include:

- preparing quotations;
- creating events;
- preparing resource reservations;
- preparing Marketplace supplier bookings;
- generating purchase orders;
- sending approved reminders;
- scheduling deliveries; and
- generating reports.

## Development Impact

Every module must expose reusable actions/capabilities that AI can call.

EventOS must not build screens without also considering the business capability behind the screen.

**Status:** Approved

---

# 8. Decision 008 — Everything Begins With a Job

## Decision

ClientOS revolves around **Jobs**.

Examples:

- Event;
- Rental;
- Delivery;
- Installation;
- Maintenance call.

A Job determines which workflows are required.

## Examples

### Wedding

May require:

- chairs;
- flowers;
- lighting;
- catering.

### Equipment Rental

May require:

- inventory;
- delivery;
- return.

### Lighting Installation

May require:

- electricians;
- equipment;
- testing.

## Development Impact

Workflows must be designed around Jobs rather than being hard-coded only around Events.

This principle preserves EventOS's ability to support related service and rental businesses without redesigning the core platform.

**Status:** Approved

---

# 9. Decision 009 — Transaction Engine Principle

## Decision

Commercial / operational transactions should follow a common lifecycle where applicable:

```text
Need
↓
Plan
↓
Reserve
↓
Approve
↓
Pay
↓
Deliver
↓
Execute
↓
Return (if rental)
↓
Inspect
↓
Close
↓
Analyse
```

The same underlying transaction philosophy can support:

- hiring chairs;
- buying flowers;
- renting generators;
- hiring security;
- and other future requirements.

## Development Impact

Do not create completely unrelated transaction engines for every industry or resource type where a common lifecycle can be used.

**Status:** Approved

---

# 10. Decision 010 — Marketplace Trust

## Decision

Marketplace depends on user trust.

Therefore:

- availability must be live;
- inventory/resource information must be accurate;
- bookings must be reliable;
- payments must be traceable; and
- reviews must be genuine.

AI may recommend suppliers.

AI must not:

- fabricate reviews; or
- manipulate rankings.

## Development Impact

Marketplace features must strengthen trust and auditability.

Convenience must not override trust.

**Status:** Approved

---

# 11. Decision 011 — Human Approval

## Decision

> **AI may prepare. Humans approve.**

Examples:

```text
AI creates quotation
↓
Human approves
```

```text
AI prepares supplier reservation
↓
Human approves
```

```text
AI creates purchase order
↓
Human approves
```

```text
AI suggests payment
↓
Human approves
```

Routine actions may later be automated when the business explicitly chooses to do so.

## Development Impact

AI workflows must clearly separate:

1. Preparation
2. Approval
3. Execution

**Status:** Approved

---

# 12. Decision 012 — The 80% Rule

## Decision

AI should perform approximately **80% of repetitive work**.

The remaining **20%** remains with the business owner or operator.

Human responsibility includes areas such as:

- judgement;
- customer relationships;
- negotiations;
- creativity; and
- exceptions.

## Development Impact

EventOS should not use AI to remove meaningful business judgement.

AI should remove administration and repetitive work while preserving human decision-making.

**Status:** Approved

---

# 13. The ClientOS Test

Before a major capability is approved, it should satisfy the following questions:

1. Does it reduce manual administration?
2. Can it be done manually?
3. Can AI perform a substantial portion of the repetitive work?
4. Does the user remain in control?
5. Does it strengthen the Marketplace or the business workflow?
6. Does it avoid duplicating data or business logic?
7. Will it still make sense at large platform scale and across supported business types?

These questions are architectural checks, not optional UI preferences.

---

# 14. Event Design as the Operational Centre

The final approved EventOS continuation state establishes:

> **The Event Design is the heart of EventOS. Everything else supports the Event Design.**

The approved operating chain is:

```text
Client Brief
↓
Event Design
↓
Requirement Engine
↓
Mood Board
↓
Procurement
↓
Commercial Workspace
↓
Asset Management
↓
Execution
↓
Finance
```

Later modules must maintain this relationship unless an explicitly approved architecture revision changes it.

---

# 15. Governing Architecture Rules

The following rules are therefore binding across later EventOS specifications:

1. AI-first does not mean AI-only.
2. Manual operation must remain available.
3. AI and manual workflows use the same validated business capabilities.
4. Important commitments require operator approval unless explicit automation authority is configured.
5. Business logic must not be duplicated between interfaces.
6. Private business data remains owned and controlled by the business.
7. Marketplace publication is explicit.
8. One business object must not be duplicated into AI-specific, Marketplace-specific or UI-specific variants.
9. EventOS should automate administration while preserving human judgement.
10. The Event Design and its resulting Requirements drive the event-delivery architecture.

---

# 16. Module Boundary

This volume defines **Core Principles only**.

The following are recovered separately:

- **M002 — Business Rules**
- **M003 — Marketplace Philosophy**
- **M004 — Event Design Studio**
- **M005 — Requirement Engine**
- **M006 — Mood Board Studio**
- **M007 — Procurement Studio**
- **M008 — Commercial Workspace**
- **M009 — Asset Management**
- **M010 — Event Execution**
- **M011 — Finance and Event Financial Control**

Marketplace-specific Decision 004 from the historical ClientOS Constitution is therefore intentionally not duplicated here.

---

# 17. Recovery Completion

**Recovery Status:** COMPLETE  
**Historical source checked:** YES  
**Superseded brainstorming excluded:** YES  
**Historical decision numbering preserved:** YES  
**Next Recovery Module:** M002 — Business Rules

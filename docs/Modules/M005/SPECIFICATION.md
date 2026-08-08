# M005 — REQUIREMENT ENGINE

**Product:** EventOS  
**Module:** M005 — Requirement Engine  
**Version:** 1.0  
**Status:** Complete  
**Primary Recovery Source:** EC-001 — Event OS exported historical conversation  
**Source Conversation ID:** `6a609950-2868-83ea-8c84-1eac2fc49600`  
**Primary Source Message IDs:** `0a55d39e-ac65-480f-b41c-b971b8810bcc`, `365782c8-e419-4f25-b516-17929952990c`, `6eaa8c9b-2bc3-4837-b989-c5da321d1861`  
**Completion and Boundary Evidence Message ID:** `f32611bf-7066-44ec-be20-e474c4d9479c`

---

# Purpose and Module Boundary

M005 preserves the approved Requirement Engine, Requirement Item and Requirement Relationships & Dependencies architecture.

The Requirement Engine converts planner design decisions into measurable, version-controlled business requirements. It receives the Client Brief and Event Design from M004 and produces the Requirement Set used by downstream modules.

The historical approved section numbering is preserved below. The final continuation snapshot and Master Module Register place historical Sections 4–6 together under final recovery module **M005 — Requirement Engine**.

---

# Section 4 — Requirement Engine

## Objective

Convert planner design decisions into measurable, version-controlled business requirements.

The planner never enters calculated quantities unless they intentionally override them.

## Inputs

The Requirement Engine receives data from:

- Client Brief
- Event Design

Example:

```text
Guests: 600
Table Type: Round
Guests per Table: 10
Chair Type: Gold Tiffany
Dinner: Plated
Theme: Black Tie
```

## Outputs

The engine generates **Requirement Items**. Each requirement is an independent object.

| ID | Category | Requirement | Qty | Unit | Status |
|----|----------|-------------|----:|------|--------|
| R-001 | Furniture | Round Tables | 60 | Each | Pending |
| R-002 | Furniture | Gold Tiffany Chairs | 600 | Each | Pending |
| R-003 | Linen | Black Tablecloths | 60 | Each | Pending |
| R-004 | Décor | Low Centrepieces | 60 | Each | Pending |
| R-005 | Catering | Main Meals | 600 | Each | Pending |

This table becomes the procurement input.

## Requirement Status

Every requirement has a lifecycle.

| Status | Meaning |
|---------|---------|
| Draft | Created by the Requirement Engine |
| Reviewed | Planner has checked it |
| Approved | Ready for procurement |
| In Procurement | RFQs being generated |
| Partially Fulfilled | Some suppliers selected |
| Fulfilled | Supplier(s) appointed |
| Cancelled | Removed from event |

## Planner Overrides

The planner may override any generated requirement.

```text
AI calculates: 60 Round Tables
Planner changes to: 58 Round Tables
Reason: VIP table layout
```

The override is recorded. The Requirement Engine will **not** recalculate this item unless the planner removes the override.

## Requirement Relationships

Requirements can depend on one another.

```text
Guests
    ↓
Tables
    ↓
Tablecloths
    ↓
Centrepieces
```

Changing **Guests** recalculates everything below unless an override exists.

## Requirement Groups

Requirements are grouped for procurement.

```text
Furniture
- Tables
- Chairs
- Cocktail Tables

Décor
- Flowers
- Candles
- Centrepieces

Catering
- Meals
- Drinks
- Crockery
- Cutlery

Lighting & AV
- Stage Lighting
- Screens
- Audio

Staff
- Waiters
- Security
- Technicians
```

Each group can later be procured independently.

## Version Control

Requirements are never overwritten.

```text
Requirement Set V1
600 Guests
    ↓
Requirement Set V2
520 Guests
```

EventOS stores:

- Added requirements
- Removed requirements
- Changed quantities
- Planner overrides

## Deliverable

The Requirement Engine produces one output only:

> **Requirement Set Version X**

Every downstream module uses this exact version:

- Mood Board
- Marketplace
- RFQs
- Quotations
- Purchase Orders
- Budget
- Resource Planning
- Logistics

---

# Section 5 — Requirement Item

## Objective

A Requirement Item represents **one business requirement** that must be fulfilled to deliver the event.

It is the smallest unit that can be:

- Designed
- Procured
- Quoted
- Purchased
- Allocated
- Scheduled
- Delivered
- Tracked

## Requirement Item Structure

### 1. Identity

| Field | Description |
|--------|-------------|
| Requirement ID | Unique identifier |
| Requirement Version | Version number |
| Event ID | Parent Event |
| Category | Furniture, Catering, Décor, etc. |
| Requirement Type | Product, Service or Resource |

### 2. Description

| Field | Description |
|--------|-------------|
| Name | Gold Tiffany Chair |
| Description | Gold Tiffany Chair with white cushion |
| Specification | Colour, size, material, finish |
| Images | Planner references (optional) |

### 3. Quantity

| Field | Description |
|--------|-------------|
| Quantity Required | 600 |
| Unit | Each, Hour, m², kg, etc. |
| Quantity Source | AI Calculated / Planner Override / Manual |
| Planner Override | Yes/No |
| Override Reason | Optional |

### 4. Timing

- Delivery Date
- Collection Date
- Setup Date
- Removal Date
- Required Time

### 5. Location

- Venue
- Delivery Area
- Setup Area
- GPS (optional)

### 6. Procurement Status

- Draft
- Reviewed
- Approved
- In Procurement
- Supplier Selected
- Ordered
- Delivered
- Completed

### 7. Supplier Allocation

Initially empty. Later populated with:

- Primary Supplier
- Secondary Supplier(s)
- Own Stock
- Marketplace Stock
- External Procurement

### 8. Commercial Information

Initially empty. Later contains:

- Estimated Budget
- Quoted Price
- Approved Price
- Actual Cost

### 9. AI Information

- AI Confidence
- AI Recommendation
- Alternative Suggestions
- Similar Marketplace Items
- Risk Warnings

### 10. Audit Trail

Every change is recorded.

```text
09:15
AI calculated quantity

09:18
Planner changed quantity
600 → 580

Reason:
Existing venue furniture

09:22
Requirement approved
```

Nothing is overwritten.

## Requirement Item Relationships

Each Requirement Item may link to:

- Client Brief
- Event Design Version
- Mood Board
- Marketplace Listings
- RFQs
- Quotations
- Purchase Orders
- Delivery Notes
- Invoices

This creates complete traceability.

## Fulfilment Strategy

Every Requirement Item stores how it is intended to be fulfilled, even before procurement starts.

| Strategy | Meaning |
|----------|---------|
| Own Inventory | Use our own stock |
| Marketplace | Procure through Marketplace |
| External Supplier | Procure externally |
| Hybrid | Combination of own stock and procurement |
| Undecided | Planner has not decided yet |

Example:

```text
Requirement
600 Tiffany Chairs

Strategy
Hybrid

Own Stock
250

Marketplace
350
```

This allows AI to know where to start when procurement begins.

---

# Section 6 — Requirement Relationships & Dependencies

## Objective

Allow EventOS to automatically identify which Requirement Items are affected when a planner changes part of the event design.

The planner changes **one decision**. EventOS identifies every affected requirement. The planner approves the changes. Nothing updates automatically without review.

## Dependency Levels

### Level 1 — Direct Dependency

Changing one value directly changes another. No interpretation is required.

```text
Guests
    ↓
Number of Chairs
```

### Level 2 — Calculated Dependency

The Requirement Engine performs a calculation.

```text
Guests
    ↓
Guests per Table
    ↓
Tables Required
```

### Level 3 — Design Dependency

The planner changes a design decision. No quantities change unless necessary.

```text
Round Tables
    ↓
Round Linen
    ↓
Round Centrepieces
    ↓
Floor Layout
```

## Dependency Tree

```text
Guest Count
│
├── Chairs
├── Meals
├── Name Cards
├── Gifts
├── Waiters
│
└── Tables
      │
      ├── Linen
      ├── Centrepieces
      ├── Candles
      └── Floor Layout
```

## Change Detection

When Guest Count changes from 600 to 520, EventOS immediately produces an Impact Report such as:

```text
Furniture
✔ Chairs: 600 → 520
✔ Tables: 60 → 52

Decor
✔ Centrepieces: 60 → 52
✔ Linen: 60 → 52

Catering
✔ Meals: 600 → 520
✔ Desserts: 600 → 520

Staff
✔ Waiters: 12 → 11

Transport
✔ Truck Space: Reduced
```

Nothing changes until the planner approves.

## Planner Approval

```text
Changes Detected

17 Requirement Items affected

Approve
Review Individually
Cancel
```

The planner always remains in control.

## Planner Overrides

If the planner previously overrode a value, EventOS never silently changes it.

```text
Planner Override Detected

58 Tables

AI recommends
52 Tables

Keep Override
Recalculate
Review
```

This prevents the planner's work from being lost.

## Dependency Rules

Every Requirement Item stores its dependencies.

```text
Requirement
Gold Tiffany Chairs

Depends On
Guest Count
Seating Layout
```

```text
Requirement
Round Linen

Depends On
Table Shape
Number of Tables
```

This makes the engine reusable across every industry.

## Circular Dependency Protection

No Requirement Item may depend back on itself.

```text
Guests
    ↓
Tables
    ↓
Guests
```

This is not allowed. The dependency graph must always remain one-way.

## Version Control

Every approved dependency change creates a new Requirement Set Version. Nothing is overwritten.

## Requirement Impact Report

This is the deliverable from the Dependency Engine.

```text
Event Design Version 4
    ↓
Requirement Set Version 4
    ↓
Impact Report

Affected Items: 23
New Items: 2
Removed Items: 4
Planner Overrides: 3
Requires Procurement Review: YES
```

## Business Dependency

A design change can affect more than Requirement Items. Changing Guest Count can also affect:

- Existing RFQs
- Supplier quotations
- Purchase Orders
- Mood Board
- Budget
- Resource allocations
- Delivery schedules
- Staffing schedules

The Impact Report identifies the wider business impact before the planner commits the change.

```text
Business Impact

Requirement Items: 23
Mood Board: Needs Review
Supplier Quotations: 4 affected
Purchase Orders: Not yet issued
Budget: Reduced by R84,500
Delivery Schedule: Review Required
```

## Governing Rule

> **Nothing downstream changes automatically. Everything downstream is identified automatically. The planner decides what to update.**

---

# Cross-Module Continuity

- M004 hands the Client Brief and Event Design to M005; M005 returns version-controlled Requirement Items and Requirement Sets.
- Planner overrides, review and approval preserve the manual control required by M001.
- No supplier reservation, RFQ, order, payment or other irreversible commercial commitment is authorised by this module, preserving M002 BR-002.
- Marketplace references remain downstream links and fulfilment options; M005 does not duplicate supplier inventory, preserving M002 BR-001 and M003.
- Requirement Groups and Requirement Set versions provide the approved handoff to Mood Board and later procurement modules.

No contradiction with M001–M004 was identified.

---

# Recovery Completion

M005 is recovered when the following approved architecture is preserved:

- Requirement Engine inputs, generated Requirement Items, lifecycle, grouping, overrides and versioned output.
- Requirement Item identity, description, quantity, timing, location, procurement status, supplier allocation, commercial information, AI information and audit trail.
- Requirement Item relationships and fulfilment strategy.
- Direct, calculated and design dependency levels.
- Dependency trees, one-way graph protection and stored dependency rules.
- Change detection, planner review, override protection and Requirement Impact Reports.
- Business Dependency impact reporting across downstream modules.
- The rule that downstream impact is identified automatically but changes require planner decision.

**Recovery Status:** COMPLETE  
**Next Module:** M006 — Mood Board Studio

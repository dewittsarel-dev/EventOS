# M008 — COMMERCIAL WORKSPACE

**Product:** EventOS  
**Module:** M008 — Commercial Workspace  
**Version:** 1.0  
**Status:** Complete  
**Primary Recovery Source:** EC-001 — Event OS exported historical conversation  
**Source Conversation ID:** `6a609950-2868-83ea-8c84-1eac2fc49600`  
**Primary Source Message IDs:** `80064843-c313-4021-9165-71aacdea247d`, `21bc5986-a22a-4c59-be8a-be67f27c368e`  
**Operator Continuation Message IDs:** `634d98a4-e296-4c8f-8964-20607647a006`, `f127ef84-80a6-4958-b07a-b0790457a8cd`  
**Completion Evidence Message ID:** `25ed1adf-3e93-4a06-a19e-dfef772ae8c6`

---

# Recovery Numbering and Supersession Note

The historical architecture first labels the structured quotation lifecycle `MODULE-004 — RFQ Studio` and then explicitly replaces separate RFQ, quotation, negotiation and revision modules with `MODULE-005 — Commercial Workspace`.

Under the final recovery numbering established by the Master Module Register, the approved combined architecture is recovered as **M008 — Commercial Workspace**.

RFQ is preserved as the first message and structured starting point in the commercial conversation. It is not preserved as a separate final module.

---

# Objective

Generate, distribute, manage and compare supplier quotations while maintaining complete traceability back to:

- Client Brief
- Event Design
- Requirement Set
- Mood Board
- Procurement Solution

An RFQ is **never created in isolation**.

Commercial Workspace replaces the traditional RFQ → Quote → Email → Revision mess.

Everything happens in **one conversation**.

---

# Stage 1 — RFQ Creation

The planner selects a Procurement Solution.

Example:

```text
Furniture

Solution 2

Supplier A
Supplier C
```

The planner clicks:

> Generate RFQs

AI prepares them.

Nothing is sent yet.

---

# Stage 2 — RFQ Builder

The RFQ is not just a PDF.

It is a structured document.

Example:

```text
RFQ

Furniture Package

Requirements

- 60 Round Tables
- 600 Gold Tiffany Chairs
- 60 Black Tablecloths
- 60 Centrepieces

Delivery

5 September

Collection

6 September

Venue

Sandton Convention Centre

Special Notes

Black Tie Corporate Dinner
```

Every Requirement Item remains linked.

---

# Stage 3 — Planner Review

The planner may:

- Remove items
- Add items
- Change quantities
- Add notes
- Split packages
- Duplicate RFQs

Nothing leaves EventOS yet.

---

# Stage 4 — RFQ Distribution

The planner approves.

EventOS sends the RFQs.

The supplier receives:

- Structured RFQ
- PDF copy
- Event summary
- Submission deadline

---

# Stage 5 — Supplier Workspace

The supplier never receives a blank form.

The supplier sees:

```text
Furniture Package
        ↓
Requirement Items
        ↓
Suggested own inventory
        ↓
Availability
        ↓
Pricing
```

ClientOS already knows the supplier's inventory.

It pre-fills everything possible.

The supplier adjusts prices or quantities.

---

# Stage 6 — AI Quote Assistant

The supplier selects:

```text
Generate Draft Quote
```

AI prepares:

- Prices
- Totals
- VAT
- Delivery
- Collection
- Terms

The supplier edits.

The supplier approves.

The supplier sends.

---

# Stage 7 — Quote Comparison

The planner never compares PDFs.

The planner compares Requirement Items.

Example:

| Requirement | Supplier A | Supplier B | Supplier C |
|------------|-----------:|-----------:|-----------:|
| Tables | R18,000 | R17,800 | R18,400 |
| Chairs | R48,000 | R49,500 | R46,000 |
| Linen | R9,000 | R9,100 | Included |
| Centrepieces | R15,000 | R14,800 | R16,200 |

AI immediately highlights:

- Lowest cost
- Highest confidence
- Missing items
- Qualification notes
- Delivery differences

No manual spreadsheet is required.

---

# Stage 8 — AI Recommendation

AI never says:

> Choose Supplier A.

Instead it presents solutions.

Example:

```text
Solution A

✔ Lowest Cost

✔ Meets Procurement Policy

Risk

Medium

Reason

Three suppliers

-----------------------------------

Solution B

✔ Highest Confidence

✔ One supplier

Cost

4% higher
```

The planner decides.

---

# Stage 9 — Award

The planner awards:

- Entire package

or

- Individual Requirement Items

Everything remains linked.

---

# Stage 10 — Purchase Order Generation

Only after award are Purchase Orders prepared.

They are:

- Prepared by AI.
- Approved by the planner.
- Sent only after approval.

---

# Commercial Workspace

The planner does not think only in terms of sending RFQs. The planner needs prices and then needs to manage the resulting commercial process.

After a supplier quotes, the following all happen inside the same workspace:

- Negotiation
- Revisions
- Substitutions
- AI recommendations
- Clarification
- Approvals

An RFQ is the **first message** in that commercial conversation.

Instead of separate modules for:

- RFQs
- Quotations
- Negotiations
- Revisions

they form one **Commercial Workspace**.

For a Furniture Package, the planner sees:

- RFQs sent
- Supplier responses
- AI comparisons
- Clarifications
- Negotiation history
- Quote revisions
- Award decision
- Purchase Orders

Everything remains in one place.

---

# Commercial Workspace Example

```text
Furniture Package

Status

🟢 Active

----------------------------------------------------

Buyer

ABC Events

Supplier

Premium Furniture Hire

----------------------------------------------------

Timeline

RFQ Sent

Supplier Questions

Quote V1

Planner Comments

Quote V2

Awarded

Purchase Order

----------------------------------------------------
```

Everything is together.

No emails.

No searching.

No PDFs scattered everywhere.

---

# Supplier Discussion

Real-world supplier discussion belongs to one commercial conversation.

Example:

Supplier says:

> We don't have Gold Tiffany Chairs.

Planner replies:

> What about Clear Ghost Chairs?

Supplier replies:

> Available.

Planner replies:

> Please update the quotation.

---

# Quote Revisions

Instead of disconnected files such as:

```text
Quote.pdf
Quote Final.pdf
Quote Final NEW.pdf
```

EventOS stores:

```text
Quote V1
    ↓
Quote V2
    ↓
Quote V3
```

Every difference is visible.

---

# AI Substitution Assistance

AI can identify the cross-module effect of a supplier substitution.

Example:

```text
Supplier substituted:

Gold Tiffany Chairs
        ↓
Ghost Chairs

This will affect:

✔ Mood Board

✔ Furniture Requirement

✔ Budget

Would you like to review?
```

The planner approves the change.

The Requirement changes.

The Mood Board changes.

Procurement updates.

Everything remains synchronised.

---

# Negotiation

Negotiation happens inside EventOS.

Example:

Supplier quotes:

```text
600 Chairs

R90 each
```

Planner replies:

> If I increase to 650 chairs, can you reduce to R85?

The negotiation does not move to Outlook.

---

# Commercial Timeline

Everything becomes part of the permanent audit trail.

Example:

```text
09:12 RFQ Created

09:20 Supplier Asked Question

09:28 Planner Replied

10:05 Quote V1

10:30 Negotiation Started

11:15 Quote V2

11:40 Awarded

11:45 Purchase Order Generated
```

Nothing gets lost.

---

# AI Negotiation Assistant

AI provides negotiation assistance.

AI does not negotiate automatically.

Example:

The planner opens Quote V2.

AI says:

```text
Market Analysis

Average Chair Price

R92

Quoted Price

R97

This quotation is approximately 5% above current Marketplace average.

Would you like me to prepare a negotiation response?
```

The planner selects:

```text
Prepare Response
```

AI drafts:

> Thank you for your quotation. Based on current market pricing, would you be willing to reconsider the chair rate if the quantity increases to 650 units?

The planner edits.

The planner sends.

AI never negotiates by itself.

---

# Governing Architectural Decision

> **EventOS should never think in documents. It should think in Conversations.**

Every commercial package has:

- RFQs
- Questions
- Clarifications
- Quote revisions
- AI comments
- Negotiation
- Award
- Purchase Orders

All exist in **one Commercial Workspace**.

---

# Module Boundary and Handoff

Commercial Workspace completes the front-office commercial flow:

- Event Design Studio
- Requirement Engine
- Mood Board Studio
- Procurement Studio
- Commercial Workspace

The module ends after award and controlled Purchase Order generation.

The next final recovery module is **M009 — Asset Management**.

Historical Execution Studio material is superseded as a final module boundary by M010 — Event Execution and is not recovered under M008 or started here.

---

# Cross-Module Continuity

- M005 Requirement Items remain linked throughout RFQ, quotation, award and Purchase Order activity.
- M006 Mood Board and M005 Requirement changes caused by substitutions remain reviewable and version-aware.
- M007 supplies the selected Procurement Solution and Buyer Policy used for comparison and recommendation.
- AI prepares RFQs, draft quotations, comparisons, negotiation responses and Purchase Orders, while authorised humans approve and send them, preserving M001 and M002 BR-002.
- AI recommendations remain solution-based and explainable, preserving M002 BR-022, M002 BR-023 and M007.
- Supplier inventory remains in the supplier's ClientOS workspace and is used to pre-fill supplier responses, preserving M002 BR-001 and M003.
- Permanent timelines, visible revisions and linked records preserve traceability and non-destructive history.

No contradiction with M001–M007 was identified.

---

# Recovery Completion

M008 is recovered when the approved architecture above is preserved, including:

- Structured RFQ creation, review, approval and distribution.
- Supplier Workspace and AI Quote Assistant.
- Requirement Item-level quote comparison and solution-based recommendations.
- Package or item-level award and controlled Purchase Order preparation.
- Consolidation of RFQs, quotations, questions, clarification, negotiation, revisions, awards and Purchase Orders into one Commercial Workspace.
- Versioned quotations and permanent commercial timeline.
- Cross-module substitution impact review.
- Human-controlled AI negotiation assistance.
- Conversation-based commercial architecture rather than disconnected documents.

**Recovery Status:** COMPLETE  
**Next Module:** M009 — Asset Management

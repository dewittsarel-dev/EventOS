# M004 — EVENT DESIGN STUDIO

**Product:** EventOS  
**Module:** M004 — Event Design Studio  
**Version:** 1.0  
**Status:** Recovered Specification  
**Primary Recovery Source:** EC-001 — Event OS exported historical conversation  
**Source Conversation ID:** `6a609950-2868-83ea-8c84-1eac2fc49600`  
**Primary Source Message IDs:** `dea90b5c-5325-4f72-9927-829d7081b121`, `d155afc5-1ee1-4352-bdf9-380cd40731e6`, `a6cac3a2-2f48-4754-89a9-207e6857b12a`  
**Boundary Evidence Message ID:** `25ed1adf-3e93-4a06-a19e-dfef772ae8c6`

---

# 1. Purpose

M004 defines how EventOS converts a client idea into a planner-approved event design.

Recovered objective:

Enable an event planner to convert a client's brief into a complete, version-controlled event design that later drives Marketplace Procurement, RFQs, Quotations, Purchase Orders, Scheduling, Resource Planning, Budgeting, Mood Boards and Execution.

Recovered gating rule:

Nothing gets procured until the planner is satisfied with the design.

---

# 2. Core Architecture

Recovered architecture from the approved Event Design Studio flow:

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
```

Recovered architectural principle:

The Event Design is the heart of EventOS. Downstream commercial and operational modules exist to deliver the approved design.

---

# 3. Section 1 — Client Brief (LOCKED)

Recovered locked section:

Fields:

- Client
- Event Name
- Event Date(s)
- Venue
- Expected Guests
- Budget
- Dress Code
- Event Type
- Client Objectives
- Initial Requirements
- Notes
- Attachments

Output:

Client Brief Version 1.

Recovered constraint:

Client Brief captures client-known facts only. No procurement actions and no supplier/product commitments are made at this stage.

---

# 4. Section 2 — Event Design

Recovered section intent:

This is the first screen after the Client Brief.

The planner makes design decisions only.

Recovered section structure:

| Category | Planner Defines |
|---|---|
| Seating | Table type, guests per table, chair type |
| Decor | Theme, colours, flowers, centrepieces |
| Catering | Service style, menu |
| Entertainment | Band, DJ, MC, performers |
| Lighting & AV | Lighting style, screens, sound |
| Branding | Signage, banners, registration |
| Infrastructure | Toilets, generators, fencing, tents |
| Staffing | Waiters, security, cleaners, technicians |

Recovered constraints:

- Planners think in categories, not database tables.
- The planner never enters calculated quantities in Event Design.
- AI may suggest options; planner accepts, rejects or edits.
- No automatic commercial commitment is made from suggestions.

---

# 5. Governance Rules Recovered In M004 Scope

1. Design decisions create requirements.
2. Planner judgement remains authoritative; AI assists but does not auto-commit.
3. Event design must be version controlled so revised briefs create new approved design states rather than destructive overwrite.
4. Procurement remains gated by planner design approval.

These rules stay consistent with M001 Decision 002 and M002 BR-002.

---

# 6. Module Boundary and Handoffs

Authoritative boundary evidence in the final continuation snapshot lists completed modules separately as:

- Event Design Studio
- Requirement Engine
- Requirement Item
- Requirement Dependencies
- Mood Board Studio

Therefore, for final recovery numbering:

- M004 preserves Event Design Studio core architecture and locked sections above.
- Requirement Engine, Requirement Item and Requirement Dependencies are recovered under M005 as defined by the Master Module Register governance note.

Handoff from M004:

Approved Event Design outputs feed Requirement Engine processing in M005, then Mood Board and Procurement modules.

---

# 7. Completion Criteria

M004 is recovered when the following approved architecture is preserved:

- Event Design Studio objective and procurement gate.
- Core architecture sequence from Client Brief through Event Design into Requirement Engine.
- Locked Client Brief field set and Client Brief Version output.
- Event Design category-based decision model.
- Explicit planner-control and AI-assistance constraints.
- Version-controlled design intent and downstream handoff boundaries.

**Recovery Status:** COMPLETE

**Next Module:** M005 — Requirement Engine
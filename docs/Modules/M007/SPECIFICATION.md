# M007 — PROCUREMENT STUDIO

**Product:** EventOS  
**Module:** M007 — Procurement Studio  
**Version:** 1.0  
**Status:** Complete  
**Primary Recovery Source:** EC-001 — Event OS exported historical conversation  
**Source Conversation ID:** `6a609950-2868-83ea-8c84-1eac2fc49600`  
**Primary Source Message IDs:** `07cf25e0-5030-4efd-bd5b-b479004f9746`, `c9c36a8b-0e10-43b1-be40-5899123c8825`, `15a2ce63-9483-4ac6-b40c-d84770da5105`  
**Operator Approval Message IDs:** `76b65657-7d9b-48f7-bba0-0d5a76d28ec5`, `dff9caab-59db-4cb9-91f5-3e789f226006`, `f577c5f7-6d52-448f-95c7-e6bf55e9add1`  
**M008 Boundary Message ID:** `80064843-c313-4021-9165-71aacdea247d`  
**Completion Evidence Message ID:** `25ed1adf-3e93-4a06-a19e-dfef772ae8c6`

---

# Recovery Numbering Note

The approved historical specification labels this architecture `MODULE-003 — Procurement Studio`.

Under the final recovery numbering established by the Master Module Register, it is recovered as **M007 — Procurement Studio**.

The historical `MODULE-004 — RFQ Studio` begins after the planner chooses a Procurement Solution and requests quotations. It is not silently incorporated into M007 during this recovery. Its final placement must be verified when recovering M008 — Commercial Workspace, as required by the Master Module Register.

---

# Architectural Purpose

Procurement Studio is where the Event Design becomes commercial.

The approved operating principles are:

> **The planner designs.**  
> **EventOS calculates.**  
> **The planner approves.**  
> **AI procures.**

---

# Procurement Studio Workflow

```text
Client Brief
        ↓
Event Design
        ↓
Requirement Engine
        ↓
Mood Board
        ↓
Procurement Studio
```

Nothing before Procurement Studio involves suppliers.

---

# Screen 1 — Procurement Dashboard

Instead of a list of products, the planner sees Requirement Groups.

Example:

```text
Furniture

● Ready

Decor

● Ready

Catering

● Ready

Lighting

● Ready

Branding

● Ready
```

Each group can be procured independently.

---

# Furniture Group

The planner opens Furniture and immediately sees:

```text
Requirements

60 Round Tables

600 Gold Tiffany Chairs

60 Black Tablecloths

60 Centrepieces
```

AI immediately analyses:

```text
Marketplace Analysis

Furniture

8 Suitable Suppliers

Confidence

97%
```

The planner has not searched yet.

---

# AI Suggestions

Instead of saying:

> Search Marketplace

AI presents Recommended Solutions.

```text
Recommended Solutions

Solution 1

Single Supplier

Estimated

R248 000

★★★★★

-----------------------------------

Solution 2

Supplier A

Supplier B

Estimated

R239 000

★★★★★

-----------------------------------

Solution 3

Lowest Cost

3 Suppliers

R228 000

★★★★☆
```

AI recommends **Solutions**, not suppliers.

---

# Solution Details

The planner opens Solution 2.

```text
Supplier A

60 Tables

400 Chairs

Supplier B

200 Chairs

Total

600 Chairs

Estimated Delivery

08:00

Confidence

96%
```

The planner chooses:

```text
Request Quotations
```

Only now are RFQs prepared.

Nothing has been sent.

---

# Planner Review

AI prepares RFQs.

The planner reviews them.

The planner may:

- Remove suppliers.
- Add suppliers.
- Change quantities.
- Split differently.

Only after approval are RFQs sent.

The approved flow is:

```text
Requirement
        ↓
AI
        ↓
Solutions
        ↓
Planner
        ↓
RFQs
```

---

# Procurement Strategy

EventOS never recommends a supplier.

It recommends a **Procurement Strategy**.

Example:

```text
Strategy A

One supplier

Higher price

Lower risk

-----------------------------------

Strategy B

Two suppliers

Lower price

Very low risk

-----------------------------------

Strategy C

Three suppliers

Lowest price

Higher logistics
```

The planner chooses the strategy.

AI presents the options.

Most procurement systems answer:

> **Who can sell me 600 chairs?**

EventOS answers:

> **Here are the five best ways to fulfil your furniture requirements, with the advantages and disadvantages of each.**

---

# Procurement Packages

Related requirements can be kept together as a Procurement Package.

Example package:

- Tables
- Chairs
- Linen
- Centrepieces

## Option A — Package Procurement

Supplier A gets everything because they can supply the complete furniture package.

## Option B — Item Optimisation

Supplier A gets tables.

Supplier B gets chairs.

Supplier C gets linen.

Supplier D gets centrepieces.

By default, EventOS should try to keep related requirements together because this creates:

- Fewer deliveries.
- Fewer suppliers to coordinate.
- Lower operational risk.
- Better accountability.
- Simpler setup on event day.

The planner can override this and split the package if it results in significant cost savings or another business advantage.

---

# Procurement Objectives

EventOS optimises for the buyer's objectives rather than applying one predefined rule.

Before procurement starts, the buyer or planner can set procurement priorities.

## Lowest Cost

AI may split work between several suppliers if it reduces cost.

## Lowest Risk

AI prefers fewer suppliers.

## Support Small Business

AI intentionally gives more weight to smaller suppliers where they remain commercially competitive.

## Sustainability

AI prefers suppliers closer to the venue.

## Existing Relationships

AI can favour suppliers the buyer has successfully used before.

## Balanced Marketplace

Instead of always choosing the largest supplier, AI can distribute work when multiple solutions are effectively equal.

Example:

```text
Supplier A: R100,000
Supplier B: R101,500
Supplier C: R102,000
```

AI can explain:

> The price difference is negligible. Awarding this package to Supplier B improves Marketplace diversity while maintaining commercial value.

EventOS must not artificially favour small companies. That would be unfair to large companies that have invested heavily.

EventOS must also not always favour the biggest company simply because it can supply everything.

---

# Buyer Policy

EventOS optimises according to **Buyer Policy**.

Every event can have procurement policies.

Example:

```text
Procurement Policy

☑ Minimise Cost

☑ Minimise Suppliers

☐ Support Emerging Businesses

☑ Prefer Local Suppliers

☐ Environmental Preference

☑ Reliability Above 95%

Maximum Suppliers per Package: 2
```

The AI therefore has explicit objectives.

EventOS distinguishes between:

- **Commercial optimisation** — best for this event.
- **Marketplace optimisation** — best for the long-term health of the ecosystem.

Those two objectives are not always the same.

For a specific event, one supplier might genuinely be the best choice.

Across thousands of events, always rewarding size could make the Marketplace less competitive.

AI must not secretly manipulate results to keep the Marketplace balanced.

Instead:

- AI transparently optimises according to the buyer's chosen procurement policy.
- If the buyer values supplier diversity or supporting emerging businesses, they can include that as an optimisation goal.
- Otherwise, AI explains why it recommends a particular solution.

The governing principle is:

> **AI never has hidden objectives. It optimises according to explicit business policies selected by the planner or buyer.**

---

# BR-022 — Multiple Procurement Solutions

For every AI procurement search, EventOS presents:

- **Minimum:** 5 procurement solutions where 5 credible solutions exist.
- **Never:** A single recommended supplier.
- **Never:** Hide commercially viable alternatives.

AI advises.

The planner decides.

## Meaning of a Procurement Solution

A Procurement Solution is not simply another supplier.

| Solution | Description |
|----------|-------------|
| Solution 1 | Supplier A only |
| Solution 2 | Supplier B only |
| Solution 3 | Supplier A + Supplier C |
| Solution 4 | Supplier D + Supplier E |
| Solution 5 | Lowest cost using 3 suppliers |

These are five ways of delivering the requirement, not just five businesses.

## Solution Explanations

### Solution 1

- One supplier
- Highest confidence
- Lowest coordination effort
- Slightly higher cost

### Solution 2

- Two suppliers
- 6% lower cost
- One additional delivery

### Solution 3

- Three suppliers
- Lowest total cost
- Highest coordination effort

The planner can immediately understand the trade-offs.

The AI may still rank a large supplier first, but the planner sees other credible solutions.

This means:

- Large companies still compete fairly.
- Smaller companies still receive visibility.
- Buyers retain genuine choice.
- No monopoly is created by the software.

The final approved form of the rule is:

> **Present at least five credible procurement solutions whenever five exist. If fewer than five credible solutions exist, present all available solutions and explain why.**

Example:

```text
Furniture Procurement

3 credible solutions found

Reason:
Only three supplier combinations satisfy:
• Required dates
• Quantity
• Quality
• Procurement policy
```

The user must never be led to believe that the Marketplace is hiding suppliers.

---

# BR-023 — Explainability

Every AI recommendation must answer:

> **Why am I seeing this?**

For every Procurement Solution, EventOS provides a concise explanation such as:

- Lowest total cost.
- Highest fulfilment confidence.
- Fewest suppliers.
- Fastest delivery.
- Best match to your procurement policy.
- Highest proportion of own stock.
- Lowest logistics complexity.

No black-box recommendations.

---

# Module Boundary and Handoff

The approved Event Design → Requirement Engine → Mood Board → Procurement Studio flow is complete when the planner selects a Procurement Solution and chooses:

```text
Request Quotations from Solution 2
```

Procurement Studio ends with the request to generate quotations.

The next historical specification begins with generating, sending, tracking and comparing those quotations.

Under final recovery numbering, **M008 — Commercial Workspace** is the next module. Historical RFQ Studio content must be evaluated as part of that recovery boundary and is not recovered here.

---

# Cross-Module Continuity

- M004 supplies the approved Event Design and retains planner authority.
- M005 supplies Requirement Groups, Requirement Items, fulfilment strategies and impact governance.
- M006 supplies the approved visual design, Updated Requirement Set and Procurement Ready Status.
- Procurement analysis operates on Requirement Groups rather than isolated product searches.
- BR-022 and BR-023 remain identical in architectural meaning to the approved rules already preserved in M002.
- AI prepares solutions and RFQs, but the planner reviews and approves before anything is sent, preserving M001 human-control principles and M002 BR-002.
- Supplier combinations use live Marketplace information without creating duplicate supplier inventory, preserving M002 BR-001 and M003.

M006 permits passive use of supplier-published Marketplace objects in the Mood Board, while the M007 source states that nothing before Procurement Studio involves suppliers. These statements are consistent if “involves suppliers” marks the start of supplier-facing procurement analysis and action rather than the first passive reference to published supplier data. The wording boundary is recorded here rather than silently discarded.

No architectural contradiction with M001–M006 was identified.

---

# Recovery Completion

M007 is recovered when the approved architecture above is preserved, including:

- Requirement Group procurement and Marketplace analysis.
- AI-generated Procurement Solutions instead of a single supplier recommendation.
- Solution details, confidence, cost and supplier combinations.
- Planner review and approval before RFQs are sent.
- Procurement Strategies and Procurement Packages.
- Buyer-selected procurement objectives and policies.
- The prohibition on hidden AI objectives.
- Commercial and Marketplace optimisation distinctions.
- BR-022 Multiple Procurement Solutions.
- BR-023 Explainability.
- The handoff from selected Procurement Solution to quotation generation.

**Recovery Status:** COMPLETE  
**Next Module:** M008 — Commercial Workspace

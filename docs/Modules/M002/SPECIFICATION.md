# M002 — BUSINESS RULES

**Product:** EventOS
**Module:** M002 — Business Rules
**Version:** 1.0
**Status:** Recovered Specification
**Primary Recovery Source:** EC-001 — Event OS exported historical conversation

---

# 1. Purpose

This module contains the EventOS business rules that were explicitly approved and remained part of the final approved project state.

During the historical development conversation, many additional BR-numbered rules were proposed as Drafts.

Draft rules are NOT promoted into this specification unless the historical record shows explicit approval or later approved architecture depends on them.

This prevents brainstorming from becoming architecture.

---

# 2. BR-001 — Marketplace Supplier Eligibility

## Rule

**Only ClientOS businesses may become Marketplace suppliers.**

A Marketplace-only account cannot become a supplier.

A business must have a ClientOS workspace before it may sell, rent, publish products, publish services or otherwise act as a supplier through Marketplace.

## Reason

ClientOS is responsible for managing the supplier's operational source data, including:

- Products
- Rental inventory
- Services
- Pricing
- Availability
- Images
- Categories
- Quotations
- Purchase Orders
- Inventory
- Order fulfilment
- AI-assisted business operations

Marketplace must not maintain an independent supplier inventory system.

## Account Consequence

### Visitor

May:

- Browse Marketplace
- View suppliers
- View products/services

May not:

- Request quotations
- Place orders
- Sell

### Marketplace Buyer Account

May:

- Browse
- Search
- Request quotations
- Receive quotations
- Accept quotations
- Place orders
- Track relevant transactions

May not:

- Upload products
- Publish inventory
- Sell
- Rent as a supplier
- Become a Marketplace supplier

### ClientOS Business

May:

- Operate its private ClientOS workspace
- Buy through Marketplace
- Become a Marketplace supplier
- Publish eligible products/services/resources
- Receive RFQs
- Prepare and send quotations
- Manage fulfilment

## Valid Interaction Principle

Marketplace buyer without ClientOS → ClientOS supplier is valid.

ClientOS buyer → ClientOS supplier is valid.

ClientOS business → external supplier outside Marketplace is valid through external procurement workflows.

Marketplace-only supplier is NOT valid.

**Status:** APPROVED / LOCKED

---

# 3. BR-002 — AI Authority and Human Commercial Approval

## Rule

**AI may generate, analyse, search, calculate, validate, recommend and prepare drafts, but AI may not independently create an irreversible commercial, legal or financial commitment without operator approval.**

AI exists to remove repetitive work, not business responsibility.

## AI May

- Analyse requirements
- Search Marketplace
- Check availability
- Compare suppliers
- Compare prices
- Detect anomalies
- Read supported documents
- Prepare RFQ drafts
- Prepare quotation drafts
- Prepare purchase-order drafts
- Prepare invoice drafts
- Draft communications
- Recommend suppliers
- Recommend procurement solutions
- Calculate shortages
- Identify sourcing options

## AI May Not Independently

- Send an RFQ
- Reserve supplier stock
- Accept a quotation
- Send a quotation
- Issue a Purchase Order
- Issue an Invoice
- Approve a payment
- Publish a Marketplace listing
- Accept a contract
- Cancel a contract
- Delete important business records
- Create a financial commitment
- Promise fulfilment to a buyer

unless the authorised operator has explicitly approved the action or an explicitly approved future automation authority permits it.

## Governing Principle

AI prepares.

Humans approve.

Execution follows approval.

**Status:** APPROVED / LOCKED

---

# 4. BR-007 — Assistance Before Restriction

## Rule

**When a requested business action cannot be completed directly, EventOS should first attempt to provide practical solutions before preventing the action.**

EventOS should solve problems where reasonably possible instead of merely reporting that a problem exists.

## Inventory Example

Requirement:

120 chairs

Supplier available stock:

100 chairs

EventOS should not immediately stop the transaction.

It may instead identify:

- Additional Marketplace stock
- Matching secondary suppliers
- Suitable substitutes
- Partial fulfilment options
- Alternative dates
- Other practical sourcing solutions

Only where no credible solution exists should the action be treated as incapable of fulfilment.

## Wider Application

The same principle can apply to:

- Inventory
- Procurement
- Staffing
- Vehicles
- Equipment
- Venues
- Scheduling
- Budgets
- Logistics

## Important Constraint

BR-007 does NOT override BR-002.

Finding a solution does not give AI authority to:

- reserve stock,
- contact suppliers,
- accept quotations,
- issue orders, or
- create commitments

without required operator approval.

**Status:** APPROVED / LOCKED

---

# 5. BR-022 — Multiple Procurement Solutions

## Rule

**For AI-assisted procurement, EventOS must present at least five credible procurement solutions whenever five credible solutions exist.**

EventOS must not present only one AI-selected supplier or one hidden preferred solution when commercially viable alternatives exist.

If fewer than five credible solutions exist, EventOS presents all credible solutions and explains why fewer than five were available.

## Meaning of Procurement Solution

A procurement solution is not necessarily one supplier.

Examples:

- Supplier A only
- Supplier B only
- Supplier A + Supplier C
- Supplier D + Supplier E
- Lowest-cost combination across several suppliers

The objective is to present multiple credible ways to fulfil the Requirement.

## Purpose

The rule ensures:

- Buyer/planner choice
- Competitive procurement
- Marketplace fairness
- Visibility of alternatives
- Human control over award decisions

AI may rank solutions.

AI does not remove alternative credible choices.

**Status:** APPROVED / LOCKED

---

# 6. BR-023 — Explainability of AI Recommendations

## Rule

**Every material AI recommendation must explain why it is being shown.**

The operator must not be expected to trust an unexplained black-box recommendation.

## Procurement Examples

A recommendation may explain that it represents:

- Lowest total cost
- Highest fulfilment confidence
- Fewest suppliers
- Fastest delivery
- Best match to procurement policy
- Highest proportion of own stock
- Lowest logistics complexity
- Strongest date-valid availability

## Principle

AI advises.

The operator must be able to understand the basis of the advice before deciding.

**Status:** APPROVED / LOCKED

---

# 7. Rules Explicitly Not Frozen in M002

The historical conversation proposed additional rules including BR-003 through BR-006, BR-008 through BR-014 and other later rule candidates.

Several were explicitly labelled Draft during the original conversation.

They must therefore NOT be silently promoted to approved architecture through this recovery process.

Their underlying concepts may appear later inside approved module specifications where they were subsequently resolved.

This recovery rule prevents historical brainstorming from being mistaken for approved EventOS architecture.

---

# 8. Cross-Module Authority

All later EventOS modules must comply with the approved rules in M002.

At minimum:

- Marketplace must comply with BR-001.
- All AI-enabled modules must comply with BR-002.
- Problem-resolution workflows should comply with BR-007.
- AI Procurement must comply with BR-022.
- Material AI recommendations must comply with BR-023.

If a later recovered specification appears to contradict an approved M002 rule, the conflict must be reported rather than silently resolved.

---

# 9. Completion Criteria

M002 is recovered when the following approved rules are preserved:

- BR-001 — Only ClientOS businesses may become Marketplace suppliers.
- BR-002 — AI does not independently create irreversible commercial commitments.
- BR-007 — Assistance Before Restriction.
- BR-022 — At least five credible procurement solutions whenever five exist.
- BR-023 — AI recommendations must explain why they are being presented.

Draft historical rules remain excluded unless separately verified during later module recovery.

**Recovery Status:** COMPLETE

**Next Module:** M003 — Marketplace Philosophy

# ARCHITECTURE-002 Resource Engine Phase 1

## Purpose

Resource Engine introduces a generic capability boundary for rentable, sellable and usable business resources without replacing current Inventory, Suppliers, Purchase Orders or Events.

Phase 1 is architectural only.
No migration, no UI redesign and no behavior replacement occurs in this package.

## Current architecture

- Inventory owns current stock and storage workflows.
- Suppliers and Supplier Products own vendor and catalog relationships.
- Purchase Orders own procurement and receiving workflows.
- Events consume resources indirectly through current modules rather than through a dedicated generic resource capability.

This means the repository has working operational flows but no single resource-oriented abstraction that can later support chairs, vehicles, flowers, staff, generators or other industry-neutral assets under one model.

## Resource Engine architecture

### Capability boundary

Resource Engine is a standalone capability that manages resources without knowing domain-specific subtype semantics.

It does not assume whether a resource is:

- chair
- table
- generator
- flower
- vehicle
- staff member
- stage
- tent

It only manages generic resource lifecycle, availability and reservation interfaces.

### Relationships to existing capabilities

- Resources are not marketplace listings.
- Marketplace listings will later become published projections of selected resources.
- Resources are not transactions.
- Transactions will later reserve resources.
- Resources are not events.
- Events will later consume resources.

### Phase 1 service surface

The Resource Engine service now defines these architecture methods:

- `createResource()`
- `updateResource()`
- `archiveResource()`
- `restoreResource()`
- `reserve()`
- `releaseReservation()`
- `dispatch()`
- `returnResource()`
- `markDamaged()`
- `scheduleMaintenance()`
- `getAvailability()`
- `search()`

These methods are intentionally placeholders in Phase 1 and currently raise explicit not-implemented exceptions if executed.

### Generic model concepts

The phase 1 type system covers:

- name
- category
- business owner
- description
- serial number
- sku
- barcode
- asset type
- location and warehouse snapshot
- condition
- availability status
- purchase value
- replacement value
- images
- documents
- custom attributes

This model is intentionally generic so future migration is not coupled to event-specific terminology.

## Compatibility with existing modules

Existing modules remain compatible because:

- no existing routes were removed or changed
- no Prisma schema changes were introduced
- no Inventory behavior was replaced
- no Purchase Order behavior was redirected
- no Supplier or Event behavior was modified to depend on Resource Engine
- the new capability is additive and exported for future use only

## Future migration path

### Phase 2

- Introduce persistence model and repository adapters for resources.
- Add capability application rules for lifecycle and reservations.
- Keep Inventory as-is while mapping shared concepts gradually.

### Phase 3

- Let Inventory items optionally project into Resource Engine.
- Let Event planning consume Resource Engine availability.
- Let Purchase Orders and Supplier Products enrich resource procurement metadata.
- Let Marketplace publish selected resources through dedicated projection services.

### Phase 4

- Add bundles, groups, dispatch planning, maintenance scheduling, QR/barcode/RFID extensions and AI workflows through the existing capability and service ports.

## Non-goals in this phase

- no inventory migration
- no UI changes
- no controllers or routes
- no marketplace implementation
- no AI implementation
- no dispatch or routing implementation
- no database migrations

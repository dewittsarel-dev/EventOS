# M009 — ASSET MANAGEMENT

**Product:** EventOS  
**Module:** M009 — Asset Management  
**Version:** 1.0  
**Status:** Complete  
**Primary Recovery Sources:** EC-001 — Event OS and EC-002 — EventOS Asset Management  
**Primary Source Conversation ID:** 6a71cd5b-3ce8-83ea-abca-be53a062dcfe  
**Approved Section Message IDs:** 063af4a1-9f44-4ca5-a291-39070930c697, b3449f8b-b793-43a4-9a9a-173270cc9d22, 103d611d-5363-4c51-82f2-6aedaf0decb2, 4db3f402-1feb-4db4-9188-0eb6f10bd99a, 51e54a71-240d-48c1-81c7-93fb426bd55e, a8280ee3-465d-455b-ad37-eededd3bad24, 164b2d65-5f6a-4221-b3c5-a777fbeb6615, 45c8b4cb-cf9a-4397-b356-5b0eed38cbca, 3034faa1-d02e-4327-aca0-e005221a6c5d, 0afa52e4-749d-4219-8ca1-6f1a4051c9e3

---

# Recovery Integrity

This specification preserves the ten complete and locked Module 09 sections from the authoritative historical source. Repeated chat progress footers and repeated module-title lines are excluded; approved section text, numbering, business-rule IDs, diagrams, governance and completion criteria are preserved.

---

## Section 09.01 — Asset Identity

### 1. Purpose

Asset Identity defines how every physical asset managed by EventOS is uniquely represented, classified, traced and connected to event requirements, procurement, warehousing, logistics, execution and finance.

An Asset Record is the permanent digital identity of a physical item or controlled group of identical items.

Asset Identity must answer:

- What is the asset?
- Who owns or controls it?
- Is it individually tracked or quantity tracked?
- Where did it originate?
- Which physical unit does the record represent?
- What operational characteristics affect its use?
- Which event requirements can it fulfil?
- What is its current lifecycle state?

Asset Identity does not manage the asset’s current warehouse position, movement history, reservation, maintenance activity or event deployment. Those responsibilities belong to subsequent Asset Management sections.

---

## 2. Architectural Position

Assets enter Asset Management from one of four sources:

1. Existing internal inventory.
2. Newly purchased assets.
3. Client-owned assets placed under operational control.
4. Supplier-owned assets temporarily supplied for an event.

The Asset Record becomes the common physical-item reference used by:

- Requirement Engine
- Procurement Studio
- Commercial Workspace
- Warehouse
- QR Tracking
- Logistics
- Event Execution
- Damage and Loss Management
- Maintenance
- Finance

A procurement item does not automatically become an asset.

An Asset Record is created only when the purchased, hired, supplied or client-provided item must be physically controlled, traced, deployed or accounted for.

---

## 3. Asset Identity Model

EventOS shall support two asset identity levels.

### 3.1 Asset Definition

The Asset Definition represents a reusable asset type.

Examples:

- White Tiffany Chair
- 1.8 m Round Dining Table
- 10 m × 15 m Clearspan Tent
- Moving Head Lighting Fixture
- Black Velvet Tablecloth, 3 m
- Floral Plinth, 900 mm
- 20 m Extension Cable

The Asset Definition stores shared characteristics applicable to all matching physical units.

### 3.2 Asset Instance

The Asset Instance represents one individually identifiable physical unit.

Examples:

- Moving Head Fixture MH-0042
- Tent Roof Section TRS-0018
- Generator GEN-0007
- Bar Counter Module BCM-0011

Asset Instances inherit their standard characteristics from the Asset Definition but may have individual condition, serial number, acquisition, maintenance and tracking information.

---

## 4. Tracking Modes

Every Asset Definition must use one of the following tracking modes.

### 4.1 Serialized Tracking

Each physical unit receives its own Asset Instance and unique Asset ID.

Used where individual traceability is operationally or financially important.

Typical examples:

- Electronics
- Audio equipment
- Lighting equipment
- Generators
- Refrigeration equipment
- Vehicles
- High-value décor
- Modular structures
- Safety equipment
- Custom-manufactured pieces

### 4.2 Quantity Tracking

Identical interchangeable items are managed as a controlled quantity under one Asset Definition.

Typical examples:

- Standard cutlery
- Crockery
- Glassware
- Napkins
- Basic chair covers
- Cable ties
- Standard linen
- Low-value consumable accessories

Quantity-tracked assets do not receive an individual Asset Instance for every unit.

They are controlled through stock quantities, warehouse transactions and event allocations.

### 4.3 Batch Tracking

A defined quantity is tracked as a batch because the items share a meaningful origin or operational characteristic.

Typical examples:

- Linen from a specific dye lot
- Custom-manufactured décor produced together
- Imported furniture received in one shipment
- Electrical cable from one production batch
- Branded event materials

Each batch receives a Batch ID and quantity balance.

### 4.4 Kit Tracking

A kit represents multiple components that are normally stored, reserved, transported and deployed together.

Examples:

- Mobile Bar Kit
- Registration Desk Kit
- DJ Booth Kit
- Ceremony Sound Kit
- Tent Installation Kit

A kit may contain:

- Serialized assets
- Quantity-tracked assets
- Batch-tracked assets
- Other sub-kits

The kit does not replace the identities of its components.

---

## 5. Asset Identification Numbers

EventOS shall use system-generated immutable identifiers.

### 5.1 Internal Asset Definition ID

Format:

`AST-DEF-########`

Example:

`AST-DEF-00001427`

This is the permanent system identity of the Asset Definition.

### 5.2 Asset Instance ID

Format:

`AST-INS-########`

Example:

`AST-INS-00008341`

This is the permanent system identity of an individually tracked physical asset.

### 5.3 Batch ID

Format:

`AST-BAT-########`

Example:

`AST-BAT-00000218`

### 5.4 Kit ID

Format:

`AST-KIT-########`

Example:

`AST-KIT-00000492`

### 5.5 Human-Readable Asset Code

Each Asset Definition may also have a business-friendly code.

Example:

`CHR-TIFF-WHT`

Each Asset Instance may have an operational sequence code.

Example:

`CHR-TIFF-WHT-0042`

Human-readable codes may be configurable but must remain unique within the controlling business.

System IDs remain authoritative.

---

## 6. Identity Immutability

The following fields are immutable after record creation:

- Internal Asset Definition ID
- Asset Instance ID
- Batch ID
- Kit ID
- Controlling business
- Original creation timestamp
- Original source type

Asset names, descriptions, classifications and operational attributes may be updated without changing the underlying identity.

An asset must never receive a new identity merely because it:

- Moves warehouse
- Changes condition
- Is repaired
- Is assigned to another event
- Is transferred between departments
- Is rebranded
- Is temporarily unavailable
- Is placed inside a kit

A new identity is required only when a genuinely separate physical asset or stock batch is created.

---

## 7. Ownership and Control

Every Asset Record must define both ownership and operational control.

### 7.1 Ownership Types

- Business-owned
- Client-owned
- Supplier-owned
- Third-party-owned
- Leased
- Financed
- Ownership pending confirmation

### 7.2 Controlling Business

The controlling business is the ClientOS business responsible for managing the asset inside EventOS.

Only one controlling business may exist at a time.

### 7.3 Ownership Party

The ownership party references the business, client, supplier or external party that legally owns the asset.

Operational control does not imply legal ownership.

### 7.4 Control Period

Temporary assets must record:

- Control start date
- Expected control end date
- Actual control end date
- Source agreement or commercial reference

Supplier-owned hired assets remain supplier-owned even while stored, transported or deployed by the event operator.

---

## 8. Asset Classification

Every Asset Definition must have one primary classification.

The initial Asset Management taxonomy shall include:

- Furniture
- Linen
- Tableware
- Décor
- Floral Structures
- Lighting
- Audio
- Video
- Staging
- Tents and Structures
- Flooring
- Electrical
- Catering Equipment
- Bar Equipment
- Refrigeration
- Signage and Branding
- Registration Equipment
- Safety Equipment
- Tools
- Vehicles
- Logistics Equipment
- Packaging and Containers
- Consumables
- Custom Manufactured Assets
- Other

Each primary classification may contain configurable categories and subcategories.

Example:

`Furniture → Seating → Dining Chair`

Classification must support reporting and filtering but must not determine identity.

---

## 9. Asset Variant Structure

Asset Definitions may belong to an Asset Family.

Example Asset Family:

`Tiffany Chair`

Variants:

- White Tiffany Chair
- Gold Tiffany Chair
- Clear Tiffany Chair
- Black Tiffany Chair

Variants are separate Asset Definitions when any characteristic affects:

- Event design suitability
- Client selection
- Procurement
- Pricing
- Warehouse handling
- Logistics
- Requirement fulfilment

Colour, size, material and finish must not be stored only as descriptive text when they affect event planning.

They must be structured attributes.

---

## 10. Required Identity Data

Every Asset Definition must contain:

- Asset Definition ID
- Human-readable asset code
- Asset name
- Primary classification
- Category
- Tracking mode
- Ownership type
- Controlling business
- Ownership party
- Active or inactive state
- Unit of measure
- Base description
- Creation source
- Created by
- Created timestamp

Where applicable, it must also contain:

- Asset family
- Variant attributes
- Manufacturer
- Brand
- Model
- Supplier reference
- Internal SKU
- Supplier SKU
- Barcode
- Standard dimensions
- Standard weight
- Material
- Colour
- Finish
- Load capacity
- Electrical characteristics
- Packing characteristics
- Handling requirements
- Safety classification
- Replacement value
- Default image
- Technical documents
- Requirement capability tags

---

## 11. Asset Instance Data

Every serialized Asset Instance must contain:

- Asset Instance ID
- Parent Asset Definition
- Operational asset code
- Current lifecycle status
- Ownership type
- Controlling business
- Creation source
- Created timestamp

Where applicable:

- Manufacturer serial number
- Original purchase reference
- Acquisition date
- Commissioning date
- Warranty expiry date
- Individual replacement value
- Individual attributes
- Individual photographs
- Certification references
- Registration number
- Licence information
- QR identity
- Barcode identity
- NFC or RFID identity
- Parent kit
- Parent asset
- Condition grade

---

## 12. Parent and Component Relationships

Assets may be composed of identifiable components.

Examples:

- Tent system containing roof sections, poles and connectors
- Mobile bar containing counter modules, shelves and electrical components
- Lighting fixture containing a removable mounting bracket
- Generator containing a separately tracked distribution board

Supported relationships:

- Parent asset
- Child component
- Required component
- Optional component
- Replaceable component
- Accessory
- Kit member
- Compatible asset

Removing a component from its parent does not remove the component’s identity.

Component relationships must support effective dates so that EventOS can determine which components belonged to an asset at a specific time.

---

## 13. Requirement Capability Mapping

Every Asset Definition may be mapped to Requirement Engine capability tags.

Examples:

- Seats one guest
- Provides dining surface for ten guests
- Provides 1 kW lighting load
- Covers 150 m²
- Supports outdoor use
- Food-safe
- Weather-resistant
- Supports suspended décor
- Requires three-phase supply
- Requires qualified operator

This mapping allows the Requirement Engine to identify which assets may satisfy an approved Event Design requirement.

Asset capability does not guarantee availability.

Availability is determined through reservation, warehouse and logistics processes.

---

## 14. Asset Creation Sources

An Asset Record may be created from:

- Manual asset registration
- Approved procurement purchase
- Supplier hire intake
- Client asset intake
- Stock import
- Manufacturing completion
- Asset split
- Batch receipt
- System integration
- Legacy migration

The creation source must remain permanently recorded.

Where created from another EventOS record, the Asset Record must retain the originating reference.

Examples:

- Procurement Solution
- Purchase Order
- Goods Receipt
- Supplier Hire Agreement
- Client Handover Record
- Manufacturing Job
- Commercial Workspace item

---

## 15. Duplicate Prevention

Before creating an Asset Definition, EventOS must check for probable duplicates using:

- Asset name
- Category
- Brand
- Model
- Supplier SKU
- Internal SKU
- Dimensions
- Colour
- Material
- Existing barcode
- Manufacturer serial number

The system may recommend an existing Asset Definition.

It must not automatically merge asset identities.

Duplicate resolution requires operator approval.

Manufacturer serial numbers must be unique within the controlling business unless the operator records a documented exception.

---

## 16. Asset Lifecycle Status

Every serialized Asset Instance must have one current lifecycle status.

Permitted statuses:

- Pending Intake
- Active
- In Inspection
- In Maintenance
- Quarantined
- Damaged
- Lost
- Stolen
- Written Off
- Sold
- Returned to Owner
- Retired
- Archived

Quantity- and batch-tracked assets use inventory balances rather than individual lifecycle statuses, but the Asset Definition itself may be:

- Active
- Suspended
- Discontinued
- Archived

Lifecycle status is distinct from:

- Warehouse location
- Reservation status
- Logistics status
- Event deployment status
- Condition grade

---

## 17. Asset Identity Images and Documents

Each Asset Definition may contain standard reference media:

- Product photographs
- Dimension drawings
- Setup diagrams
- Packing diagrams
- Technical datasheets
- Safety instructions
- Cleaning instructions
- Assembly instructions

Each Asset Instance may contain unit-specific evidence:

- Intake photographs
- Serial-number photographs
- Damage photographs
- Modification evidence
- Certification evidence
- Ownership evidence

Media attached to the Asset Definition applies to the asset type.

Media attached to the Asset Instance applies only to that physical unit.

---

## 18. Security and Permissions

Asset creation, modification and archival must be permission controlled.

Minimum permission groups:

- View Assets
- Create Asset Definitions
- Create Asset Instances
- Edit Asset Identity
- Change Ownership Information
- Change Tracking Mode
- Archive Assets
- Merge Duplicate Definitions
- View Financial Asset Values

The tracking mode may not be changed after operational transactions exist unless an authorised conversion process is completed.

Ownership changes require an audit entry.

---

## 19. Audit Requirements

EventOS must retain an immutable audit history for:

- Asset creation
- Identity field changes
- Classification changes
- Ownership changes
- Tracking-mode changes
- Parent-child relationship changes
- Duplicate merges
- Asset archival
- Lifecycle status changes

Each audit entry must contain:

- User
- Timestamp
- Previous value
- New value
- Reason
- Source action
- Related document where applicable

---

## 20. Locked Business Rules

**AM-AI-001**  
Every managed physical asset must reference one Asset Definition.

**AM-AI-002**  
Every individually tracked physical unit must have one unique Asset Instance ID.

**AM-AI-003**  
System-generated asset identities are immutable and may never be reused.

**AM-AI-004**  
Asset ownership and operational control must be stored separately.

**AM-AI-005**  
An asset’s movement, reservation or event deployment does not create a new identity.

**AM-AI-006**  
Variants that affect design, fulfilment, pricing, handling or availability must be separate Asset Definitions.

**AM-AI-007**  
Serialized assets, quantity-tracked assets, batches and kits must remain distinct tracking models.

**AM-AI-008**  
A kit does not replace the identities of its component assets.

**AM-AI-009**  
Asset Definitions may fulfil Requirement Items only through explicit capability mapping or authorised operator selection.

**AM-AI-010**  
EventOS may identify possible duplicate assets but may not merge them without operator approval.

**AM-AI-011**  
A procurement record becomes an asset only when physical control, deployment or traceability is required.

**AM-AI-012**  
Supplier-owned and client-owned assets must retain their external ownership identity while under EventOS operational control.

**AM-AI-013**  
Assets may not be permanently deleted after operational, commercial or financial transactions exist.

**AM-AI-014**  
Asset identity, lifecycle status, condition, warehouse location, reservation and deployment status must remain separate data concepts.

---

## 21. Completion Criteria

Asset Identity is complete when EventOS can:

- Create Asset Definitions.
- Create serialized Asset Instances.
- Register quantity-tracked stock.
- Register batches.
- Create kits and component relationships.
- Distinguish ownership from operational control.
- Classify assets using a structured taxonomy.
- Record asset variants.
- Map assets to Requirement Engine capabilities.
- prevent duplicate identities.
- retain immutable system identifiers.
- maintain lifecycle status.
- preserve a complete identity audit trail.
- provide a stable asset reference to Warehouse, QR Tracking, Logistics, Execution and Finance.

---

## Section 09.02 — Warehouse Structure and Location Management

### 1. Purpose

Warehouse Structure and Location Management defines how EventOS represents every physical storage environment in which assets are received, stored, inspected, prepared, staged, dispatched and returned.

The warehouse model must provide a reliable answer to:

- Which business controls the storage facility?
- In which warehouse is the asset located?
- In which operational zone is it stored?
- What is its precise storage position?
- Is that location suitable for the asset?
- Is the asset physically available, staged, quarantined or awaiting processing?
- Which team is responsible for the location?
- What capacity remains at the location?
- Which event, transfer or operational process is occupying the location?

Warehouse Location Management defines physical placement.

It does not determine commercial availability, event reservation, asset ownership or transport status.

---

## 2. Architectural Position

Warehouse Management sits between Asset Identity and operational movement.

The relationship is:

`Asset Identity → Warehouse Location → Reservation → Picking → Staging → Dispatch → Logistics → Event Deployment → Return → Inspection → Storage`

Every warehouse transaction must reference:

- The asset or stock item
- The source location
- The destination location
- The movement reason
- The responsible operator
- The transaction timestamp
- The related operational document

Warehouse records form the physical inventory source of truth.

---

## 3. Warehouse Entity

A Warehouse represents a controlled physical facility or operational storage site.

Examples:

- Main Johannesburg Warehouse
- Cape Town Décor Warehouse
- Event Venue Temporary Store
- Supplier Consignment Store
- Client On-Site Storage
- Vehicle Mobile Stock
- External Storage Facility

Each Warehouse must have a unique Warehouse ID.

Format:

`WH-########`

Example:

`WH-00000014`

Each Warehouse must contain:

- Warehouse ID
- Warehouse name
- Human-readable warehouse code
- Controlling business
- Facility type
- Physical address
- Time zone
- Operational status
- Warehouse manager
- Contact details
- Operating hours
- Access restrictions
- Supported asset categories
- Capacity management method
- Default receiving zone
- Default dispatch zone
- Default return zone
- Created timestamp
- Created by

---

## 4. Warehouse Types

EventOS shall support the following warehouse types:

- Permanent Internal Warehouse
- Temporary Event Warehouse
- External Contract Warehouse
- Supplier-Controlled Warehouse
- Client-Controlled Storage
- Mobile Warehouse
- Venue Storage Area
- Workshop Storage
- Production Facility
- Cross-Docking Facility
- Virtual Warehouse

### 4.1 Virtual Warehouse

A Virtual Warehouse represents inventory under operational control where no permanent EventOS-managed physical facility exists.

Examples:

- Supplier Stock Available to EventOS
- Client-Owned Assets Awaiting Collection
- Assets in Long-Term Hire
- Assets Held at a Remote Venue

A Virtual Warehouse may not be used to falsely imply verified physical stock.

Its verification status must be visible.

---

## 5. Warehouse Hierarchy

Each Warehouse shall support a structured location hierarchy.

The standard hierarchy is:

`Warehouse → Zone → Aisle → Bay → Rack → Shelf → Bin`

Not every facility must use every level.

A smaller facility may use:

`Warehouse → Zone → Shelf`

A temporary event warehouse may use:

`Warehouse → Zone → Floor Position`

The hierarchy must remain configurable without changing the underlying transaction model.

---

## 6. Location Identity

Every usable warehouse location must have a unique immutable Location ID.

Format:

`LOC-##########`

Example:

`LOC-0000012847`

Each location may also have a human-readable Location Code.

Example:

`JHB-A03-B07-R02-S04`

The system-generated Location ID remains authoritative.

The Location Code must be unique within its Warehouse.

---

## 7. Location Entity

Every Location Record must contain:

- Location ID
- Location code
- Location name
- Parent location
- Warehouse
- Location type
- Operational status
- Storage purpose
- Physical dimensions where applicable
- Weight capacity where applicable
- Volume capacity where applicable
- Quantity capacity where applicable
- Supported asset classifications
- Restricted asset classifications
- Environmental characteristics
- Access requirements
- Responsible team
- QR identity
- Created timestamp
- Created by

Optional fields include:

- Floor number
- GPS position
- Internal map coordinates
- Temperature limits
- Humidity limits
- Power availability
- Security level
- Fire classification
- Handling-equipment requirements
- Maximum stacking height
- Photograph
- Storage instructions

---

## 8. Location Types

Supported Location Types shall include:

- Receiving Dock
- Receiving Inspection
- General Storage
- Rack Storage
- Shelf Storage
- Bin Storage
- Floor Storage
- Pallet Position
- Hanging Storage
- Secure Storage
- High-Value Storage
- Climate-Controlled Storage
- Hazardous Storage
- Linen Storage
- Furniture Storage
- Electrical Storage
- Audio-Visual Storage
- Consumables Storage
- Tool Storage
- Workshop
- Cleaning Area
- Maintenance Area
- Quarantine Area
- Damage Assessment Area
- Return Processing
- Picking Area
- Packing Area
- Event Staging Area
- Dispatch Area
- Cross-Dock Area
- Waste Area
- Scrap Area
- Vehicle Storage
- Temporary Holding Area
- Unallocated Holding Area

Location Types may be extended by an authorised administrator.

---

## 9. Operational Zones

Each warehouse shall define operational zones according to physical workflow.

The minimum recommended zones are:

1. Receiving
2. Inspection
3. Storage
4. Picking
5. Packing
6. Staging
7. Dispatch
8. Returns
9. Quarantine
10. Maintenance
11. Damage Assessment

Warehouse transactions must reflect movement between these zones.

Example:

`Receiving Dock → Receiving Inspection → General Storage`

Return flow:

`Return Dock → Return Processing → Inspection → Cleaning → Storage`

Damaged asset flow:

`Return Processing → Damage Assessment → Quarantine → Maintenance`

---

## 10. Location Status

Every location must have one current operational status.

Permitted statuses:

- Active
- Temporarily Closed
- Full
- Restricted
- Reserved
- Under Maintenance
- Under Inspection
- Quarantined
- Decommissioned
- Archived

Location status does not automatically change the status of assets stored there.

However, assets in a quarantined location must not be treated as available for event fulfilment.

---

## 11. Asset Location State

Every serialized Asset Instance must have one current physical location state.

Permitted states:

- Stored
- Receiving
- Under Inspection
- Picking
- Picked
- Packing
- Staged
- Dispatching
- In Transit
- At Event
- Returning
- Return Processing
- Cleaning
- Maintenance
- Quarantined
- Location Unknown
- External Custody
- Retired

The state must correspond with the asset’s current operational process.

An asset may not simultaneously have two current physical locations.

Its history may contain unlimited previous locations.

---

## 12. Quantity-Tracked Stock Location

Quantity-tracked assets shall be managed by stock balance per location.

Each balance record must contain:

- Asset Definition
- Warehouse
- Location
- Batch where applicable
- Quantity on hand
- Quantity available
- Quantity reserved
- Quantity picked
- Quantity staged
- Quantity quarantined
- Quantity damaged
- Quantity undergoing maintenance
- Quantity in transit
- Unit of measure
- Last counted timestamp

The system must prevent negative physical stock unless an authorised inventory correction is performed.

---

## 13. Serialized Asset Location

Every serialized Asset Instance must reference one current Location ID or one recognised external physical state.

Examples of valid references:

- Warehouse location
- Vehicle
- Event site
- Supplier custody
- Client custody
- Maintenance provider
- Location Unknown

Free-text location descriptions may supplement but may not replace structured location references where a structured location exists.

---

## 14. Mobile Locations

Vehicles, trailers, containers and mobile storage units may act as locations.

Examples:

- Truck TRK-001
- Trailer TRL-004
- Flight Case FC-028
- Shipping Container CNT-003
- Mobile Bar Transport Crate

A mobile location must have:

- Its own Location ID
- Parent warehouse when stored
- Current custody state
- Capacity rules
- Allowed asset categories
- Movement history

Assets remain located inside the mobile location until unloaded or individually transferred.

Moving the mobile location changes the broader custody context of all contained assets without requiring separate manual transactions for every contained item, provided the contained asset list is locked before movement.

---

## 15. Nested Storage

EventOS shall support nested location structures.

Examples:

- Asset inside a flight case
- Flight case inside a truck
- Truck at a warehouse
- Chair stacks on a pallet
- Pallet in a warehouse bay

The structure may be:

`Warehouse → Dispatch Zone → Truck → Flight Case → Asset`

Nested storage must not obscure the individual identity of serialized assets.

The system must be able to resolve:

- Immediate parent location
- Full location path
- Controlling warehouse or external site
- Current custody party
- Current operational state

---

## 16. Capacity Management

Each location may use one or more capacity controls:

- Maximum item quantity
- Maximum weight
- Maximum volume
- Maximum pallet count
- Maximum floor area
- Maximum rack positions
- Maximum stack height
- Asset-specific capacity
- No enforced capacity

Capacity utilisation must be calculated from the current contents.

The system shall warn before exceeding capacity.

The system shall block a movement where:

- A safety limit would be exceeded
- The location is incompatible with the asset
- The location is closed
- The user lacks override permission

An authorised override must capture a reason and audit entry.

---

## 17. Storage Compatibility

A location may define compatibility rules based on:

- Asset classification
- Dimensions
- Weight
- Material
- Fragility
- Temperature range
- Humidity range
- Fire risk
- Electrical risk
- Food-contact status
- Cleaning state
- Security requirement
- Stacking limitations
- Handling-equipment requirements

Examples:

- Linen may not be stored in a wet-processing area.
- Food-contact equipment may not be stored in a chemical storage zone.
- High-value lighting equipment may require secure storage.
- Large tables may require floor-storage positions.
- Damaged electrical equipment must be placed in quarantine.
- Client-owned assets may require segregated storage.

EventOS must validate location compatibility during proposed movements.

---

## 18. Dedicated and Shared Locations

A location may be configured as:

- Shared
- Dedicated to an Asset Definition
- Dedicated to an Asset Category
- Dedicated to a Client
- Dedicated to a Supplier
- Dedicated to an Event
- Dedicated to a Project
- Temporary Dedicated Location

Dedicated locations prevent unrelated assets from being placed there unless an authorised override is recorded.

---

## 19. Event Staging Locations

Event Staging Areas hold assets prepared for a specific event or dispatch.

Each staging allocation must reference:

- Event
- Event version
- Dispatch wave
- Delivery destination
- Scheduled dispatch time
- Responsible logistics team
- Required completion time
- Staging location
- Current staging status

Staging statuses:

- Planned
- Open
- Picking in Progress
- Packing in Progress
- Partially Complete
- Complete
- Verified
- Dispatch Locked
- Dispatched
- Cancelled

Assets placed in event staging must remain physically visible in warehouse inventory but must no longer appear as generally available stock.

---

## 20. Temporary Event Warehouses

EventOS shall support temporary storage locations created for a specific event.

Examples:

- Venue Back-of-House Store
- Event Build Marquee
- Temporary Catering Store
- Production Compound
- Secure Equipment Room

A Temporary Event Warehouse must reference:

- Event
- Venue
- Active date range
- Responsible business
- Responsible manager
- Access hours
- Security instructions
- Receiving process
- Dispatch process
- Closure process

When the temporary warehouse closes:

- All active stock must be reconciled.
- All assets must be transferred, returned, written off or explicitly left under approved custody.
- The warehouse may not be archived while unresolved stock remains.

---

## 21. External Storage Locations

External locations may include:

- Supplier premises
- Client premises
- Repair provider
- Laundromat
- Fabricator
- Venue
- Third-party logistics provider

External locations must record:

- Custody party
- Address
- Contact person
- Expected return or release date
- Related agreement
- Verification status
- Last confirmed timestamp

Assets held externally must not be represented as warehouse-ready stock unless they have been physically confirmed as returned and inspected.

---

## 22. Receiving Location Rules

All incoming assets must first enter a recognised receiving location unless an authorised direct-location process applies.

Receiving must distinguish:

- Purchased assets
- Hired supplier assets
- Client-owned assets
- Returned event assets
- Internal warehouse transfers
- Manufactured assets
- Repaired assets
- Unidentified assets

An incoming item must not be treated as available until required intake and inspection controls are complete.

---

## 23. Unidentified Asset Holding

Unidentified physical items must be placed in an Unallocated Holding Area.

The holding record must contain:

- Temporary holding ID
- Photograph
- Quantity
- Discovery location
- Discovery timestamp
- Found by
- Probable asset type
- Probable event or supplier
- Investigation status
- Resolution status

Unidentified assets may not be allocated to events.

They must be resolved through:

- Matching to an existing Asset Record
- Creating a new Asset Record
- Returning to owner
- Disposal
- Loss investigation
- Duplicate investigation

---

## 24. Warehouse Transfers

A Warehouse Transfer represents controlled movement between warehouses.

Each transfer must contain:

- Transfer ID
- Source warehouse
- Destination warehouse
- Requested date
- Dispatch date
- Expected arrival date
- Actual arrival date
- Asset list
- Quantity list
- Transfer reason
- Responsible sender
- Responsible receiver
- Transport reference
- Current transfer status

Transfer statuses:

- Draft
- Requested
- Approved
- Picking
- Staged
- Dispatched
- In Transit
- Partially Received
- Received
- Discrepancy
- Cancelled
- Closed

Stock must leave the source location when dispatched and enter an In Transit state.

It must not enter destination stock until receipt is confirmed.

---

## 25. Warehouse Map

Each warehouse may maintain a digital map.

The map may display:

- Zones
- Aisles
- Racks
- Shelves
- Floor-storage positions
- Receiving areas
- Staging areas
- Emergency routes
- Restricted areas
- Location utilisation
- Asset category distribution

The map is a visual interface over structured Location Records.

The map may not create independent location data outside the warehouse hierarchy.

---

## 26. Warehouse Search

Operators must be able to search by:

- Asset name
- Asset code
- Asset Instance ID
- QR code
- Batch ID
- Kit ID
- Warehouse
- Zone
- Location
- Category
- Event
- Supplier
- Client
- Condition
- Lifecycle status
- Physical location state
- Reservation state
- Custody party
- Serial number

Search results must distinguish between:

- Physically present
- Reserved
- Picked
- Staged
- In transit
- At event
- External custody
- Location unknown

---

## 27. Location Verification

Locations may require periodic verification.

Verification methods may include:

- QR scan
- Manual confirmation
- Cycle count
- Photograph
- Supervisor approval
- Automated sensor confirmation
- RFID scan where available

Each verification record must contain:

- Location
- Verification method
- Verified by
- Timestamp
- Expected contents
- Confirmed contents
- Discrepancies
- Resolution status

Location verification does not replace formal inventory counting where financial stock control is required.

---

## 28. Warehouse Roles and Permissions

Minimum permission groups:

- View Warehouse Structure
- Create Warehouse
- Edit Warehouse
- Create Location
- Edit Location
- Change Location Status
- Move Assets
- Process Receiving
- Process Transfers
- Override Capacity
- Override Compatibility
- Manage Staging Areas
- Confirm External Custody
- Close Temporary Warehouse
- Perform Location Verification
- Archive Warehouse Locations

Users may be restricted by:

- Business
- Warehouse
- Zone
- Asset category
- Transaction type
- Financial value
- Client ownership
- Security classification

---

## 29. Audit Requirements

EventOS must retain an immutable audit history for:

- Warehouse creation
- Warehouse status changes
- Location creation
- Location hierarchy changes
- Location status changes
- Capacity changes
- Compatibility-rule changes
- Asset-location changes
- Quantity balance changes
- External custody changes
- Warehouse transfers
- Capacity overrides
- Compatibility overrides
- Temporary warehouse closure
- Inventory corrections

Every audit entry must contain:

- User
- Timestamp
- Source location
- Destination location
- Asset or quantity
- Previous value
- New value
- Reason
- Related operational record
- Device or scan source where available

---

## 30. Locked Business Rules

**AM-WH-001**  
Every physically managed asset must have one current structured location or one recognised external physical state.

**AM-WH-002**  
A serialized Asset Instance may have only one current physical location.

**AM-WH-003**  
Warehouse Location IDs are immutable and may not be reused.

**AM-WH-004**  
Warehouse location, asset lifecycle status, condition, reservation and logistics status must remain separate data concepts.

**AM-WH-005**  
Quantity-tracked inventory must maintain stock balances per location.

**AM-WH-006**  
Assets must not become available inventory until required receiving and inspection controls are completed.

**AM-WH-007**  
Assets in quarantine, damage assessment or maintenance locations must not be considered available for event fulfilment.

**AM-WH-008**  
Assets allocated to event staging remain warehouse stock but are no longer generally available.

**AM-WH-009**  
Warehouse transfers must use an In Transit state between source dispatch and destination receipt.

**AM-WH-010**  
Assets held by suppliers, clients, venues or service providers must be represented as external custody and not as verified internal warehouse stock.

**AM-WH-011**  
Moving a mobile container or vehicle may move its confirmed contents as a controlled group.

**AM-WH-012**  
Nested storage must preserve the identity and traceability of all serialized component assets.

**AM-WH-013**  
EventOS must prevent movements into incompatible, inactive or over-capacity locations unless an authorised override is recorded.

**AM-WH-014**  
Temporary event warehouses may not be closed while unresolved inventory remains.

**AM-WH-015**  
Unidentified assets must remain in controlled holding and may not be allocated to events.

**AM-WH-016**  
Free-text location descriptions may not replace structured warehouse locations where structured locations exist.

**AM-WH-017**  
Physical asset movement must always produce an auditable warehouse transaction.

**AM-WH-018**  
The warehouse inventory record is the authoritative source for current physical asset placement.

---

## 31. Completion Criteria

Warehouse Structure and Location Management is complete when EventOS can:

- Create permanent, temporary, mobile and virtual warehouses.
- Build configurable warehouse location hierarchies.
- Assign immutable identities to every storage location.
- Store serialized and quantity-tracked assets by precise location.
- Manage nested containers and mobile locations.
- Validate location capacity.
- Validate storage compatibility.
- Create event-specific staging locations.
- Manage temporary event warehouses.
- Record external custody.
- Process warehouse transfers.
- Hold unidentified assets safely.
- search physical inventory across all location states.
- verify warehouse locations.
- preserve a complete movement and location audit history.
- provide reliable warehouse data to QR Tracking, Reservation, Logistics, Execution and Finance.

---

## Section 09.03 — QR Identification and Tracking

### 1. Purpose

QR Identification and Tracking defines how EventOS connects physical assets, stock, kits, containers, warehouse locations and operational documents to their digital records through scannable QR identities.

The QR system must enable operators to:

- Identify physical assets.
- Confirm warehouse locations.
- Receive stock.
- Move assets.
- Pick and pack event requirements.
- Build and verify kits.
- Load and unload vehicles.
- Dispatch event equipment.
- Confirm arrival at venues.
- Record event deployment.
- Process returns.
- Report damage, loss and discrepancies.
- Perform inventory counts.
- Access permitted asset information from a mobile device.

QR scanning is an operational input method.

It does not independently determine ownership, availability, condition, commercial allocation or financial treatment.

---

## 2. Architectural Position

QR Tracking operates across the complete physical asset lifecycle.

The operational sequence is:

`Asset Identity → QR Assignment → Receiving → Storage → Reservation → Picking → Packing → Staging → Loading → Dispatch → Event Deployment → Return → Inspection → Storage`

Every successful scan must resolve to a recognised EventOS entity and a permitted operational action.

QR Tracking must integrate with:

- Asset Identity
- Warehouse Structure
- Requirement Engine
- Procurement Studio
- Commercial Workspace
- Reservation and Allocation
- Logistics
- Event Execution
- Damage and Loss Management
- Maintenance
- Inventory Control
- Audit and Security

---

## 3. QR Identity Principle

A QR code represents a secure digital reference to an EventOS record.

It must not contain the complete business record in readable form.

The QR payload must contain only the minimum information required to resolve the entity securely.

The authoritative data remains in EventOS.

A QR code may identify:

- Asset Definition
- Asset Instance
- Batch
- Kit
- Container
- Warehouse
- Warehouse location
- Vehicle
- Shipment
- Transfer
- Picking list
- Packing unit
- Staging allocation
- Event deployment zone
- Temporary holding record
- Inventory count session
- Operational task

---

## 4. QR Entity Types

### 4.1 Serialized Asset QR

Assigned to one individually tracked Asset Instance.

Examples:

- Generator
- Lighting fixture
- Speaker
- Refrigeration unit
- Custom bar module
- High-value décor item

The scan must resolve directly to the Asset Instance.

### 4.2 Quantity Stock QR

Assigned to an Asset Definition, batch, stock container or storage unit rather than every individual low-value item.

Examples:

- A crate containing 50 glasses
- A bundle containing 20 napkins
- A box containing 100 cable ties
- A rack holding 40 identical chairs

The operator must confirm the transaction quantity where the QR does not represent a fixed sealed quantity.

### 4.3 Batch QR

Assigned to one defined batch.

The scan must resolve:

- Batch identity
- Asset Definition
- Original quantity
- Current quantity
- Batch characteristics
- Current location
- Batch restrictions

### 4.4 Kit QR

Assigned to one Kit Record.

The scan must resolve:

- Kit identity
- Kit type
- Expected contents
- Confirmed contents
- Missing components
- Current status
- Current location
- Event allocation where applicable

### 4.5 Container QR

Assigned to a reusable physical container.

Examples:

- Flight case
- Crate
- Pallet
- Stillage
- Cage
- Transport box
- Linen trolley

The container may hold multiple serialized, batch-tracked or quantity-tracked assets.

### 4.6 Location QR

Assigned to a Warehouse or Location Record.

Scanning a location may:

- Confirm current operator position.
- Set the movement destination.
- Open the location record.
- Begin a stock count.
- Display expected contents.
- Confirm loading or unloading position.

### 4.7 Operational Document QR

Assigned to a controlled operational record.

Examples:

- Picking list
- Packing list
- Dispatch note
- Warehouse transfer
- Vehicle load
- Event zone
- Return manifest
- Inventory count session

The QR opens the relevant workflow but does not by itself approve the workflow.

---

## 5. QR Record

Every QR identity must have a QR Record containing:

- QR Record ID
- QR entity type
- Referenced entity
- QR payload token
- QR version
- Status
- Creation timestamp
- Created by
- Activation timestamp
- Last scan timestamp
- Last known scan context
- Replacement history
- Print history
- Security state

QR Record status values:

- Draft
- Active
- Suspended
- Damaged
- Lost
- Replaced
- Compromised
- Revoked
- Archived

Only Active QR Records may complete operational transactions.

---

## 6. QR Record Identifier

Every QR Record shall have an immutable system identifier.

Format:

`QR-##########`

Example:

`QR-0000048271`

This identifier is not required to be visibly printed.

The printed label may display a shorter human-readable reference.

Example:

`MH-0042`

The human-readable reference assists manual identification but does not replace QR validation.

---

## 7. QR Payload

The QR payload must use an opaque, non-sequential token.

The payload must not expose:

- Asset value
- Client information
- Event pricing
- Supplier pricing
- User information
- Internal database identifiers
- Access credentials
- Commercial documents
- Sensitive event information

The payload must resolve through EventOS before a transaction is completed.

A typical payload structure may contain:

- EventOS domain or application route
- Entity-resolution token
- Payload version
- Integrity signature or verification element

Payload structure must be centrally version controlled.

---

## 8. Static and Dynamic QR Codes

### 8.1 Static Identity QR

A Static Identity QR remains linked to the same entity throughout its active life.

Used for:

- Asset Instances
- Kits
- Containers
- Warehouse locations
- Vehicles

The underlying record may change without reprinting the QR.

### 8.2 Transaction QR

A Transaction QR represents a temporary operational workflow.

Used for:

- Picking sessions
- Loading manifests
- Transfer documents
- Inventory count sessions
- Temporary event zones
- Return processing sessions

Transaction QR codes may expire when the related workflow is completed, cancelled or exceeds its validity period.

### 8.3 Temporary Identity QR

A Temporary Identity QR may be assigned during receiving where final identification has not yet been completed.

Examples:

- Unidentified item
- Pending asset registration
- Mixed supplier delivery
- Temporary event intake

Temporary QR identities must be resolved into permanent records or formally closed.

---

## 9. Label Content

A physical QR label should display the minimum information required for visual identification.

For serialized assets:

- QR image
- Human-readable asset code
- Asset name or abbreviated description
- Controlling business identifier where required
- Optional serial number
- Optional handling symbol

For locations:

- QR image
- Location code
- Location name
- Warehouse code

For kits and containers:

- QR image
- Kit or container code
- Description
- Optional event allocation marker
- Optional gross weight limit

Commercial values must not be printed on operational asset labels.

---

## 10. Label Types

EventOS shall support multiple label specifications.

Examples:

- Standard adhesive label
- Heavy-duty laminated label
- Weather-resistant outdoor label
- Chemical-resistant label
- Heat-resistant label
- Freezer-safe label
- Fabric label
- Sew-in textile label
- Cable tag
- Hanging tag
- Metal asset plate
- Tamper-evident label
- Temporary paper label

Each Asset Definition may specify a default label type.

The selected label type must suit:

- Surface material
- Cleaning method
- Operating environment
- Outdoor exposure
- Expected asset life
- Heat exposure
- Moisture exposure
- Abrasion risk
- Theft risk
- Visual design requirements

---

## 11. QR Placement

QR label placement may be defined at Asset Definition level.

Placement instructions may include:

- Preferred surface
- Orientation
- Minimum clear space
- Height from floor
- Concealed or visible placement
- Secondary-label position
- Prohibited surfaces
- Cleaning restrictions
- Installation photograph

Examples:

- Underneath a chair seat
- Rear of an audio enclosure
- Inside a flight-case lid
- On the outer corner of a transport crate
- On a tent component away from structural connection points

QR labels must not obstruct:

- Safety markings
- Manufacturer labels
- Ventilation
- Moving components
- Electrical connections
- Client-facing design surfaces unless approved

---

## 12. Primary and Secondary QR Labels

A serialized asset may have:

- One primary QR label
- One or more secondary QR labels

Secondary labels may be used where:

- The asset has multiple scan-access points.
- The primary label is concealed during use.
- The asset is large.
- The asset is regularly packed into a frame or housing.
- The asset requires both internal and external identification.

All active labels must resolve to the same Asset Instance.

The system must distinguish the primary label from secondary labels.

---

## 13. QR Assignment

A QR identity may be assigned during:

- Asset creation
- Goods receipt
- Asset intake
- Batch creation
- Kit creation
- Container registration
- Location creation
- Vehicle registration
- Temporary holding
- Legacy inventory migration

The assignment process must confirm:

- Correct entity
- Correct label type
- Correct printed code
- Successful test scan
- Operator
- Date and time
- Label-placement confirmation

For serialized assets, the operator must verify the physical asset before activating the QR Record.

---

## 14. QR Activation

A printed QR label must not become operational until activated.

Activation requires:

1. Printing or registering the label.
2. Attaching it to the correct physical entity.
3. Scanning the label.
4. Confirming the target entity.
5. Confirming label placement.
6. Activating the QR Record.

Activation prevents labels from being accidentally assigned to the wrong asset.

Bulk activation may be supported but must preserve entity-level traceability.

---

## 15. QR Scan Context

Every scan must be evaluated within an operational context.

Scan context may include:

- User
- Device
- Business
- Warehouse
- Location
- Event
- Workflow
- Date and time
- Online or offline state
- GPS position where authorised
- Previous scan
- Expected next action
- Permission scope

The same QR may trigger different permitted actions depending on the scan context.

Example:

A lighting fixture scanned during picking may be added to a picking list.

The same fixture scanned during return processing may open inspection and damage reporting.

---

## 16. Standard Scan Modes

The EventOS mobile interface shall support explicit scan modes.

Required scan modes include:

- Identify
- Receive
- Move
- Pick
- Pack
- Stage
- Load
- Dispatch
- Unload
- Deploy
- Collect
- Return
- Inspect
- Count
- Build Kit
- Verify Kit
- Report Damage
- Report Missing
- Assign Temporary Identity
- Locate
- Audit

Explicit scan modes reduce accidental transactions.

EventOS may suggest a mode based on workflow context but must clearly display the active mode.

---

## 17. Identify Scan

An Identify scan displays permitted information about the scanned entity.

For an Asset Instance, it may display:

- Asset name
- Asset code
- Current location
- Current physical state
- Condition
- Event allocation
- Ownership type
- Next planned movement
- Open maintenance issue
- Image
- Handling instructions

Sensitive information must be restricted by permission.

The Identify scan does not create a movement transaction.

---

## 18. Movement Scan Pattern

A standard warehouse movement should use a controlled source-and-destination pattern.

Supported patterns:

### 18.1 Asset-First Movement

1. Select Move mode.
2. Scan asset.
3. Scan destination location.
4. Validate movement.
5. Confirm transaction.

### 18.2 Location-First Movement

1. Select Move mode.
2. Scan destination location.
3. Scan one or more assets.
4. Review movement list.
5. Confirm transaction.

### 18.3 Container Movement

1. Scan container.
2. Confirm locked contents.
3. Scan destination.
4. Move container and confirmed contents.

The system must prevent incomplete movements from silently changing asset location.

---

## 19. Scan Validation

Before completing a QR transaction, EventOS must validate:

- QR status
- Entity status
- User permission
- Active workflow
- Current location
- Expected source location
- Destination compatibility
- Reservation state
- Event allocation
- Asset condition
- Kit membership
- Custody status
- Duplicate scan
- Transaction sequence
- Offline-data freshness where applicable

A failed validation must display a clear operational reason.

Examples:

- Asset already scanned.
- Asset belongs to another event.
- Asset is quarantined.
- Asset is not expected on this picking list.
- Destination location is incompatible.
- Asset is already inside another container.
- QR code has been revoked.

---

## 20. Scan Outcomes

A scan may result in:

- Successful identification
- Transaction added but not yet confirmed
- Transaction completed
- Warning requiring confirmation
- Supervisor approval required
- Duplicate scan ignored
- Scan blocked
- Unknown QR
- Revoked QR
- Offline pending synchronisation
- Discrepancy recorded

EventOS must not present an unconfirmed scan as a completed operational transaction.

---

## 21. Bulk Scanning

Bulk scanning must support rapid processing of multiple assets.

Applicable workflows include:

- Receiving
- Picking
- Packing
- Vehicle loading
- Venue unloading
- Return intake
- Inventory counting
- Kit verification

Bulk scan sessions must display:

- Expected quantity
- Scanned quantity
- Confirmed quantity
- Duplicate scans
- Unexpected assets
- Missing assets
- Blocked assets
- Session progress
- Operator
- Session status

Bulk sessions must require final confirmation before completion where the scan changes custody, location or operational state.

---

## 22. Quantity-Tracked Asset Scanning

Where one QR represents multiple interchangeable units, the scan must request or derive quantity.

Quantity may be determined through:

- Manual entry
- Fixed pack quantity
- Container contents
- Weight conversion
- Predefined bundle size
- Count confirmation
- Connected scale integration
- Previous packed quantity

The transaction must record:

- Scanned QR
- Entered or calculated quantity
- Unit of measure
- Source location
- Destination
- Batch where applicable
- Operator
- Transaction reason

---

## 23. Fixed-Quantity Containers

A container may be defined as containing a fixed standard quantity.

Example:

`Glass Crate Type A = 25 wine glasses`

Scanning the container may propose 25 units.

The operator must report any deviation.

A broken seal, missing unit or partial quantity changes the container from Verified to Open or Discrepant status.

EventOS must not assume the standard quantity after a discrepancy has been recorded until the contents are reverified.

---

## 24. Kit Building

Kit Building mode must support creating or updating a physical kit.

The workflow is:

1. Scan Kit QR.
2. Load expected kit definition.
3. Scan component assets or stock quantities.
4. Validate component compatibility.
5. Display missing, duplicate or unexpected components.
6. Confirm kit contents.
7. Lock kit manifest.
8. Set kit status.

Kit statuses:

- Empty
- Building
- Incomplete
- Complete
- Verified
- Sealed
- Open
- Discrepant
- Deployed
- Returned
- Under Inspection

A kit may not be marked Verified while required components are missing.

---

## 25. Kit Verification

Kit Verification compares physical contents with the expected manifest.

Verification may occur:

- After kit assembly
- Before staging
- Before loading
- At venue arrival
- Before deployment
- During return
- After cleaning
- During inventory count

The verification result must identify:

- Confirmed components
- Missing components
- Additional components
- Substituted components
- Damaged components
- Unscannable labels

Any accepted substitution must reference an authorised requirement or operational decision.

---

## 26. Container Sealing

EventOS may support controlled sealing of kits and containers.

A seal record may contain:

- Seal ID
- Container or Kit ID
- Seal number
- Sealed by
- Sealed timestamp
- Confirmed contents
- Expected destination
- Seal status
- Opened by
- Opened timestamp
- Opening reason

The seal number may be encoded separately or entered manually.

A QR scan does not prove that a physical seal remains intact unless the seal itself is checked.

---

## 27. Picking Workflow

In Picking mode, EventOS must compare scanned assets against an authorised picking list.

Each scan must indicate:

- Required item
- Required quantity
- Already picked quantity
- Remaining quantity
- Event allocation
- Substitution status
- Condition requirement
- Source location
- Destination staging area

Unexpected items must not be silently added.

They require:

- Removal from the session
- Approved substitution
- Picking-list amendment
- Supervisor override

---

## 28. Packing Workflow

Packing mode associates picked assets with:

- Kit
- Container
- Pallet
- Crate
- Vehicle load group
- Dispatch unit

The packing record must preserve:

- Packed asset
- Quantity
- Packing unit
- Operator
- Timestamp
- Packing order
- Event
- Dispatch wave
- Weight where available
- Special handling instructions

Packing an asset does not complete dispatch.

---

## 29. Loading Workflow

Loading mode must verify movement from staging into a vehicle or transport unit.

The workflow must support:

- Scan vehicle
- Scan load or dispatch document
- Scan containers
- Scan loose assets
- Confirm quantity-tracked stock
- Identify missing items
- Identify unexpected items
- Confirm loading sequence
- Lock vehicle manifest

The vehicle manifest must reflect actual scanned contents rather than only planned contents.

---

## 30. Dispatch Workflow

Dispatch requires confirmation that:

- The correct event or transfer is selected.
- The correct vehicle is loaded.
- Required assets are present.
- Discrepancies are resolved or formally accepted.
- The responsible dispatcher is identified.
- Custody transfer is recorded.
- Dispatch time is captured.

Dispatch must move assets from the warehouse or staging state to an In Transit state.

A scan alone must not dispatch a load without final operator confirmation.

---

## 31. Venue Arrival and Unloading

At the venue, QR scanning must support:

- Vehicle arrival confirmation
- Seal confirmation
- Container unloading
- Loose asset unloading
- Event-zone allocation
- Missing-item reporting
- Unexpected-item reporting
- Damage-on-arrival reporting
- Custody acceptance

Assets must remain associated with the vehicle until unloading is confirmed.

Venue unloading may place assets into:

- Temporary event warehouse
- Event staging zone
- Build zone
- Catering zone
- Production compound
- Client custody
- Supplier custody

---

## 32. Event Deployment Tracking

Assets may be scanned into event deployment zones.

Examples:

- Main Stage
- Ceremony Area
- Table Group A
- VIP Lounge
- Kitchen
- Bar 1
- Registration
- Back-of-House
- Power Distribution Zone

Deployment tracking must record:

- Event
- Event version
- Venue
- Deployment zone
- Asset or quantity
- Deployed by
- Deployment timestamp
- Requirement Item fulfilled
- Design element supported
- Temporary custodian where applicable

Deployment location is an execution state and must not replace the asset’s formal custody history.

---

## 33. Requirement Confirmation

A scan may confirm that a physical asset has been assigned or deployed against a Requirement Item.

The system must validate:

- Asset capability
- Quantity
- Variant
- Condition requirement
- Event allocation
- Design compatibility
- Approved substitution
- Deployment zone

The scan may confirm fulfilment evidence.

It may not redefine the approved Event Design.

Any substitution affecting the Event Design must follow the relevant change-control process.

---

## 34. Return Scanning

Return mode must compare physical returns against the outbound manifest.

Each returned asset must be classified as:

- Returned as expected
- Returned damaged
- Returned incomplete
- Returned in wrong container
- Unexpected return
- Missing
- Sent directly elsewhere
- Retained at venue
- Client custody
- Supplier custody
- Pending investigation

Quantity-tracked returns must capture actual returned quantity.

The return scan must not automatically restore assets to available stock.

Inspection and required processing must occur first.

---

## 35. Damage Reporting

Scanning an asset in Report Damage mode must open a damage record linked to the correct physical item.

The damage report should capture:

- Asset
- Event
- Location
- Date and time
- Reported by
- Damage category
- Severity
- Description
- Photographs
- Suspected cause
- Responsible party where known
- Immediate action
- Availability impact

The asset may be moved to a damage, quarantine or maintenance state depending on rules and operator authority.

---

## 36. Missing Asset Reporting

A missing asset may be reported from:

- Picking
- Packing
- Loading
- Venue unloading
- Event deployment
- Collection
- Return
- Inventory count

The missing record must capture:

- Asset or quantity
- Last confirmed scan
- Last known location
- Last custodian
- Related event or transaction
- Time detected
- Reported by
- Investigation owner
- Current investigation status

EventOS may propose likely locations based on scan history but may not mark an asset as found without confirmation.

---

## 37. Unknown QR Handling

When a scanned QR is not recognised, EventOS must distinguish:

- Invalid payload
- Foreign QR
- Expired Transaction QR
- Revoked QR
- Damaged payload
- Unsupported QR version
- Offline resolution unavailable

The operator may:

- Rescan
- Enter the human-readable code
- Search manually
- Create a temporary holding record
- Report a suspected counterfeit or duplicate label
- Escalate to a supervisor

Unknown codes must not create automatic Asset Records.

---

## 38. Duplicate QR Detection

EventOS must detect when:

- Two active QR Records use the same payload.
- One QR label appears to be attached to multiple physical assets.
- A revoked QR is scanned.
- A replaced QR remains operational.
- The same serialized asset is scanned simultaneously in incompatible locations.
- A QR is scanned outside a plausible workflow.

Potential duplication must create a security or data-quality alert.

The system must not automatically determine which physical item is genuine without investigation.

---

## 39. Damaged or Unreadable Labels

Where a QR label cannot be scanned, the operator may identify the entity through:

- Human-readable asset code
- Serial number
- Search
- Photograph
- Container manifest
- Parent kit
- Location contents
- NFC or RFID identifier where supported

The operator may request label replacement.

The replacement process must:

1. Identify the correct entity.
2. Revoke or mark the old QR Record as damaged.
3. Create or activate the replacement QR.
4. Test scan the new label.
5. Record replacement reason.
6. Preserve the QR history.

---

## 40. QR Replacement

A replacement QR must not create a new Asset Identity.

The old QR Record must remain in history.

Replacement reasons include:

- Label damaged
- Label lost
- Label illegible
- Asset refinished
- Asset repaired
- Label-position change
- Security concern
- QR version migration
- Incorrect original assignment

Where theft or duplication is suspected, the old QR must be revoked rather than merely replaced.

---

## 41. Offline Scanning

The mobile application must support controlled offline scanning where network access is unavailable.

Offline functionality may include:

- Reading previously cached permitted entity data
- Recording scan events
- Building temporary transaction queues
- Warning where validation cannot be completed
- Preventing high-risk actions that require live confirmation

Each offline scan must record:

- Device timestamp
- User
- Device ID
- Cached workflow context
- Offline transaction sequence
- QR payload
- Proposed action
- Synchronisation status

Offline scans remain pending until synchronised and validated.

---

## 42. Offline Conflict Resolution

A synchronised offline transaction may conflict with newer server data.

Examples:

- Asset was moved by another operator.
- Asset was allocated to another event.
- QR was revoked.
- Picking list changed.
- Asset entered quarantine.
- Duplicate movement occurred.

Conflicted transactions must not silently overwrite current data.

Conflict statuses:

- Pending Review
- Automatically Reconciled
- Rejected
- Supervisor Override Required
- Duplicate Ignored
- Manual Correction Required

All conflict resolution must be audited.

---

## 43. Device Management

QR scans may originate from:

- EventOS mobile application
- Rugged handheld scanner
- Warehouse tablet
- Fixed scanning station
- Vehicle-mounted device
- Web camera scanner
- Integrated third-party device

Registered devices may contain:

- Device ID
- Device type
- Assigned business
- Assigned warehouse
- Assigned user or team
- Security status
- Last synchronisation
- Application version
- Last scan
- Offline permission
- Revocation status

Compromised or lost devices must be remotely revocable where supported.

---

## 44. Scan Permissions

Permissions may control:

- Which entity types a user may scan.
- Which warehouses the user may operate in.
- Which scan modes are available.
- Whether the user may complete transactions.
- Whether the user may accept discrepancies.
- Whether the user may replace QR labels.
- Whether the user may use offline mode.
- Whether the user may view client or commercial information.
- Whether supervisor approval is required.

Viewing a QR Record does not automatically grant authority to change the underlying entity.

---

## 45. Scan Confirmation Levels

A workflow may require one of the following confirmation levels:

### Level 1 — Immediate

The scan completes a low-risk action immediately.

Example:

- Identify asset
- Confirm location view
- Add item to an unconfirmed count session

### Level 2 — Operator Confirmation

The operator must review and confirm the transaction.

Example:

- Warehouse movement
- Picking completion
- Packing

### Level 3 — Dual Confirmation

Two authorised users or roles must confirm.

Example:

- High-value dispatch
- Client-owned asset transfer
- Secure container handover
- Write-off-related custody movement

### Level 4 — Supervisor Approval

The action is held pending approval.

Example:

- Incompatible substitution
- Cross-event asset reassignment
- Revoked-label override
- Capacity override
- Dispatch with unresolved shortages

---

## 46. Scan Evidence

Certain scans may require additional evidence.

Evidence types include:

- Photograph
- Signature
- Quantity confirmation
- Condition grade
- Seal number
- GPS position
- Reason code
- Comment
- Supervisor PIN or approval
- Recipient identity
- Custody confirmation

Evidence requirements must be configurable by workflow, asset category, ownership type, value or event risk.

---

## 47. GPS and Location Evidence

Where legally permitted and operationally required, EventOS may capture device location during selected scan events.

Examples:

- Vehicle dispatch
- Venue arrival
- High-value custody transfer
- Remote asset inspection
- Lost-asset recovery

GPS data is supporting evidence.

It does not replace structured Warehouse or Event Location Records.

Location capture must comply with user permissions and applicable privacy requirements.

---

## 48. Scan History

Every QR Record must provide a chronological scan history.

Each scan event must contain:

- Scan Event ID
- QR Record
- Resolved entity
- Scan mode
- User
- Device
- Timestamp
- Business
- Warehouse or event
- Structured location
- Workflow
- Transaction result
- Validation result
- Online or offline status
- Related operational record
- Evidence attachments
- GPS data where permitted
- Exception or override reason

Scan history must remain available after QR replacement or revocation.

---

## 49. Scan Event Identifier

Every scan event shall have an immutable identifier.

Format:

`SCN-############`

Example:

`SCN-000000438721`

The Scan Event ID must be available for audit, support and discrepancy investigation.

---

## 50. QR Search and Traceability

Users with permission must be able to search using:

- QR Record ID
- QR payload
- Asset code
- Asset Instance ID
- Batch ID
- Kit ID
- Container ID
- Location code
- Scan Event ID
- User
- Device
- Event
- Warehouse
- Date range
- Scan mode
- Transaction result
- Exception type

Traceability must support:

- First assignment
- Activation
- Every scan
- Every replacement
- Revocation
- Current linked entity
- Last confirmed location
- Last confirmed custodian

---

## 51. QR Printing

EventOS shall support individual and bulk label printing.

Print operations may be initiated from:

- Asset creation
- Goods receipt
- Batch intake
- Kit creation
- Location setup
- Replacement request
- Legacy migration
- Inventory remediation

Each print job must record:

- Print Job ID
- Label template
- Printer
- Quantity
- QR Records included
- Requested by
- Printed by
- Timestamp
- Print status
- Reprint reason
- Failed labels
- Cancelled labels

Unattached surplus labels must remain inactive or be securely destroyed.

---

## 52. Label Templates

Label templates must support:

- Entity type
- Label dimensions
- QR dimensions
- Human-readable text
- Business branding
- Handling symbols
- Material type
- Printer type
- Print resolution
- Orientation
- Language
- Secondary barcode where required

Template changes must be version controlled.

A template change does not require replacement of valid existing labels unless readability, security or operational requirements demand it.

---

## 53. QR Quality Control

The system must support label quality checks for:

- Scannability
- Correct entity resolution
- Print contrast
- Minimum QR size
- Quiet-zone clearance
- Label durability
- Placement accuracy
- Human-readable code accuracy

Every activated label must pass at least one successful test scan.

Bulk print jobs may require sample-based or full verification depending on risk.

---

## 54. QR Security

QR security controls must include:

- Opaque payloads
- Payload integrity validation
- Revocation
- Version control
- Duplicate detection
- Permission-based record access
- Rate limiting where appropriate
- Suspicious scan monitoring
- Device authentication
- Audit logging

Scanning an EventOS QR outside an authenticated environment may display only a restricted identification page or no information, depending on configuration.

---

## 55. Public Scan Behaviour

For selected assets, EventOS may allow limited public QR access.

Examples:

- Lost-item return instructions
- Equipment owner contact channel
- Safety instructions
- Setup guide
- Public event information

Public access must never expose:

- Commercial values
- Client details
- Private contact details without approval
- Full movement history
- Warehouse locations
- Security information
- Internal event plans

Public QR behaviour must be explicitly enabled.

---

## 56. Fraud and Tamper Indicators

EventOS should flag suspicious patterns such as:

- One serialized QR scanned in distant locations within an impossible time.
- A revoked label repeatedly scanned.
- Excessive unknown-code scans.
- Multiple assets claiming the same serial number.
- QR replacement followed by continued old-label activity.
- High-value assets scanned by unauthorised devices.
- Asset movement outside an approved workflow.
- Repeated manual overrides by the same operator.

Alerts must be routed to authorised operational or security users.

---

## 57. Integration with Requirement Engine

QR Tracking must preserve links between physical assets and Requirement Items.

During picking, staging and deployment, the system must show:

- Requirement Item
- Required Asset Definition or capability
- Required quantity
- Approved variant
- Approved substitution
- Event Design reference
- Deployment destination
- Fulfilment status

A QR scan provides physical fulfilment evidence.

It does not modify the requirement without approved change control.

---

## 58. Integration with Procurement

Procured items may receive QR identities during goods receipt.

The scan workflow must link the received item to:

- Procurement Solution
- Purchase Order
- Supplier
- Goods Receipt
- Commercial line
- Ownership type
- Event or stock purpose

QR assignment must not confirm commercial acceptance where inspection or quantity verification remains incomplete.

---

## 59. Integration with Commercial Workspace

QR activity may provide operational evidence for:

- Supplier delivery
- Client-owned asset intake
- Hired asset custody
- Event deployment
- Return confirmation
- Damage claims
- Missing-item claims
- Chargeable loss
- Additional labour or handling

The QR system records operational facts.

Commercial charges still require the applicable approval and business rules.

---

## 60. Integration with Logistics

QR Tracking must support Logistics through:

- Vehicle identification
- Load verification
- Container manifests
- Dispatch confirmation
- Custody transfer
- Arrival confirmation
- Unloading
- Route or stop allocation
- Return loading
- Transfer reconciliation

The actual scanned load must be distinguishable from the planned load.

---

## 61. Integration with Event Execution

During Event Execution, QR scanning must support:

- Zone deployment
- Setup confirmation
- Requirement fulfilment
- Asset handover
- Operational checks
- Breakdown collection
- Missing-item reporting
- Damage reporting
- Return preparation

Execution scans must be aligned with the approved Event Design and Event Plan.

---

## 62. Integration with Finance

QR records may support financial processes by providing evidence for:

- Fixed-asset registration
- Stock movement
- Hired-asset utilisation
- Damage recovery
- Loss recovery
- Supplier disputes
- Client claims
- Inter-warehouse transfer
- Asset disposal
- Inventory adjustment

QR scan history is supporting evidence and does not independently authorise accounting entries.

---

## 63. Reporting

QR Tracking reports must include:

- Assets without active QR labels
- QR labels awaiting activation
- Damaged labels
- Replaced labels
- Revoked labels
- Unknown-code scans
- Duplicate-code alerts
- Scan activity by warehouse
- Scan activity by event
- Movement exceptions
- Offline pending transactions
- Offline conflicts
- Picking discrepancies
- Loading discrepancies
- Return discrepancies
- Last scanned location
- Assets not scanned within a defined period
- User override activity
- Device activity

---

## 64. Performance Requirements

The QR system must be designed for high-volume operational use.

Minimum functional expectations:

- Immediate scan acknowledgement on supported devices.
- Clear success, warning and failure feedback.
- Continuous multi-scan mode.
- Duplicate-scan suppression.
- Recovery from temporary network failure.
- Large picking-list support.
- Large container-manifest support.
- Fast entity resolution.
- Auditable transaction ordering.

The interface must minimise unnecessary typing during warehouse and event operations.

---

## 65. Accessibility and Operational Usability

Scan feedback must use more than colour alone.

Feedback methods should include:

- Text
- Icon
- Sound
- Vibration
- Screen state

The system must clearly distinguish:

- Success
- Warning
- Blocked action
- Duplicate scan
- Unexpected asset
- Offline pending scan

Scanning interfaces must support practical use in:

- Low-light warehouses
- Outdoor venues
- Noisy environments
- Gloved operation where supported
- One-handed mobile operation
- Fast-moving loading environments

---

## 66. Error Correction

Operators must be able to correct scanning mistakes through controlled reversal.

A reversal must capture:

- Original Scan Event ID
- Reversing user
- Timestamp
- Reason
- Replacement transaction where applicable
- Approval where required

The original scan event must remain in history.

High-risk completed transactions may require supervisor reversal.

---

## 67. Retention

QR Records and Scan Events connected to operational, commercial or financial transactions must not be permanently deleted.

Retention must include:

- Active QR history
- Replaced QR history
- Revoked QR history
- Scan events
- Offline events
- Conflict records
- Reversals
- Print history
- Security alerts

Archived assets must retain their QR and scan histories.

---

## 68. Roles and Permissions

Minimum permission groups:

- View QR Identity
- Scan Assets
- Perform Warehouse Movements
- Receive Assets
- Pick Assets
- Pack Assets
- Stage Assets
- Load Vehicles
- Dispatch Loads
- Deploy Assets
- Process Returns
- Report Damage
- Report Missing Assets
- Build Kits
- Verify Kits
- Create QR Records
- Activate QR Labels
- Replace QR Labels
- Revoke QR Labels
- Print QR Labels
- Use Offline Scanning
- Resolve Offline Conflicts
- Override Scan Validation
- View Scan Audit History
- Manage Scan Devices
- Manage Label Templates

---

## 69. Audit Requirements

EventOS must retain an immutable audit history for:

- QR creation
- QR assignment
- QR activation
- QR suspension
- QR replacement
- QR revocation
- Label printing
- Label reprinting
- Scan events
- Scan reversals
- Scan overrides
- Offline synchronisation
- Conflict resolution
- Device registration
- Device revocation
- Template changes
- Security alerts

Each audit entry must contain:

- User
- Timestamp
- Device
- QR Record
- Referenced entity
- Previous state
- New state
- Action
- Reason
- Related workflow
- Evidence where applicable

---

## 70. Locked Business Rules

**AM-QR-001**  
Every QR code must resolve to one recognised EventOS QR Record.

**AM-QR-002**  
A QR code identifies an EventOS entity but does not replace the entity’s system identity.

**AM-QR-003**  
QR payloads must not expose sensitive asset, client, event, user or commercial information.

**AM-QR-004**  
Only Active QR Records may complete operational transactions.

**AM-QR-005**  
A printed QR label must be attached, tested and activated before operational use.

**AM-QR-006**  
Replacing a QR label must not create a new Asset Identity.

**AM-QR-007**  
Old, replaced or compromised QR Records must retain their complete history.

**AM-QR-008**  
A scan must be validated against user permission, workflow context and current operational state before completing a transaction.

**AM-QR-009**  
A scan may not silently override asset allocation, condition, quarantine, ownership or event restrictions.

**AM-QR-010**  
Warehouse movements must identify both the moved entity and the structured destination.

**AM-QR-011**  
A scan alone may not complete dispatch, custody transfer or other high-risk commercial action without the required operator confirmation.

**AM-QR-012**  
Quantity-tracked QR transactions must record an explicit or reliably derived quantity.

**AM-QR-013**  
A kit may not be marked Verified while required components are missing.

**AM-QR-014**  
The actual scanned vehicle load must remain distinguishable from the planned load.

**AM-QR-015**  
Return scans must not automatically restore assets to available inventory before required inspection and processing.

**AM-QR-016**  
Unknown QR codes must not automatically create Asset Records.

**AM-QR-017**  
Duplicate, revoked or suspicious QR activity must create an auditable exception or security alert.

**AM-QR-018**  
Offline scans remain provisional until synchronised and validated.

**AM-QR-019**  
Offline conflicts must not silently overwrite newer authoritative data.

**AM-QR-020**  
QR scan history must remain immutable; corrections must occur through controlled reversal or compensating transactions.

**AM-QR-021**  
Physical asset fulfilment confirmed through QR scanning may not alter the approved Event Design without formal change control.

**AM-QR-022**  
QR operational evidence may support commercial and financial actions but may not independently authorise them.

**AM-QR-023**  
Every completed scan transaction must record the user, device, timestamp, entity, context and outcome.

**AM-QR-024**  
A serialized Asset Instance may not be successfully scanned into two incompatible current locations.

**AM-QR-025**  
Unattached or unused preprinted QR labels must remain inactive or be securely invalidated.

---

## 71. Completion Criteria

QR Identification and Tracking is complete when EventOS can:

- Create secure QR Records.
- Assign QR identities to assets, batches, kits, containers, locations and operational documents.
- Print and activate QR labels.
- Support primary and secondary labels.
- Identify scanned entities.
- Process warehouse movements.
- Receive, pick, pack and stage assets.
- Build and verify kits.
- Load and dispatch vehicles.
- Confirm venue arrival and unloading.
- Track event deployment.
- Confirm Requirement Item fulfilment.
- Process returns.
- Report damage and missing assets.
- Handle unknown, duplicated, damaged and revoked QR codes.
- Replace labels without changing Asset Identity.
- Support controlled offline scanning.
- Resolve offline conflicts.
- retain complete scan and label histories.
- integrate QR evidence with Warehouse, Logistics, Execution, Commercial Workspace and Finance.
- provide secure, auditable physical traceability across the asset lifecycle.

---

## Section 09.04 — Asset Reservation and Allocation

### 1. Purpose

Asset Reservation and Allocation defines how EventOS secures physical assets and stock quantities for approved Event Requirements without confusing planned demand, commercial sourcing, warehouse availability or physical deployment.

The system must answer:

- Which event requires the asset?
- Which Requirement Item is being fulfilled?
- What quantity is required?
- For which dates is the asset required?
- Has capacity been held provisionally or confirmed?
- Has a specific physical asset been allocated?
- Is the asset still physically available?
- Are there competing demands?
- Is substitution permitted?
- What happens if dates, quantities or designs change?
- When is the asset released back into availability?

Reservation protects future availability.

Allocation selects the actual assets or stock quantities intended to fulfil the reservation.

Neither reservation nor allocation proves that an asset has been picked, dispatched or deployed.

---

## 2. Architectural Position

Asset Reservation and Allocation sits between approved demand and physical warehouse execution.

The sequence is:

`Event Design → Requirement Item → Fulfilment Strategy → Asset Reservation → Asset Allocation → Picking → Staging → Dispatch → Deployment`

The section integrates with:

- Event Design Studio
- Requirement Engine
- Procurement Studio
- Commercial Workspace
- Asset Identity
- Warehouse Management
- QR Tracking
- Logistics
- Event Execution
- Finance
- Change Control

The Requirement Item remains the source of demand.

The Asset Reservation Record is the operational commitment against that demand.

---

## 3. Core Distinction

EventOS must treat the following concepts separately:

### 3.1 Requirement Demand

What the event needs.

Example:

`120 white dining chairs required for 12 September 2026`

### 3.2 Availability

What EventOS currently predicts can be supplied during the required period.

### 3.3 Reservation

Capacity held for an event or Requirement Item.

### 3.4 Allocation

Specific serialized assets, batches or stock quantities assigned to fulfil the reservation.

### 3.5 Picking

Physical removal of allocated assets from storage.

### 3.6 Deployment

Physical placement at the event.

A Requirement Item may exist without a reservation.

A reservation may exist without specific allocation.

An allocation may exist before physical picking.

---

## 4. Reservation Record

Every reservation must have an immutable Reservation ID.

Format:

`RSV-##########`

Example:

`RSV-0000018427`

Each Reservation Record must contain:

- Reservation ID
- Controlling business
- Event
- Event version
- Requirement Item
- Reservation type
- Reservation status
- Asset Definition or capability requirement
- Required quantity
- Unit of measure
- Required-from date and time
- Required-until date and time
- Preparation lead time
- Return-processing lead time
- Reservation priority
- Fulfilment source
- Warehouse scope
- Substitution policy
- Created by
- Created timestamp
- Last updated timestamp

Where applicable:

- Client
- Venue
- Event zone
- Design element
- Approved variant
- Condition requirement
- Supplier source
- Internal owner
- Cost centre
- Commercial line
- Logistics wave
- Setup date
- Breakdown date
- Reservation notes

---

## 5. Reservation Types

EventOS shall support the following Reservation Types:

### 5.1 Provisional Reservation

Temporarily holds predicted availability while the event, quotation or commercial decision remains unresolved.

### 5.2 Confirmed Reservation

Commits inventory capacity to an approved event requirement.

### 5.3 Internal Operational Reservation

Holds assets for maintenance, refurbishment, showroom use, training, internal events or other non-client activities.

### 5.4 Supplier-Backed Reservation

Represents capacity confirmed from an external supplier.

### 5.5 Client-Owned Asset Reservation

Reserves a client-owned asset for the event in which it will be used.

### 5.6 Contingency Reservation

Holds backup assets or buffer quantities.

### 5.7 Replacement Reservation

Created to replace an unavailable, damaged, lost or unsuitable asset.

### 5.8 Transfer Reservation

Holds inventory for transfer between warehouses before event fulfilment.

---

## 6. Reservation Status

Permitted Reservation statuses are:

- Draft
- Availability Check
- Provisional
- Pending Approval
- Confirmed
- Partially Allocated
- Fully Allocated
- Picking Released
- Partially Picked
- Fully Picked
- Staged
- Fulfilled
- Partially Fulfilled
- At Risk
- Suspended
- Expired
- Cancelled
- Released
- Closed

Reservation status must be system-controlled where workflow progression determines the state.

Manual status overrides require permission and reason capture.

---

## 7. Reservation Time Window

Every reservation must define the full operational occupancy period.

The occupancy window must include:

- Preparation lead time
- Cleaning or testing time
- Picking period
- Packing period
- Staging period
- Dispatch
- Transport
- Setup
- Event operation
- Breakdown
- Return transport
- Return processing
- Inspection
- Cleaning
- Restocking buffer

The reservation period is not limited to the event start and end time.

Example:

An event occurs on 12 September.

The asset may need to be reserved from 9 September through 14 September.

---

## 8. Availability Window

EventOS must calculate availability over the complete reservation period.

An asset is available only where no conflicting process makes it unavailable during any required part of the window.

Conflicting processes include:

- Confirmed reservation
- Higher-priority provisional hold
- Maintenance
- Quarantine
- Inspection
- Warehouse transfer
- External custody
- Event deployment
- Planned disposal
- Cleaning
- Repair
- Regulatory expiry
- Scheduled internal use

Availability must be calculated at date-and-time level where operational timing matters.

---

## 9. Availability Calculation

For quantity-tracked assets:

`Available Quantity = Eligible On-Hand Quantity + Confirmed Incoming Quantity - Confirmed Reservations - Operational Holds - Required Buffer`

For serialized assets:

Availability is evaluated per Asset Instance.

The calculation must consider:

- Current physical status
- Future reservation conflicts
- Warehouse location
- condition
- readiness
- transfer time
- event geography
- preparation requirements
- transport constraints
- ownership restrictions
- certification validity
- expected return reliability
- supplier confirmation status

Availability is a forecast until physical allocation and fulfilment occur.

---

## 10. Availability States

EventOS shall return one of the following availability outcomes:

- Fully Available
- Available with Transfer
- Available with Preparation
- Available with Approved Substitution
- Partially Available
- Supplier Availability Required
- Availability At Risk
- Not Available
- Availability Unknown

The outcome must explain the cause.

Examples:

- 80 units available internally; 40 require supplier hire.
- Asset available only after transfer from Cape Town.
- Asset expected back from another event with insufficient buffer.
- Matching quantity exists, but 15 units are under inspection.
- Approved colour variant unavailable.

---

## 11. Reservation Priority

Every reservation must have a priority.

Standard priorities:

1. Critical Operational
2. Contractually Confirmed Event
3. Confirmed Internal Event
4. Approved Contingency
5. Provisional Client Event
6. Internal Non-Event Use
7. Forecast Demand

Priority influences conflict handling but does not permit silent displacement of existing commitments.

A higher-priority reservation may trigger an escalation.

It may not automatically cancel or take assets from another confirmed event.

---

## 12. Provisional Reservation Rules

A provisional reservation may be created for:

- Active quotation
- Tentative booking
- Design option under consideration
- Client decision pending
- Supplier capacity awaiting confirmation
- Internal planning scenario

Every provisional reservation must have:

- Expiry date and time
- Hold reason
- Responsible owner
- Commercial context
- Release rule
- Conversion requirement

Expired provisional reservations must release automatically unless extended by an authorised user.

Extension history must remain auditable.

---

## 13. Confirmed Reservation Rules

A reservation may become Confirmed only where:

- The Requirement Item is approved for operational fulfilment.
- Required quantity and dates are defined.
- Fulfilment source is identified.
- Commercial approval conditions are met.
- Required operator approval exists.
- Availability has been evaluated.
- Conflicts are resolved or explicitly accepted.

Confirmation represents an operational commitment.

It does not guarantee fulfilment where future damage, loss, delay or supplier failure occurs.

---

## 14. Reservation Against Requirement Items

Every event reservation must reference at least one Requirement Item.

A Requirement Item may be fulfilled through:

- One reservation
- Multiple reservations
- Internal and supplier reservations combined
- Partial reservations across warehouses
- Primary and contingency reservations
- Multiple asset variants where approved

The sum of active confirmed reservations must be compared with the approved requirement quantity.

The system must flag:

- Under-reservation
- Exact reservation
- Over-reservation
- Duplicate reservation
- Reservation against cancelled requirement
- Reservation against outdated event version

---

## 15. Reservation Group

Related reservations may be grouped under a Reservation Group.

Examples:

- All furniture for one event
- All equipment for one venue zone
- All items in one logistics wave
- All assets for one Event Design element
- Primary and contingency assets
- Multi-warehouse fulfilment package

Reservation Group ID format:

`RSG-########`

A Reservation Group may support:

- Group approval
- Group release
- Group conflict review
- Group picking release
- Group risk assessment
- Group change propagation

---

## 16. Capability-Based Reservation

Where the final Asset Definition has not yet been selected, EventOS may reserve against a capability specification.

Example:

`Seating for 120 guests, white finish, outdoor suitable`

Capability-based reservation must define:

- Required capability
- Quantity
- variant constraints
- condition standard
- operational restrictions
- substitution tolerance
- required dates
- sourcing deadline

Capability reservations must be resolved into specific Asset Definitions before picking release.

---

## 17. Asset Definition Reservation

An Asset Definition reservation holds capacity for a specific asset type.

Example:

`120 × White Tiffany Chair`

This does not necessarily identify the exact physical units.

It reserves eligible quantity across permitted warehouses or fulfilment sources.

---

## 18. Serialized Asset Allocation

Serialized allocation assigns specific Asset Instances to the reservation.

Each Allocation Record must contain:

- Allocation ID
- Reservation ID
- Asset Instance ID
- Allocation status
- Source warehouse
- Current location
- Required-from time
- Required-until time
- Allocation priority
- Selection method
- Allocated by
- Allocation timestamp
- readiness status
- conflict status

Allocation ID format:

`ALC-##########`

Example:

`ALC-0000063182`

---

## 19. Quantity Allocation

For quantity-tracked assets, allocation must reserve a defined quantity from:

- Warehouse
- Location
- Batch
- Container
- Stock status
- Ownership source

Each quantity allocation must contain:

- Asset Definition
- Quantity
- Unit of measure
- Warehouse
- Location scope
- Batch where applicable
- Reservation
- Allocation status
- Picked quantity
- Remaining allocated quantity

Quantity allocation may be location-specific or warehouse-level until picking.

---

## 20. Batch Allocation

Batch allocation is required where batch characteristics affect fulfilment.

Examples:

- Linen dye consistency
- Branded material
- Production run
- Imported stock batch
- Food-contact certification
- Custom finish

A reservation may require:

- One batch only
- Same batch preferred
- Multiple batches permitted
- Specific batch mandatory

The system must warn where fulfilling from multiple batches may create visible or operational inconsistency.

---

## 21. Allocation Status

Permitted Allocation statuses are:

- Proposed
- Reserved
- Confirmed
- Pending Inspection
- Pending Preparation
- Pending Transfer
- Ready
- Pick Released
- Picked
- Packed
- Staged
- Dispatched
- Deployed
- Returned
- Unavailable
- Replaced
- Released
- Cancelled
- Closed

Allocation status must remain distinct from Reservation status.

---

## 22. Allocation Timing

Specific allocation may occur:

- At reservation confirmation
- At a defined planning milestone
- Before picking release
- During warehouse wave planning
- During picking
- After inspection
- After supplier confirmation

The timing depends on asset type.

Early allocation is preferred for:

- Unique assets
- High-value assets
- Custom décor
- Client-owned assets
- Serialized technical equipment
- Assets requiring preparation
- Assets with limited substitutes

Late allocation may be permitted for:

- Large pools of interchangeable stock
- Low-value quantity-tracked items
- Standard consumables
- Frequently rotating stock

---

## 23. Allocation Selection Rules

Allocation may consider:

- Correct Asset Definition
- Approved variant
- Asset capability
- condition
- warehouse
- location
- readiness
- event proximity
- expected return date
- maintenance schedule
- transport efficiency
- ownership type
- client restrictions
- supplier restrictions
- certification
- usage history
- balancing asset utilisation
- matching sets
- batch consistency
- kit compatibility

Allocation rules must be configurable by asset category.

---

## 24. Automated Allocation

EventOS may propose automated allocation.

The system may optimise for:

- Closest warehouse
- Lowest logistics cost
- Best condition match
- Lowest conflict risk
- Highest readiness
- Minimum warehouse splits
- Same batch
- Same kit family
- Balanced asset utilisation
- Earliest available stock

Automated allocation is a recommendation.

Operator approval is required before high-impact reallocations, substitutions or cross-event changes are committed.

---

## 25. Manual Allocation

Authorised users may manually allocate assets.

Manual allocation must still validate:

- Availability
- reservation conflict
- condition
- warehouse compatibility
- ownership
- event suitability
- maintenance
- certification
- date window
- kit membership

A warning may be overridden only where the user has the required permission.

A hard block may not be bypassed without the defined exception process.

---

## 26. Soft and Hard Allocation

### 26.1 Soft Allocation

Identifies preferred assets without preventing controlled reselection.

Used during:

- Provisional planning
- Early design development
- Forecasting
- Initial warehouse balancing

### 26.2 Hard Allocation

Commits specific assets or quantities to the reservation.

Used when:

- Event is confirmed
- Picking preparation begins
- Unique assets are selected
- Client-approved items must be protected
- Logistics planning depends on exact assets

Hard allocation must reduce general availability.

---

## 27. Reservation Scope

A reservation may be scoped to:

- Specific warehouse
- Warehouse group
- Business-wide inventory
- Region
- Supplier
- Client-owned pool
- Named batch
- Named kit
- Named serialized assets
- Internal-plus-supplier fulfilment

Broad-scope reservations must narrow into specific allocations before operational release.

---

## 28. Multi-Warehouse Fulfilment

A reservation may be fulfilled from multiple warehouses.

The system must show:

- Quantity per warehouse
- Transfer requirement
- transfer lead time
- logistics impact
- expected arrival
- staging warehouse
- conflict risk
- cost impact
- responsible warehouse teams

Multi-warehouse fulfilment should be minimised where unnecessary operational complexity outweighs benefit.

---

## 29. Supplier-Backed Reservation

Where internal assets are insufficient, a Supplier-Backed Reservation may be created.

It must reference:

- Supplier
- Procurement Solution
- quote or contract
- Asset Definition or capability
- quantity
- supply dates
- collection or delivery method
- confirmation status
- cancellation terms
- ownership
- expected return
- supplier confidence
- backup source

Supplier availability must not be treated as confirmed until the required supplier commitment exists.

---

## 30. Client-Owned Reservation

Client-owned assets may be reserved where the client provides items for their event.

The reservation must record:

- Client
- Asset Record
- expected intake date
- custody start
- inspection requirement
- insurance responsibility
- usage restriction
- return requirement
- authorised event
- release conditions

Client-owned assets may not be allocated to another event without explicit authorised agreement.

---

## 31. Contingency Reservation

A contingency reservation holds backup capacity.

Examples:

- Spare microphones
- Backup generator
- Extra seating
- Additional linen
- Replacement lighting fixtures
- Weather contingency structures

Contingency quantities must be separately identified from primary requirement quantities.

They may be:

- Mandatory
- Recommended
- Optional
- Trigger-based

Contingency assets reduce availability while actively reserved.

---

## 32. Buffer Rules

Asset Definitions or categories may define reservation buffers.

Buffer types include:

- Quantity buffer
- Percentage buffer
- minimum spare units
- turnaround-time buffer
- inspection buffer
- damage-risk buffer
- transport-delay buffer

Example:

`100 chairs required + 5% operational buffer = 105 reserved`

The system must distinguish:

- Client requirement quantity
- Operational buffer quantity
- Total reserved quantity

Buffer quantities must not silently increase client charges.

---

## 33. Asset Matching Rules

A reservation may specify matching requirements.

Examples:

- Same colour
- Same finish
- Same model
- Same production batch
- Same condition grade
- Same fabric lot
- Same dimensions
- Same manufacturer
- Same visual family

Matching may be:

- Mandatory
- Strongly Preferred
- Preferred
- Not Required

The system must flag when the available allocation breaks a matching rule.

---

## 34. Condition Requirements

A reservation may require a minimum condition grade.

Example grades:

- New
- Premium
- Event Ready
- Serviceable
- Utility Use Only

The reservation must not allocate assets below the required condition without approved exception.

Condition suitability must be reassessed before picking where the latest inspection is outdated or risk is high.

---

## 35. Readiness Requirements

An asset may be available by date but not yet event ready.

Readiness conditions may include:

- Cleaning
- charging
- testing
- programming
- fabrication
- repair
- branding
- configuration
- certification
- kit assembly
- consumable replenishment

A reservation is At Risk where readiness cannot be completed before the required release time.

---

## 36. Substitution Policy

Every reservation must define a substitution policy.

Supported policies:

- No Substitution
- Exact Variant Required
- Approved Equivalent Only
- Same Asset Family Permitted
- Capability Equivalent Permitted
- Operator Approval Required
- Client Approval Required
- Design Approval Required
- Emergency Substitution Permitted

Substitution policy must derive from the Requirement Item and Event Design.

---

## 37. Substitution Proposal

A substitution proposal must contain:

- Original required asset
- proposed substitute
- quantity
- reason
- design impact
- operational impact
- commercial impact
- logistics impact
- client impact
- approval requirements
- expiry
- proposed by

A substitute may not be treated as approved merely because it is available.

---

## 38. Substitution Approval

Approval may be required from:

- Event Designer
- Project Manager
- Warehouse Manager
- Commercial Operator
- Client
- Technical Lead
- Safety Officer

The required approvals depend on impact.

A substitution affecting the visual Event Design must follow Event Design change control.

A substitution affecting price must follow Commercial Workspace approval.

---

## 39. Conflict Detection

A reservation conflict occurs where the same capacity is required by incompatible commitments.

Conflict checks must include:

- Overlapping reservation windows
- preparation and turnaround time
- warehouse transfer time
- maintenance
- condition
- event priority
- supplier uncertainty
- transport capacity
- kit membership
- batch availability
- ownership restrictions
- geography
- event cancellation risk
- expected late return

Conflict detection must operate when:

- Creating a reservation
- changing dates
- changing quantities
- confirming a reservation
- allocating assets
- releasing picking
- processing delays
- reporting damage or loss

---

## 40. Conflict Types

Supported conflict types include:

- Quantity Shortage
- Serialized Asset Double Allocation
- Date Overlap
- Turnaround-Time Conflict
- Warehouse Transfer Conflict
- Maintenance Conflict
- Condition Conflict
- Ownership Conflict
- Certification Conflict
- Kit Conflict
- Batch Conflict
- Logistics Conflict
- Supplier Confirmation Conflict
- Event Version Conflict
- Design Variant Conflict
- Buffer Conflict

---

## 41. Conflict Severity

Conflict severity levels:

- Information
- Warning
- At Risk
- Critical
- Blocking

A Blocking conflict prevents confirmation or operational release.

A Critical conflict requires active resolution and management visibility.

Conflict severity must be based on business rules, not only user judgement.

---

## 42. Conflict Resolution Options

EventOS may propose:

- Allocate alternative Asset Instances
- Use another warehouse
- Create warehouse transfer
- Split fulfilment
- Engage supplier
- Approve substitute
- Adjust preparation schedule
- Reduce contingency quantity
- Change event timing
- Reallocate lower-priority provisional demand
- Expedite repair
- Increase turnaround resources
- Escalate decision

The system may recommend solutions but must not make unapproved commercial or Event Design changes.

---

## 43. Reservation Displacement

A reservation may be displaced only through an authorised process.

Displacement means reducing or removing held capacity to satisfy another demand.

Displacement rules:

- Draft and expired reservations may be released automatically.
- Provisional reservations may be displaced according to policy and approval.
- Confirmed reservations may not be displaced silently.
- Contractual commitments require commercial review.
- Client impact must be recorded.
- Replacement fulfilment must be pursued where possible.

Every displacement must retain an audit trail and reason.

---

## 44. Waitlist

Where assets are unavailable, a Requirement Item may enter a waitlist.

Waitlist records must contain:

- Requirement Item
- requested asset
- quantity
- required dates
- priority
- acceptable substitutes
- latest decision date
- responsible owner
- fulfilment alternatives
- status

Waitlist statuses:

- Open
- Monitoring
- Partial Opportunity
- Availability Found
- Alternative Proposed
- Escalated
- Resolved
- Cancelled
- Expired

EventOS may notify users when capacity becomes available.

It may not automatically confirm the reservation without the required approval.

---

## 45. Reservation Expiry

Reservations may expire based on:

- quotation expiry
- client decision deadline
- deposit deadline
- commercial approval deadline
- supplier hold expiry
- operational milestone
- manual expiry date

Before expiry, EventOS may:

- warn the owner
- request extension
- escalate high-value holds
- identify competing demand

After expiry, provisional capacity must be released unless an authorised extension exists.

---

## 46. Reservation Extension

An extension must capture:

- Previous expiry
- new expiry
- reason
- approved by
- competing demand impact
- commercial justification
- extension timestamp

Repeated extensions may require higher approval.

The system should flag prolonged provisional holds that block confirmed business.

---

## 47. Reservation Release

Reservation capacity may be released because of:

- Event cancellation
- requirement removal
- quantity reduction
- design change
- substitute selection
- supplier change
- event completion
- asset return and processing
- provisional expiry
- manual correction

Release must identify:

- Released quantity or assets
- release reason
- user
- timestamp
- related change
- downstream impact

Release does not reverse prior physical transactions.

---

## 48. Partial Release

A reservation may be partially released.

Example:

Original reservation: 150 chairs  
Revised requirement: 120 chairs  
Released quantity: 30 chairs

The system must preserve:

- original quantity
- revised quantity
- released quantity
- reason
- event version
- audit history

---

## 49. Requirement Change Propagation

When an approved Requirement Item changes, EventOS must assess reservation impact.

Relevant changes include:

- Quantity
- dates
- venue
- deployment zone
- asset type
- variant
- condition
- setup timing
- event cancellation
- design revision

The system must identify:

- reservations requiring amendment
- allocations no longer suitable
- surplus capacity
- new shortage
- transfer changes
- supplier changes
- commercial impact
- picking impact

Changes must not silently overwrite confirmed reservations.

---

## 50. Event Version Control

Every reservation must reference the Event version on which it was created or last confirmed.

When a new Event version is approved, affected reservations must be classified as:

- Still Valid
- Requires Review
- Requires Quantity Change
- Requires Date Change
- Requires Asset Change
- Requires Cancellation
- New Reservation Required

Old reservation versions must remain auditable.

---

## 51. Reservation Freeze

A reservation may enter a Freeze state near execution.

Freeze prevents uncontrolled changes after operational preparation begins.

Freeze may apply at:

- Event level
- Reservation Group level
- Requirement Item level
- Logistics wave level
- Asset category level

During Freeze:

- allocation changes require approval
- substitutions require approval
- quantity reductions require review
- warehouse changes require review
- picking changes are audited

Freeze does not prevent emergency corrective action.

---

## 52. Picking Release

A reservation may be released for picking only where:

- Reservation is confirmed.
- Required allocation level is complete.
- Event version is valid.
- No Blocking conflict exists.
- Warehouse source is defined.
- Required approvals are complete.
- Asset readiness is acceptable.
- logistics timing is defined.
- substitution decisions are resolved.

Picking Release creates an authorised warehouse work demand.

It does not mark assets as physically picked.

---

## 53. Picking Wave Assignment

Reservations may be assigned to picking waves.

A Picking Wave may group assets by:

- Event
- dispatch time
- warehouse
- asset category
- vehicle
- venue zone
- setup sequence
- labour team
- logistics route

The reservation must retain its own identity inside the wave.

---

## 54. Allocation Lock

Allocation may be locked when exact physical assets must no longer change without approval.

Allocation Lock may occur:

- Before client inspection
- Before packing
- Before technical programming
- Before load planning
- After kit sealing
- After dispatch documentation
- For unique design pieces

A locked allocation may be changed only through controlled replacement.

---

## 55. Asset Replacement

If an allocated asset becomes unavailable, EventOS must create a replacement action.

Replacement reasons include:

- Damage
- loss
- maintenance failure
- inspection failure
- late return
- warehouse discrepancy
- supplier failure
- logistics failure
- incorrect allocation

The replacement process must preserve:

- Original Allocation
- original asset
- replacement asset
- reason
- approval
- timing
- operational impact
- commercial impact

---

## 56. Damage Impact

When a reserved or allocated asset is reported damaged, EventOS must:

1. Assess whether the asset remains suitable.
2. Remove it from eligible availability where required.
3. identify affected reservations.
4. classify reservation risk.
5. propose replacement options.
6. notify responsible operators.
7. preserve the original allocation history.

Damage must not silently reduce a confirmed event quantity.

---

## 57. Loss and Location-Unknown Impact

When an allocated asset becomes Lost, Stolen or Location Unknown:

- Future reservations must be reassessed.
- Current allocations must become At Risk or Unavailable.
- Replacement sourcing must begin.
- Last confirmed location and custody must be displayed.
- Investigation records must be linked.
- Availability forecasts must exclude the asset where policy requires.

---

## 58. Maintenance Impact

Planned maintenance must block or qualify availability during its scheduled window.

Unplanned maintenance must trigger immediate reservation impact analysis.

Maintenance may be rescheduled only where:

- safety is not compromised
- asset readiness remains valid
- responsible technical approval exists
- event impact is considered

Safety-required maintenance may not be overridden for availability reasons.

---

## 59. Reservation Risk

Each active reservation must have a risk state.

Permitted states:

- Low
- Moderate
- High
- Critical
- Blocked

Risk factors may include:

- supplier dependency
- late incoming stock
- tight turnaround
- unresolved transfer
- asset condition
- expected late return
- incomplete allocation
- unapproved substitution
- warehouse discrepancy
- logistics dependency
- certification expiry
- unresolved Event Design change

Risk state must be visible to event operations.

---

## 60. Reservation Confidence

EventOS may calculate a Reservation Confidence score using:

- Internal stock certainty
- allocation completeness
- physical verification
- supplier confirmation
- warehouse transfer status
- asset readiness
- logistics readiness
- historical supplier reliability
- buffer availability
- conflict exposure

The score is advisory.

It must not replace explicit status, risk or approval.

---

## 61. Availability Forecast

The system must provide forward-looking availability views by:

- Asset Definition
- Asset family
- category
- warehouse
- region
- event period
- reservation status
- ownership
- supplier
- quantity
- condition
- capability

Forecast views must distinguish:

- On hand
- Available
- provisionally held
- confirmed
- allocated
- expected incoming
- in maintenance
- at risk
- unavailable
- external supplier capacity

---

## 62. Calendar View

Asset availability must support calendar visualisation.

The calendar should display:

- Reservation windows
- provisional holds
- confirmed commitments
- allocation periods
- maintenance
- transfers
- event deployments
- turnaround buffers
- supplier holds
- conflicts

Serialized assets may be viewed individually.

Quantity-tracked assets may be viewed as capacity over time.

---

## 63. Capacity Heatmap

EventOS should provide a demand-versus-capacity heatmap.

The heatmap may show:

- Low utilisation
- Moderate utilisation
- High utilisation
- Near capacity
- Overcommitted
- At risk
- Unknown capacity

Heatmaps must support filtering by category, warehouse, event period and region.

---

## 64. Overbooking

Overbooking occurs when active commitments exceed eligible capacity.

Overbooking must be classified as:

- Provisional Overbooking
- Confirmed Overbooking
- Supplier-Dependent Overbooking
- Buffer Overbooking
- Timing Overbooking
- Condition-Based Overbooking

Confirmed overbooking must create a Critical or Blocking exception.

EventOS must not conceal overbooking by counting unsuitable, unconfirmed or unavailable stock.

---

## 65. Controlled Overbooking

Controlled overbooking may be permitted only for defined low-risk asset categories and authorised scenarios.

It requires:

- Defined overbooking limit
- historical justification
- responsible approver
- contingency plan
- risk classification
- monitoring
- clear visibility

Controlled overbooking may not be used for:

- Unique assets
- safety equipment
- regulated equipment
- client-owned assets
- non-substitutable Event Design items
- assets with uncertain returns

---

## 66. Cross-Event Visibility

Authorised users must be able to see how an asset is committed across events.

The view must show:

- Event
- reservation window
- event priority
- quantity
- allocation status
- warehouse
- expected return
- turnaround
- conflict
- next reservation

Sensitive client and commercial details must remain permission controlled.

---

## 67. Cross-Business Control

Where multiple ClientOS businesses operate within a group, reservations must respect business ownership and control.

An asset controlled by one business may be reserved by another only where:

- intercompany access is permitted
- transfer rules exist
- pricing or cost treatment is defined
- custody is controlled
- responsible businesses approve

Cross-business reservations must remain visible to both controlling parties.

---

## 68. Asset Sharing Pools

Asset Definitions may belong to sharing pools.

Examples:

- National furniture pool
- Gauteng technical pool
- Shared premium décor collection
- Client-specific inventory pool
- Supplier consignment pool

Pool rules may define:

- eligible businesses
- eligible warehouses
- transfer requirements
- cost allocation
- priority
- ownership
- approval
- regional restrictions

---

## 69. Reservation Notes and Instructions

Reservations may contain operational instructions such as:

- Use only matching batch.
- Client has approved units 12–24.
- Do not substitute black frame.
- Deliver separately from catering stock.
- Inspect fabric under white light.
- Allocate weatherproof units only.
- Hold two spare fixtures.
- Pack by event zone.

Instructions must be structured where they affect validation.

Free-text notes must not replace enforceable rules.

---

## 70. Notifications

EventOS must support notifications for:

- Provisional reservation nearing expiry
- availability becoming insufficient
- allocation incomplete
- asset damaged
- supplier confirmation missing
- transfer delayed
- Event version changed
- reservation conflict detected
- picking release blocked
- contingency unavailable
- overbooking
- expected late return
- allocation replaced
- reservation released

Notifications must target responsible roles rather than all users indiscriminately.

---

## 71. Reservation Dashboard

The dashboard must provide:

- Upcoming confirmed reservations
- provisional holds
- expiring holds
- unallocated requirements
- partial allocations
- high-risk reservations
- blocking conflicts
- overbooked assets
- supplier-dependent reservations
- transfer-dependent reservations
- picking-ready reservations
- recently released capacity

---

## 72. Search and Filtering

Users must be able to search and filter by:

- Reservation ID
- Event
- Client
- Requirement Item
- Asset Definition
- Asset Instance
- category
- warehouse
- supplier
- date range
- reservation status
- allocation status
- risk
- priority
- ownership
- event version
- logistics wave
- venue
- project manager
- design element

---

## 73. Reporting

Required reports include:

- Reserved versus available capacity
- Reservation utilisation
- Provisional-to-confirmed conversion
- Expired provisional holds
- Allocation completeness
- Reservation conflicts
- Overbooking
- Asset utilisation
- Supplier dependency
- Warehouse transfer dependency
- Unfulfilled requirements
- Released capacity
- Replacement activity
- Contingency usage
- Reservation risk
- Late-return impact
- Allocation changes after freeze
- Manual overrides

---

## 74. Finance Integration

Reservation records may support:

- Internal asset utilisation costing
- Supplier hire commitments
- intercompany asset charges
- event margin analysis
- lost opportunity reporting
- cancellation cost
- idle-capacity analysis
- damage or replacement cost
- contingency cost

A reservation does not create an accounting entry by itself.

Financial commitments must follow Commercial Workspace and Finance rules.

---

## 75. Commercial Workspace Integration

Commercial Workspace must be informed where reservation changes affect:

- Client price
- supplier cost
- cancellation cost
- substitution price
- delivery cost
- inter-warehouse transfer cost
- additional preparation
- additional contingency
- shortage recovery
- change order

Operational users may not commit commercial changes without the required approval.

---

## 76. Procurement Integration

Where internal availability is insufficient, EventOS may create a procurement demand from the shortage.

The procurement demand must contain:

- Requirement Item
- reservation
- shortage quantity
- required dates
- asset capability
- approved variants
- substitution constraints
- delivery location
- decision deadline
- expected return where hired
- commercial context

Procurement success must update the reservation source and availability state.

---

## 77. Warehouse Integration

Reservation and Allocation must provide Warehouse Management with:

- Authorised picking demand
- source warehouse
- preferred locations
- allocated assets
- quantities
- batches
- readiness tasks
- picking deadline
- staging location
- event or transfer reference
- substitution restrictions

Warehouse physical scans must update picked and staged quantities without redefining the reservation.

---

## 78. QR Tracking Integration

QR Tracking must validate scanned assets against:

- Reservation
- Allocation
- Event
- Requirement Item
- warehouse
- picking list
- permitted substitute
- quantity
- condition
- dispatch wave

Unexpected scans must create an exception or approved substitution workflow.

---

## 79. Logistics Integration

Reservation data must inform Logistics of:

- Required dispatch dates
- source warehouses
- asset dimensions
- weights
- quantities
- containers
- destination
- setup sequence
- return timing
- multi-warehouse dependencies
- supplier collections
- client-owned asset collection

Logistics constraints may place the reservation At Risk.

---

## 80. Event Execution Integration

Event Execution must see:

- Required quantity
- reserved quantity
- allocated quantity
- dispatched quantity
- deployed quantity
- substitutions
- shortages
- contingency stock
- outstanding assets
- event-zone mapping

Execution teams may not change reserved design items without the appropriate change-control process.

---

## 81. AI Assistance

AI may assist by:

- Forecasting shortage risk
- Suggesting allocations
- identifying likely conflicts
- recommending warehouse transfers
- suggesting substitutes
- estimating turnaround risk
- identifying underused assets
- proposing contingency levels
- highlighting supplier dependency

AI may not:

- Confirm reservations
- Displace confirmed events
- approve substitutions
- change Event Design
- commit supplier spend
- release confirmed capacity
- override safety or ownership restrictions

without authorised operator approval.

---

## 82. Roles and Permissions

Minimum permission groups:

- View Reservations
- Create Reservations
- Edit Draft Reservations
- Create Provisional Holds
- Extend Provisional Holds
- Confirm Reservations
- Cancel Reservations
- Release Reservations
- Create Allocations
- Approve Allocations
- Lock Allocations
- Replace Allocated Assets
- Approve Substitutions
- Override Availability Warning
- Resolve Conflicts
- Approve Reservation Displacement
- Approve Controlled Overbooking
- Release Picking
- View Cross-Event Commitments
- View Supplier Capacity
- View Financial Impact
- Manage Reservation Rules

Permissions may be restricted by:

- Business
- warehouse
- region
- event
- asset category
- value
- ownership
- client
- priority
- commercial status

---

## 83. Audit Requirements

EventOS must retain an immutable audit history for:

- Reservation creation
- status changes
- quantity changes
- date changes
- provisional extensions
- confirmation
- cancellation
- release
- allocation
- reallocation
- allocation locking
- replacement
- substitution
- conflict creation
- conflict resolution
- displacement
- overbooking approval
- picking release
- event version impact
- manual override
- AI recommendation acceptance or rejection

Each audit entry must contain:

- User
- Timestamp
- Previous value
- New value
- Reason
- Event
- Requirement Item
- Reservation
- Allocation where applicable
- Approval reference
- Related change record
- Source device or workflow

---

## 84. Locked Business Rules

**AM-RA-001**  
Every event asset reservation must reference at least one Requirement Item.

**AM-RA-002**  
Requirement demand, reservation, allocation, picking and deployment must remain separate operational concepts.

**AM-RA-003**  
A reservation must cover the complete operational occupancy period, not only the event duration.

**AM-RA-004**  
Availability calculations must include preparation, logistics, return, inspection and turnaround buffers.

**AM-RA-005**  
A confirmed reservation reduces available capacity during its complete reservation window.

**AM-RA-006**  
A provisional reservation must have an expiry date, responsible owner and release rule.

**AM-RA-007**  
Expired provisional reservations must release automatically unless an authorised extension exists.

**AM-RA-008**  
Specific serialized assets may not be hard allocated to conflicting reservation windows.

**AM-RA-009**  
Quantity allocations may not exceed eligible available stock unless controlled overbooking is explicitly permitted.

**AM-RA-010**  
Confirmed reservations may not be displaced, reduced or released silently.

**AM-RA-011**  
A higher-priority demand may trigger escalation but may not automatically take assets from another confirmed event.

**AM-RA-012**  
Client-owned assets may not be reserved or allocated to another event without explicit authorised agreement.

**AM-RA-013**  
Supplier capacity must not be treated as confirmed until the required supplier commitment exists.

**AM-RA-014**  
Capability-based reservations must resolve into specific Asset Definitions before picking release.

**AM-RA-015**  
Broad warehouse-level reservations must resolve into operational allocations before physical picking.

**AM-RA-016**  
Substitutions must comply with the Requirement Item, Event Design and applicable approval rules.

**AM-RA-017**  
A visually significant substitution may not bypass Event Design change control.

**AM-RA-018**  
A commercially significant substitution may not bypass Commercial Workspace approval.

**AM-RA-019**  
Assets below the required condition grade may not be allocated without authorised exception.

**AM-RA-020**  
Quarantined, lost, stolen, retired or unsuitable assets must be excluded from eligible availability.

**AM-RA-021**  
An asset becoming damaged, unavailable or location unknown must trigger impact analysis for all affected reservations.

**AM-RA-022**  
Event Requirement changes must not silently overwrite confirmed reservations or allocations.

**AM-RA-023**  
Every reservation must reference the Event version on which it is based.

**AM-RA-024**  
Picking may not be released while Blocking conflicts or required approvals remain unresolved.

**AM-RA-025**  
Physical picking, staging and dispatch must update fulfilment progress but must not redefine the original reservation demand.

**AM-RA-026**  
Operational buffer quantities must remain distinguishable from client requirement quantities.

**AM-RA-027**  
Reservation overbooking must be visible, classified and auditable.

**AM-RA-028**  
Controlled overbooking may not be applied to unique, regulated, safety-critical, client-owned or non-substitutable assets.

**AM-RA-029**  
Reservation releases and partial releases must retain the original quantity and full change history.

**AM-RA-030**  
AI may recommend reservation, allocation or conflict solutions but may not commit them without operator approval.

**AM-RA-031**  
A reservation is not proof of physical possession, picking, dispatch or event deployment.

**AM-RA-032**  
Commercial or accounting actions may use reservation data as evidence but require their own authorisation.

---

## 85. Completion Criteria

Asset Reservation and Allocation is complete when EventOS can:

- Create provisional, confirmed, supplier-backed, client-owned and contingency reservations.
- Link every event reservation to Requirement Items.
- Calculate availability across full operational time windows.
- distinguish reservation from allocation and physical fulfilment.
- reserve Asset Definitions, capabilities, batches, kits and serialized assets.
- allocate exact serialized assets and stock quantities.
- support soft and hard allocation.
- manage multi-warehouse fulfilment.
- manage supplier-backed and client-owned capacity.
- apply buffers and contingency quantities.
- enforce matching, condition and readiness requirements.
- detect and classify reservation conflicts.
- prevent silent double allocation.
- manage waitlists.
- expire and extend provisional holds.
- release full or partial reservation capacity.
- propagate approved requirement changes.
- support Event version review and reservation freeze.
- release authorised demand to picking.
- replace unavailable allocated assets.
- calculate reservation risk and confidence.
- provide capacity forecasts, calendars and heatmaps.
- integrate with Procurement, Commercial Workspace, Warehouse, QR Tracking, Logistics, Execution and Finance.
- preserve a complete reservation and allocation audit trail.

---

## Section 09.05 — Asset Picking, Packing and Staging

### 1. Purpose

Asset Picking, Packing and Staging defines how EventOS converts approved Asset Reservations and Allocations into physically prepared event loads.

The section must control:

- Which assets warehouse teams are authorised to pick.
- From which warehouse locations assets must be collected.
- Which exact serialized assets, batches or quantities are required.
- How picked assets are verified.
- How assets are grouped into kits, containers, pallets and dispatch units.
- How packing completeness is confirmed.
- Where completed loads are staged.
- Which event, vehicle, delivery wave and venue destination each staged load belongs to.
- How shortages, substitutions, damage and picking discrepancies are resolved.
- When warehouse preparation is complete and ready for Logistics.

Picking, Packing and Staging is the controlled transition from reserved inventory to dispatch-ready inventory.

It does not perform transport, venue delivery or event deployment.

---

## 2. Architectural Position

The operational sequence is:

`Confirmed Reservation → Approved Allocation → Picking Release → Picking → Verification → Packing → Staging → Load Readiness → Logistics Dispatch`

This section integrates with:

- Event Design Studio
- Requirement Engine
- Asset Reservation and Allocation
- Warehouse Structure and Location Management
- QR Identification and Tracking
- Maintenance and Readiness
- Logistics
- Event Execution
- Commercial Workspace
- Finance
- Damage and Loss Management

The approved Asset Reservation remains the demand authority.

The Picking Record is the warehouse execution authority.

The Packing Record defines how picked items are physically grouped.

The Staging Record defines where dispatch-ready units are held before loading.

---

## 3. Core Operational Distinctions

EventOS must keep the following concepts separate:

### 3.1 Picking Release

Authorisation for the warehouse to begin fulfilling approved allocations.

### 3.2 Picking

Physical removal of assets or stock from storage.

### 3.3 Pick Verification

Confirmation that the correct assets and quantities were physically collected.

### 3.4 Packing

Placement of picked items into controlled kits, containers, crates, pallets or dispatch units.

### 3.5 Packing Verification

Confirmation that the physical contents match the packing manifest.

### 3.6 Staging

Placement of completed packing units into a defined dispatch preparation area.

### 3.7 Load Readiness

Confirmation that the staged units are complete and eligible to be released to Logistics.

### 3.8 Loading

Physical transfer from staging into a vehicle.

Loading belongs to Logistics and must remain a separate process.

---

## 4. Picking Order

Every authorised warehouse picking activity must be represented by a Picking Order.

Picking Order ID format:

`PCK-##########`

Example:

`PCK-0000026741`

Each Picking Order must contain:

- Picking Order ID
- Controlling business
- Warehouse
- Event
- Event version
- Reservation Group
- Requirement Items
- Picking wave
- Dispatch wave
- Required completion date and time
- Planned dispatch date and time
- Destination
- Staging location
- Picking priority
- Picking strategy
- Picking status
- Responsible warehouse team
- Released by
- Released timestamp
- Created timestamp
- Created by

Where applicable:

- Vehicle plan
- Venue zone
- Setup sequence
- Supplier collection reference
- Warehouse transfer reference
- Special handling requirements
- Packing instructions
- Client-owned asset indicator
- Security level
- Estimated weight
- Estimated volume
- Commercial urgency
- Operational risk

---

## 5. Picking Order Status

Permitted Picking Order statuses are:

- Draft
- Pending Release
- Released
- Assigned
- Picking Started
- Partially Picked
- Fully Picked
- Verification Required
- Verified
- Packing in Progress
- Packed
- Staged
- Load Ready
- At Risk
- Blocked
- Suspended
- Cancelled
- Closed

Picking status must be system-controlled where physical transactions determine progress.

Manual overrides require permission and reason capture.

---

## 6. Picking Release Requirements

A Picking Order may be released only where:

- The related reservations are Confirmed.
- Required allocations are sufficiently complete.
- The correct Event version is active.
- No Blocking reservation conflict exists.
- Source warehouse is defined.
- Required stock is expected to be physically present.
- Required substitutions are approved.
- Critical readiness requirements are complete or scheduled.
- Staging destination is defined.
- Dispatch timing is known.
- Warehouse team responsibility is assigned.
- Required commercial or operational approvals are complete.

Picking Release must not be interpreted as physical fulfilment.

---

## 7. Picking Freeze

Once picking begins, the underlying operational demand enters a controlled state.

Changes affecting the Picking Order must be classified as:

- No Operational Impact
- Pick Quantity Change
- Asset Replacement
- Variant Change
- Warehouse Change
- Staging Change
- Dispatch-Time Change
- Packing Change
- Cancellation
- Emergency Change

Changes must not silently alter an active Picking Order.

Affected warehouse operators must receive the updated version.

---

## 8. Picking Order Version

Every Picking Order must have a version number.

Example:

`PCK-0000026741-V03`

A new version is required where an approved change affects:

- Item quantity
- Allocated asset
- batch
- warehouse source
- destination
- dispatch wave
- staging area
- packing requirement
- substitution policy
- event version

Previous versions must remain available for audit.

Only one version may be operationally active.

---

## 9. Picking Line

Each Picking Order contains one or more Picking Lines.

A Picking Line must contain:

- Picking Line ID
- Requirement Item
- Reservation
- Allocation
- Asset Definition
- Required variant
- Required quantity
- Unit of measure
- Source warehouse
- Preferred source location
- Batch requirement
- Serialized Asset Instances where preallocated
- Minimum condition grade
- Readiness requirement
- Substitution policy
- Picking sequence
- Packing destination
- Venue or deployment zone
- Picked quantity
- Verified quantity
- Outstanding quantity
- Line status

Picking Line ID format:

`PCL-############`

---

## 10. Picking Line Status

Permitted Picking Line statuses are:

- Pending
- Ready
- Assigned
- In Progress
- Partially Picked
- Fully Picked
- Verification Required
- Verified
- Short
- Substitute Proposed
- Blocked
- Cancelled
- Closed

A Picking Order may be Fully Picked while one or more lines still require verification.

It may not become Verified until all mandatory line checks are complete.

---

## 11. Picking Strategies

EventOS shall support the following picking strategies:

### 11.1 Discrete Event Picking

One Picking Order is completed independently for one event or dispatch wave.

### 11.2 Batch Picking

Items for multiple orders are collected together and separated later.

### 11.3 Zone Picking

Warehouse operators pick only from assigned zones.

### 11.4 Wave Picking

Multiple orders are released according to shared dispatch timing.

### 11.5 Cluster Picking

An operator picks for multiple containers, events or zones during one route.

### 11.6 Serialized Directed Picking

The system directs the operator to exact Asset Instances.

### 11.7 Quantity Directed Picking

The system directs the operator to a quantity and source location.

### 11.8 Kit-Based Picking

The operator retrieves a preassembled kit rather than individual components.

Picking strategy may vary by asset category within one Picking Order.

---

## 12. Picking Sequence Optimisation

EventOS may propose a picking sequence based on:

- Warehouse layout
- Location path
- asset weight
- asset size
- fragility
- temperature requirement
- security level
- packing order
- vehicle loading order
- venue deployment sequence
- team assignment
- equipment availability
- source-location congestion
- readiness status

The proposed sequence is operational guidance.

It must not change allocation, quantities or Event Design requirements.

---

## 13. Picking Assignment

Picking work may be assigned to:

- Individual warehouse operator
- Warehouse team
- Zone team
- Asset-category specialist
- Technical preparation team
- External warehouse operator
- Supplier collection team

Each assignment must contain:

- Assigned party
- Assigned timestamp
- Due time
- Warehouse or zone scope
- Picking Lines
- Equipment required
- Special instructions
- Supervisor
- Assignment status

---

## 14. Picking Task

Picking Orders may be decomposed into operational Picking Tasks.

Examples:

- Pick furniture from Zone F2.
- Pick serialized lighting fixtures.
- Collect linen batch LIN-042.
- Retrieve Mobile Bar Kit MBK-006.
- Transfer selected items to cleaning.
- Verify client-owned décor.

Picking Task ID format:

`PTK-############`

Each task must reference its parent Picking Order and lines.

---

## 15. Source Location

Every picked asset must have a recorded source location.

For serialized assets, the recorded source must match the current structured location before movement.

For quantity-tracked assets, the picked quantity must reduce the stock balance at the source location.

Where the asset is not found at the expected location, EventOS must not silently assume it was picked.

The discrepancy must be recorded.

---

## 16. Directed Picking

Directed Picking must instruct the operator:

- What to pick
- How many to pick
- Which exact asset where required
- Source location
- Picking order
- Destination container or staging point
- Required scan actions
- Condition requirements
- Handling instructions

The operator must be able to report:

- Asset not found
- insufficient quantity
- wrong asset present
- damaged asset
- unreadable QR
- location mismatch
- inaccessible location
- unsafe retrieval
- substitution candidate

---

## 17. Serialized Asset Picking

For serialized assets, each physical Asset Instance must be individually confirmed.

The system must validate:

- Correct Asset Instance
- Active QR identity
- correct allocation
- correct event
- correct warehouse
- current location
- condition
- readiness
- reservation window
- maintenance state
- ownership restriction
- certification
- kit membership

A nonallocated serialized asset may not be substituted silently.

---

## 18. Quantity-Tracked Picking

For quantity-tracked assets, the operator must confirm:

- Asset Definition
- quantity
- unit of measure
- source location
- batch where required
- container where applicable
- condition
- count method

Count methods may include:

- Manual count
- Standard pack quantity
- Container quantity
- Weight-derived quantity
- Length measurement
- Volume measurement
- System-connected scale
- Full-location depletion

---

## 19. Batch-Controlled Picking

Where a batch rule applies, picking must validate:

- Required batch
- permitted batch range
- batch condition
- batch certification
- available quantity
- same-batch requirement
- expiry or production date
- visual consistency

The system must flag mixed-batch fulfilment where matching is required or preferred.

---

## 20. Kit Picking

Where a complete kit is allocated, the operator may pick the Kit QR.

The system must verify:

- Correct kit
- kit status
- expected components
- latest verification
- missing components
- active seal where applicable
- current location
- event allocation
- readiness
- required consumables

A kit scan may pick its verified contents as a group.

An incomplete or discrepant kit may not be treated as complete.

---

## 21. Container Picking

A preloaded container may be picked as a controlled unit where its contents are locked and verified.

The picking transaction must record:

- Container
- contained assets
- contained quantities
- verification timestamp
- seal status
- gross weight where known
- source location
- destination
- event allocation

If the container contents are not locked, each relevant asset or quantity must be confirmed separately.

---

## 22. Asset Condition at Pick

Condition must be checked during picking where:

- The latest condition record is outdated.
- The asset is high value.
- The asset is client-facing.
- The asset has a history of damage.
- The event requires premium condition.
- The asset has recently returned.
- The asset has recently undergone repair.
- The operator observes a defect.

Condition results may include:

- Accepted
- Accepted with Note
- Cleaning Required
- Preparation Required
- Repair Required
- Quarantine Required
- Rejected
- Supervisor Review Required

---

## 23. Readiness Verification

Before an asset is accepted as picked, EventOS may require verification of:

- Cleaning
- charging
- electrical test
- functional test
- programming
- calibration
- assembly
- branding
- covering
- polishing
- certification
- consumables
- accessories
- firmware
- safety check

Readiness requirements must be category-specific.

An asset may be physically picked but remain not ready for packing.

---

## 24. Picking Exceptions

Supported picking exceptions include:

- Asset Not Found
- Quantity Shortage
- Wrong Asset at Location
- Damaged Asset
- Incorrect Condition
- Readiness Failure
- QR Failure
- Location Mismatch
- Batch Mismatch
- Allocation Conflict
- Reservation Conflict
- Ownership Restriction
- Certification Failure
- Kit Incomplete
- Container Discrepancy
- Access Blocked
- Safety Hazard
- System Data Mismatch

Every exception must have:

- Exception ID
- Picking Order
- Picking Line
- Asset or quantity
- Source location
- Reported by
- Timestamp
- Evidence
- Severity
- Assigned resolver
- Resolution status

---

## 25. Picking Exception Severity

Severity levels:

- Information
- Warning
- At Risk
- Critical
- Blocking

A Blocking exception prevents the affected item from progressing to verified packing.

A Picking Order may continue with unaffected lines unless the exception affects overall event viability.

---

## 26. Short Pick

A Short Pick occurs where the full required quantity cannot be collected.

The system must record:

- Required quantity
- picked quantity
- short quantity
- reason
- affected Requirement Item
- reservation impact
- staging impact
- event risk
- proposed resolution
- decision deadline

The system must not mark the line complete without an approved shortage resolution.

---

## 27. Substitute During Picking

Where an allocated asset is unavailable, a substitute may be proposed.

The proposal must validate:

- Substitution policy
- capability
- variant
- condition
- availability
- matching requirements
- Event Design impact
- commercial impact
- logistics impact
- approval requirements

The substitute may be physically held pending approval.

It may not be treated as final fulfilment until required approvals are complete.

---

## 28. Picking Completion

A Picking Line becomes Fully Picked when the required physical quantity has been collected.

A Picking Order becomes Fully Picked when all active Picking Lines are fully collected or formally resolved.

Fully Picked does not mean:

- Condition verified
- packing complete
- staging complete
- load ready
- dispatch complete

These statuses must remain separate.

---

## 29. Pick Verification

Pick Verification confirms that the collected items match the authorised Picking Order.

Verification may be performed through:

- QR rescan
- second operator
- supervisor count
- weight check
- container count
- photograph
- serial-number comparison
- batch verification
- automated system check

Verification rules may depend on:

- Asset value
- ownership
- quantity
- category
- event importance
- client sensitivity
- warehouse accuracy
- risk level

---

## 30. Single and Dual Verification

### 30.1 Single Verification

One authorised operator performs and confirms the pick.

Used for low-risk assets and routine stock.

### 30.2 Dual Verification

A second authorised person verifies the picked item or quantity.

Used for:

- High-value assets
- client-owned assets
- safety equipment
- regulated equipment
- high-quantity event-critical stock
- sealed kits
- sensitive supplier hires
- controlled inventory

The original picker and verifier must be separately recorded.

---

## 31. Verification Outcome

Permitted verification outcomes:

- Verified Complete
- Verified with Approved Exception
- Quantity Mismatch
- Asset Mismatch
- Batch Mismatch
- Condition Mismatch
- Missing Component
- Unexpected Asset
- Recount Required
- Supervisor Review Required
- Rejected

A failed verification must reopen the affected Picking Line or create a controlled correction.

---

## 32. Picking Reversal

A picking transaction may be reversed where:

- Wrong asset was picked.
- Wrong quantity was entered.
- Asset is no longer required.
- Event changed.
- Asset failed verification.
- Asset must return to storage.
- Duplicate scan occurred.

The reversal must restore the correct stock or location state.

The original transaction must remain in audit history.

---

## 33. Packing Order

Packing may be controlled through a Packing Order.

Packing Order ID format:

`PAK-##########`

Example:

`PAK-0000019482`

Each Packing Order must contain:

- Packing Order ID
- Parent Picking Order
- Event
- Event version
- Warehouse
- Dispatch wave
- Destination
- Packing strategy
- Packing status
- Responsible team
- Required completion time
- Staging destination
- Created by
- Created timestamp

Where applicable:

- Vehicle or route
- Venue zone
- setup sequence
- special handling
- packing material requirements
- labelling requirements
- security requirements
- weight restrictions
- client instructions

---

## 34. Packing Order Status

Permitted statuses:

- Draft
- Ready
- Assigned
- Packing Started
- Partially Packed
- Fully Packed
- Verification Required
- Verified
- Sealed
- Staged
- At Risk
- Blocked
- Cancelled
- Closed

---

## 35. Packing Unit

A Packing Unit is a physical grouping prepared for dispatch.

Supported Packing Unit types include:

- Kit
- Flight Case
- Crate
- Box
- Pallet
- Stillage
- Rack
- Cage
- Trolley
- Bag
- Wrapped Bundle
- Loose Load Unit
- Custom Container

Packing Unit ID format:

`PKU-##########`

A Packing Unit may be reusable or single-use.

---

## 36. Packing Unit Record

Every Packing Unit must contain:

- Packing Unit ID
- Unit type
- Physical container reference where reusable
- Event
- Dispatch wave
- Destination
- Venue zone
- Current status
- contents manifest
- expected quantity
- confirmed quantity
- tare weight where known
- gross weight where known
- dimensions
- handling class
- stackability
- orientation restrictions
- seal requirement
- label requirement
- current location
- packed by
- packed timestamp
- verified by
- verified timestamp

---

## 37. Packing Strategies

EventOS shall support packing by:

- Asset category
- Venue zone
- setup sequence
- dispatch wave
- vehicle
- delivery stop
- client area
- event function
- handling requirement
- fragility
- weight
- security
- temperature requirement
- kit definition
- supplier ownership
- return route

Packing strategy must align with Logistics and Event Execution requirements.

---

## 38. Packing Manifest

Every Packing Unit must have a manifest.

The manifest must contain:

- Packing Unit
- serialized assets
- quantities
- batches
- kits
- nested containers
- consumables
- accessories
- expected return status
- destination
- deployment zone
- unpacking sequence
- handling instructions
- discrepancies
- verification status

The manifest must reflect actual packed contents.

Planned and actual contents must remain distinguishable.

---

## 39. Packing Sequence

Packing order should consider:

- Unloading sequence
- event setup sequence
- asset fragility
- weight distribution
- container capacity
- weather protection
- contamination risk
- asset compatibility
- route stops
- security
- accessibility
- return segregation

Heavy assets should not be packed in a manner that creates unsafe manual handling or damages lighter items.

---

## 40. Packing Compatibility

EventOS must validate packing compatibility based on:

- Weight
- dimensions
- fragility
- material
- moisture sensitivity
- electrical equipment
- food-contact equipment
- chemicals
- linen cleanliness
- sharp edges
- stacking limits
- orientation
- temperature
- ownership segregation
- security level

Incompatible assets may not be packed together without an approved method or protective separation.

---

## 41. Capacity Validation

A Packing Unit may define:

- Maximum weight
- maximum volume
- maximum quantity
- maximum stack height
- maximum item dimensions
- centre-of-gravity restrictions
- compartment limits
- asset-category limits

EventOS must warn or block packing that exceeds defined safety limits.

Overrides require authority, reason and audit.

---

## 42. Packaging Materials

The system may track required packaging materials such as:

- Protective blankets
- bubble wrap
- foam
- edge protectors
- straps
- shrink wrap
- labels
- cable ties
- anti-static bags
- moisture barriers
- garment bags
- linen bags
- seals
- pallets
- disposable boxes

Packaging materials may be:

- Consumable stock
- reusable assets
- supplier-provided
- client-specific
- event-chargeable

Use of packaging materials must remain visible where it affects inventory or cost.

---

## 43. Asset Protection Instructions

Asset Definitions may contain default protection rules.

Examples:

- Transport upright only.
- Fit lens covers before packing.
- Wrap polished surfaces.
- Do not stack more than four units.
- Keep dry.
- Separate clean and returned linen.
- Remove batteries before transport.
- Secure moving components.
- Use designated foam insert.
- Apply corner protectors.

The packing workflow must display relevant instructions.

---

## 44. Venue-Zone Packing

Where operationally useful, Packing Units may be assigned to venue deployment zones.

Examples:

- Ceremony
- Main Stage
- VIP Lounge
- Table Area A
- Bar 1
- Kitchen
- Registration
- Back-of-House
- Power Distribution

Zone-based packing must preserve Requirement Item and Event Design links.

This allows execution teams to unload and deploy by area.

---

## 45. Setup-Sequence Packing

Assets may be packed according to planned setup order.

Example sequence:

1. Flooring
2. Structures
3. Electrical distribution
4. Lighting
5. Furniture
6. Linen
7. Décor
8. Tableware
9. Final styling

EventOS must allow Logistics to plan vehicle loading in reverse order where required for efficient unloading.

---

## 46. Packing Labels

Each Packing Unit must have a visible operational label where practical.

The label should contain:

- Packing Unit QR
- Packing Unit code
- Event
- Dispatch wave
- Destination
- Venue zone
- Sequence number
- handling instructions
- weight where required
- seal number where applicable
- return instruction where applicable

Commercial pricing must not appear on warehouse packing labels.

---

## 47. Packing Unit QR

The Packing Unit QR must resolve to:

- Unit identity
- actual manifest
- event
- destination
- current location
- status
- handling instructions
- seal status
- next required action

Scanning a Packing Unit may process its verified contents as a controlled group.

---

## 48. Nested Packing

Packing Units may contain:

- Assets
- quantities
- kits
- smaller containers
- sub-pallets

The system must resolve:

- Immediate contents
- nested contents
- full manifest
- total weight
- total quantity
- destination
- custody
- verification status

Nested packing must not obscure serialized asset identity.

---

## 49. Packing Verification

Packing Verification confirms:

- Correct Packing Unit
- correct event
- correct destination
- correct actual contents
- correct quantities
- correct variants
- correct batch
- required accessories included
- packing instructions followed
- container capacity respected
- labelling complete
- seal applied where required

Verification may require reopening or rescanning the unit.

---

## 50. Packing Verification Levels

Verification levels may include:

### Level 1 — System Validation

Automated comparison between picked and packed quantities.

### Level 2 — Operator Verification

Packing operator confirms manifest.

### Level 3 — Independent Verification

Second operator or supervisor confirms contents.

### Level 4 — Controlled Seal Verification

Contents are verified and the unit is sealed with recorded seal evidence.

High-risk asset classes may require multiple levels.

---

## 51. Packing Discrepancy

A packing discrepancy occurs when:

- Picked item is not packed.
- Packed item was not picked.
- Quantity differs.
- Wrong container is used.
- Wrong event or zone is selected.
- Asset is packed in multiple units.
- Required accessory is missing.
- Weight exceeds capacity.
- Seal information is incorrect.
- Condition deteriorated during packing.

Discrepancies must be resolved before the Packing Unit becomes Verified.

---

## 52. Packing Completion

A Packing Order becomes Fully Packed when:

- All required items have been assigned to Packing Units.
- No picked items remain unaccounted for.
- No unauthorised items are present.
- All required packing labels exist.
- Capacity rules are satisfied.
- Required packaging materials are applied.
- Outstanding shortages are formally accepted or resolved.

Fully Packed does not mean Verified or Staged.

---

## 53. Container Sealing

A Packing Unit may require a physical seal.

Seal Record must contain:

- Seal Record ID
- Packing Unit
- seal number
- seal type
- applied by
- applied timestamp
- verified contents
- seal photograph where required
- expected destination
- opening authority
- seal status

Seal statuses:

- Not Required
- Pending
- Applied
- Verified
- Broken
- Replaced
- Compromised
- Closed

---

## 54. Seal Replacement

A seal may be replaced only through a controlled process.

The record must capture:

- Original seal
- replacement seal
- reason
- opened by
- contents reverification
- discrepancies
- replacement timestamp
- supervisor approval where required

A replacement seal must not erase the original seal history.

---

## 55. Staging Allocation

Every completed Packing Unit must be assigned to a Staging Allocation before loading.

Staging Allocation ID format:

`STG-##########`

Example:

`STG-0000011078`

Each Staging Allocation must contain:

- Staging Allocation ID
- Event
- Event version
- warehouse
- staging location
- dispatch wave
- destination
- planned vehicle or route
- required dispatch time
- required staging completion time
- Packing Units
- loose assets where permitted
- responsible team
- staging status
- created by
- created timestamp

---

## 56. Staging Status

Permitted statuses:

- Planned
- Open
- Receiving Packed Units
- Partially Complete
- Complete
- Verification Required
- Verified
- Load Ready
- Loading
- Dispatched
- Blocked
- Suspended
- Cancelled
- Closed

---

## 57. Staging Location

Staging must occur in a structured Warehouse Location designated for staging.

The staging location may be dedicated by:

- Event
- dispatch wave
- vehicle
- route
- delivery stop
- venue zone
- asset category
- priority

Assets placed in staging remain warehouse-controlled but are not generally available.

---

## 58. Staging Check-In

When a Packing Unit enters staging, EventOS must validate:

- Correct Event
- correct dispatch wave
- correct staging allocation
- Packing Unit status
- manifest verification
- seal status
- dispatch timing
- destination
- current location
- duplicate check-in

The transaction must change the Packing Unit’s current location to the staging location.

---

## 59. Loose Asset Staging

Loose serialized assets may be staged without a Packing Unit only where operationally permitted.

The staging record must still identify:

- Asset
- event
- dispatch wave
- destination
- loading position
- handling instructions
- verification state

Loose quantity-tracked stock should be avoided unless it has a controlled count and handling method.

---

## 60. Staging Layout

EventOS may support digital placement within the staging area.

The layout may represent:

- Lanes
- floor positions
- dispatch bays
- vehicle zones
- event zones
- loading sequences
- high-value holding areas
- fragile-item zones
- temperature-controlled positions

The staging map must use structured Location Records.

---

## 61. Staging Sequence

Staged units may be sequenced according to:

- Vehicle
- loading order
- unloading order
- route stop
- destination zone
- asset weight
- event setup priority
- dispatch time
- security handling
- supplier return separation

Sequence must be visible to Logistics.

---

## 62. Staging Completeness

A Staging Allocation is Complete when all required Packing Units and approved loose assets are physically present in the correct staging location.

Completeness must compare:

- Planned units
- actual units
- expected manifests
- missing units
- additional units
- blocked units
- unresolved shortages
- pending verification

Complete does not mean Load Ready until required validation is finished.

---

## 63. Staging Verification

Staging Verification must confirm:

- All required Packing Units are present.
- All units belong to the correct event and wave.
- All units are Verified or have approved exceptions.
- Seal statuses are valid.
- Loose assets are accounted for.
- No unrelated unit is included.
- Dispatch documentation matches actual staged contents.
- Required vehicle or route constraints are known.
- No Blocking exception remains.

---

## 64. Load Readiness

A Staging Allocation may become Load Ready only where:

- Picking is complete or formally resolved.
- Packing is complete.
- Required packing verification is complete.
- All required units are staged.
- No Blocking discrepancy exists.
- Dispatch timing remains valid.
- Logistics has accepted the load plan.
- Required documentation is available.
- Required custody approvals are complete.
- High-value or client-owned assets have required evidence.
- Vehicle constraints are satisfied or acknowledged.

Load Ready authorises Logistics to begin loading.

It does not confirm that loading has occurred.

---

## 65. Load Readiness Certificate

EventOS may generate a digital Load Readiness Certificate.

It may contain:

- Event
- dispatch wave
- warehouse
- destination
- planned vehicle
- Packing Units
- total estimated weight
- total estimated volume
- item count
- unresolved approved exceptions
- verified by
- readiness timestamp
- release authority

The certificate is operational evidence.

It does not replace the actual Vehicle Load Manifest.

---

## 66. Dispatch Wave

A Dispatch Wave groups one or more Staging Allocations that leave within a defined operational window.

Dispatch Wave ID format:

`DSW-########`

A Dispatch Wave may be based on:

- Event
- vehicle
- route
- warehouse
- delivery time
- venue access slot
- setup sequence
- supplier delivery
- inter-warehouse transfer

---

## 67. Multiple Dispatch Waves

One event may have multiple waves.

Examples:

- Structural equipment
- technical equipment
- furniture
- catering equipment
- styling items
- consumables
- contingency load
- return collection equipment

Every Packing Unit must belong to one active dispatch wave at a time.

---

## 68. Cross-Warehouse Consolidation

Where an event is fulfilled from multiple warehouses, Packing Units may be:

- Dispatched independently
- transferred to a consolidation warehouse
- cross-docked
- merged into one dispatch wave
- delivered directly to venue

Consolidation must preserve:

- Source warehouse
- original Picking Order
- Packing Unit identity
- transfer custody
- event allocation
- final dispatch status

---

## 69. Cross-Docking

Cross-docked items move from receipt or transfer directly into event staging without normal storage.

Cross-docking requires:

- Confirmed incoming reference
- matching reservation
- expected arrival
- staging destination
- inspection requirement
- packing requirement
- transfer verification
- contingency plan

Incoming stock must not be assumed available before physical receipt and required validation.

---

## 70. Supplier-Provided Packed Units

A supplier may provide prepacked assets or containers.

The EventOS intake process must verify:

- Supplier
- order or hire reference
- Packing Unit identity
- expected contents
- actual received contents
- ownership
- event allocation
- condition
- seal
- destination
- return requirements

Supplier packing data may be imported but must not replace physical verification where required.

---

## 71. Client-Owned Asset Preparation

Client-owned assets must be picked, packed and staged under ownership-specific rules.

The workflow may require:

- Intake photographs
- condition evidence
- restricted handling
- dedicated container
- segregation
- dual verification
- client instructions
- insurance reference
- authorised custody handover

Client-owned assets must remain clearly identifiable throughout the process.

---

## 72. High-Value Asset Handling

High-value assets may require:

- Named operator
- secure location
- dual verification
- tamper-evident seal
- limited scan permissions
- condition photographs
- controlled staging area
- custody signatures
- approved transport
- live exception escalation

The security rules must be configurable by value, category, ownership and event.

---

## 73. Safety-Critical Asset Handling

Safety-critical assets require validation of:

- certification
- inspection status
- test date
- configuration
- accessories
- protective packaging
- qualified handling
- deployment instructions

A safety-critical asset that fails validation must be blocked from Load Ready status.

Safety blocks may not be overridden by commercial urgency.

---

## 74. Event Design Protection

Picking and packing must preserve the approved Event Design.

The system must maintain links between:

- Physical asset
- Requirement Item
- Design element
- approved variant
- quantity
- deployment zone
- approved substitution

Warehouse efficiency may not justify an unapproved visual or functional change.

---

## 75. Requirement Fulfilment Progress

EventOS must calculate fulfilment progress per Requirement Item.

Progress states may include:

- Not Released
- Released for Picking
- Partially Picked
- Fully Picked
- Partially Packed
- Fully Packed
- Partially Staged
- Fully Staged
- Load Ready
- Dispatched
- Deployed

The progress calculation must distinguish primary requirement quantity from operational buffer.

---

## 76. Buffer Asset Handling

Operational buffers and contingency assets must remain identifiable.

They may be packed:

- With primary assets
- In separate Packing Units
- In a contingency vehicle
- In a technical spare kit
- In warehouse reserve

The packing method must reflect whether the buffer is intended to travel.

---

## 77. Cancellation During Picking

If an event or requirement is cancelled after picking starts, EventOS must:

1. Suspend affected Picking and Packing Orders.
2. Identify physically picked items.
3. identify packed items.
4. identify staged items.
5. prevent loading.
6. define return-to-storage or reallocation actions.
7. assess commercial impact.
8. preserve work and transaction history.

Cancellation must not automatically return stock to its previous location.

Physical reversal must be confirmed.

---

## 78. Requirement Change During Packing

Where a requirement changes during packing, EventOS must identify:

- Packing Units affected
- assets to remove
- assets to add
- labels requiring replacement
- seals requiring reopening
- weight changes
- staging impact
- logistics impact
- commercial impact
- Event Design approval status

A sealed unit may not be modified without controlled seal replacement.

---

## 79. Dispatch Delay

Where dispatch is delayed, EventOS must assess:

- Staging capacity
- Asset security
- battery charging
- refrigeration
- environmental exposure
- reservation impact on later events
- vehicle rescheduling
- staff availability
- client or venue access
- supplier-return deadlines

Load Ready status may remain valid, become At Risk or require reverification.

---

## 80. Staging Age

EventOS should monitor how long assets remain staged.

Prolonged staging may trigger:

- Condition recheck
- charge-level check
- seal check
- weather exposure check
- reservation conflict review
- operational escalation
- warehouse congestion alert

Maximum staging durations may be configured by category.

---

## 81. Reverse Staging

Where a prepared load is cancelled or changed, Reverse Staging moves units out of the staging area.

Possible destinations include:

- Storage
- alternative event staging
- inspection
- maintenance
- quarantine
- supplier return
- client custody
- rework area

Reverse Staging must be fully auditable.

---

## 82. Repacking

Repacking may occur because of:

- Vehicle change
- route change
- weight issue
- damage
- container failure
- requirement change
- venue-zone change
- security requirement
- packing error
- consolidation

Repacking must preserve:

- Original Packing Unit
- original manifest
- new Packing Unit
- moved contents
- reason
- operators
- verification
- seal history
- location history

---

## 83. Warehouse Equipment Requirements

Picking and packing tasks may require:

- Forklift
- pallet jack
- trolley
- ladder
- lifting equipment
- mobile scanning device
- scale
- wrapping station
- charging station
- test bench
- cleaning station
- sewing or linen station
- secure cage access

Task release may be blocked where required equipment or authorised operators are unavailable.

---

## 84. Labour Planning

Picking, Packing and Staging must support labour estimation based on:

- Item count
- Asset category
- travel distance
- weight
- handling complexity
- verification requirements
- packing complexity
- staging volume
- event priority
- dispatch deadline

Labour planning data may inform Operations and Commercial Workspace.

It must not independently create commercial charges.

---

## 85. Time Tracking

EventOS may record:

- Picking start and end
- packing start and end
- staging start and end
- task pauses
- exception-resolution time
- verification time
- operator time
- team time

Time records may support:

- Productivity analysis
- labour costing
- process improvement
- overtime review
- event profitability

---

## 86. Productivity Metrics

Supported metrics may include:

- Picking Lines per hour
- assets picked per hour
- quantity picked per hour
- first-pass pick accuracy
- packing accuracy
- staging completion accuracy
- exception rate
- short-pick rate
- rework rate
- average order cycle time
- labour per event
- load-readiness punctuality

Metrics must not incentivise bypassing verification or safety controls.

---

## 87. Warehouse Dashboard

The dashboard must show:

- Picking Orders awaiting release
- active Picking Orders
- overdue Picking Orders
- partial picks
- short picks
- blocked lines
- packing backlog
- Packing Units awaiting verification
- staging utilisation
- Staging Allocations incomplete
- Load Ready waves
- dispatch deadlines
- high-risk events
- unresolved discrepancies
- labour demand
- staging congestion

---

## 88. Search and Filtering

Users must be able to search and filter by:

- Picking Order ID
- Packing Order ID
- Packing Unit ID
- Staging Allocation ID
- Event
- Client
- Requirement Item
- Asset Definition
- Asset Instance
- Warehouse
- Zone
- Operator
- team
- dispatch wave
- vehicle
- destination
- venue zone
- status
- exception type
- date range
- priority
- ownership
- seal status
- verification status

---

## 89. Notifications

EventOS must support targeted notifications for:

- Picking Order released
- Picking Order overdue
- asset not found
- short pick
- substitution required
- readiness failure
- blocked Picking Line
- Packing Unit discrepancy
- Packing Unit over capacity
- staging incomplete
- staging congestion
- seal compromised
- Load Ready achieved
- Load Ready revoked
- dispatch deadline approaching
- Event version changed
- requirement changed after picking
- cancellation after preparation began

---

## 90. Logistics Handover

When a Staging Allocation becomes Load Ready, EventOS must provide Logistics with:

- Event
- dispatch wave
- warehouse
- staging location
- destination
- planned vehicle
- Packing Units
- loose assets
- manifests
- estimated weight
- estimated volume
- loading sequence
- unloading sequence
- venue zones
- handling instructions
- seals
- exceptions
- planned dispatch time
- return requirements

Logistics must receive the actual prepared load, not only the original reservation plan.

---

## 91. QR Tracking Integration

QR Tracking must support:

- Picking Order selection
- source-location scan
- asset scan
- quantity confirmation
- container assignment
- packing verification
- seal capture
- staging check-in
- staging verification
- Load Ready confirmation
- reversal and correction

Every physical change must create an auditable scan or controlled manual transaction.

---

## 92. Reservation Integration

Picking must update:

- Picked quantity
- outstanding quantity
- allocation status
- fulfilment risk
- replacement requirement
- reservation progress

Picking must not change the approved reservation quantity without authorised amendment.

---

## 93. Warehouse Integration

Warehouse Management must receive:

- Source-location deductions
- destination-location updates
- container nesting
- staging-location occupancy
- quantity balance changes
- exception records
- reverse movements
- returned-to-storage confirmations

The warehouse location record remains authoritative for current physical placement.

---

## 94. Maintenance Integration

Assets requiring technical or maintenance preparation must be routed through controlled readiness tasks.

Maintenance completion must update:

- Asset readiness
- condition
- certification
- availability
- Picking Line status
- risk

A failed maintenance task must trigger replacement or shortage resolution.

---

## 95. Commercial Workspace Integration

Commercial Workspace must be informed where warehouse preparation creates or identifies:

- Additional labour
- emergency supplier hire
- substitute cost
- repacking cost
- special packaging
- expedited transfer
- damaged hired asset
- client-caused change
- cancellation after preparation
- additional vehicle requirement

Operational records provide evidence.

Commercial changes still require approval.

---

## 96. Finance Integration

Picking, Packing and Staging data may support:

- Inventory movement
- consumable usage
- labour costing
- warehouse utilisation
- packaging cost
- asset utilisation
- internal transfer cost
- damage provision
- event cost allocation

No accounting entry may be created solely because an item was picked unless Finance rules explicitly require it.

---

## 97. AI Assistance

AI may assist by:

- Proposing efficient pick routes
- grouping Picking Orders into waves
- suggesting Packing Unit selection
- predicting container capacity
- identifying missing accessories
- detecting likely quantity errors
- highlighting event-readiness risk
- forecasting staging congestion
- recommending labour allocation
- identifying late completion risk
- comparing planned and actual manifests

AI may not:

- Change approved quantities
- approve substitutions
- ignore safety requirements
- close discrepancies
- confirm Load Readiness
- alter Event Design
- authorise commercial actions

without operator approval.

---

## 98. Roles and Permissions

Minimum permission groups:

- View Picking Orders
- Release Picking Orders
- Assign Picking Work
- Pick Assets
- Confirm Quantities
- Perform Pick Verification
- Override Source Location
- Report Picking Exceptions
- Resolve Short Picks
- Propose Substitutions
- Approve Warehouse Substitutions
- Create Packing Orders
- Create Packing Units
- Pack Assets
- Verify Packing Units
- Apply Seals
- Replace Seals
- Create Staging Allocations
- Stage Packing Units
- Verify Staging
- Confirm Load Readiness
- Revoke Load Readiness
- Reverse Picking
- Reverse Staging
- Repack Assets
- Override Capacity Warning
- View Labour Metrics
- View Commercial Impact
- Manage Picking and Packing Rules

Permissions may be restricted by:

- Business
- warehouse
- zone
- asset category
- event
- ownership
- asset value
- security class
- transaction type
- client

---

## 99. Audit Requirements

EventOS must retain an immutable audit history for:

- Picking Order creation
- version changes
- release
- assignment
- picking transactions
- quantity changes
- source-location changes
- substitutions
- exceptions
- short picks
- pick verification
- picking reversals
- Packing Order creation
- Packing Unit creation
- manifest changes
- packing verification
- capacity overrides
- seal application
- seal replacement
- staging check-in
- staging verification
- Load Readiness
- Load Readiness revocation
- reverse staging
- repacking
- manual corrections
- AI recommendations accepted or rejected

Each audit entry must contain:

- User
- Timestamp
- Device
- Warehouse
- Event
- Event version
- Picking Order
- Picking Line where applicable
- Packing Order
- Packing Unit
- Staging Allocation
- Asset or quantity
- Previous state
- New state
- Reason
- Approval reference
- Related exception or change record

---

## 100. Locked Business Rules

**AM-PPS-001**  
Only Confirmed and operationally valid reservations may be released for picking.

**AM-PPS-002**  
Picking Release authorises warehouse work but does not prove physical fulfilment.

**AM-PPS-003**  
Picking, verification, packing, staging, Load Readiness and loading must remain separate operational states.

**AM-PPS-004**  
Every picked serialized asset must be individually identified or included in a verified controlled container.

**AM-PPS-005**  
Every picked quantity must record the Asset Definition, quantity, unit of measure and source location.

**AM-PPS-006**  
Physical picking must reduce or relocate authoritative warehouse inventory.

**AM-PPS-007**  
An asset not found at its expected location must create a discrepancy and may not be silently treated as picked.

**AM-PPS-008**  
Nonallocated assets may not replace allocated assets without the required substitution process.

**AM-PPS-009**  
Assets failing condition, readiness, certification or safety requirements may not proceed as verified picks.

**AM-PPS-010**  
A Picking Line may not be marked complete while an unresolved short quantity remains.

**AM-PPS-011**  
A Picking Order may not become Verified until all mandatory line-level checks are complete.

**AM-PPS-012**  
Packing manifests must reflect actual packed contents and remain distinguishable from planned contents.

**AM-PPS-013**  
Every serialized asset must remain traceable through nested Packing Units.

**AM-PPS-014**  
A Packing Unit may not be marked Verified while required items are missing or unexpected items remain unresolved.

**AM-PPS-015**  
Packing capacity and compatibility rules may not be bypassed without authorised and audited override.

**AM-PPS-016**  
Safety-critical packing restrictions may not be overridden for commercial or scheduling convenience.

**AM-PPS-017**  
A sealed Packing Unit may not be modified without controlled opening, reverification and seal replacement.

**AM-PPS-018**  
Every staged Packing Unit must reference one structured Staging Allocation and physical staging location.

**AM-PPS-019**  
Assets in staging remain warehouse-controlled inventory but are no longer generally available.

**AM-PPS-020**  
A Staging Allocation may not become Complete while required units are physically absent.

**AM-PPS-021**  
Load Ready status may be granted only after required picking, packing and staging validation is complete.

**AM-PPS-022**  
Load Ready status authorises Logistics to begin loading but does not confirm vehicle loading or dispatch.

**AM-PPS-023**  
The actual prepared load must remain distinguishable from the original planned load.

**AM-PPS-024**  
Warehouse operators may not make unapproved changes to Event Design requirements.

**AM-PPS-025**  
Requirement changes after picking begins must be version controlled and propagated to affected warehouse work.

**AM-PPS-026**  
Cancellation after physical preparation begins requires controlled physical reversal.

**AM-PPS-027**  
Client-owned, high-value and safety-critical assets may require enhanced verification and custody controls.

**AM-PPS-028**  
Every packing, staging, reversal and repacking transaction must remain auditable.

**AM-PPS-029**  
AI may optimise and recommend warehouse preparation activities but may not commit operational, design, safety or commercial decisions without operator approval.

**AM-PPS-030**  
Picking and packing evidence may support commercial and financial processes but may not independently authorise charges or accounting entries.

---

## 101. Completion Criteria

Asset Picking, Packing and Staging is complete when EventOS can:

- Create and version Picking Orders.
- Release authorised reservations for warehouse execution.
- Create Picking Lines and operational tasks.
- Assign work to warehouse teams.
- support discrete, batch, zone, wave, cluster, serialized and kit picking.
- direct operators to correct source locations.
- pick serialized, quantity-tracked, batch-controlled and kit assets.
- validate condition and readiness during picking.
- record and resolve picking exceptions.
- manage short picks and substitutions.
- verify picked assets and quantities.
- reverse incorrect picks.
- create Packing Orders and Packing Units.
- build actual packing manifests.
- enforce packing compatibility and capacity.
- track packaging materials.
- pack by venue zone, setup sequence and dispatch wave.
- verify packed contents.
- apply and replace controlled seals.
- create Staging Allocations.
- move Packing Units into structured staging locations.
- verify staging completeness.
- confirm and revoke Load Readiness.
- support cross-warehouse consolidation and cross-docking.
- manage client-owned, high-value and safety-critical preparation.
- propagate Requirement and Event version changes.
- provide actual prepared-load data to Logistics.
- preserve a complete warehouse preparation audit trail.

---

## Section 09.06 — Asset Logistics and Transport Control

### 1. Purpose

Asset Logistics and Transport Control governs the movement of assets between warehouses, suppliers, venues, clients and service providers.

Its purpose is to ensure that every physical movement is:

- Planned
- Scheduled
- Verified
- Executed
- Tracked
- Audited

while preserving complete chain of custody from dispatch until final return.

Logistics answers:

- What must be transported?
- Where must it go?
- When must it arrive?
- Which vehicle will transport it?
- Which route will it follow?
- Which crew is responsible?
- What has actually been loaded?
- What has arrived?
- What remains outstanding?
- What was returned?
- Where is every asset currently in transit?

Logistics is responsible for movement.

It is not responsible for warehouse storage, event deployment or commercial procurement.

---

# 2. Architectural Position

The logistics lifecycle is:

```
Picking
↓

Packing

↓

Staging

↓

Load Ready

↓

Vehicle Loading

↓

Dispatch

↓

Transport

↓

Arrival

↓

Unloading

↓

Venue Custody

↓

Deployment

↓

Collection

↓

Return Transport

↓

Warehouse Receiving
```

Logistics integrates with:

- Asset Identity
- Warehouse Management
- QR Tracking
- Reservation & Allocation
- Event Execution
- Maintenance
- Commercial Workspace
- Finance
- Fleet Management
- Personnel Scheduling

---

# 3. Logistics Philosophy

A Logistics Plan represents the physical execution plan required to fulfil the Event Design.

The Event Design determines **what** is required.

Logistics determines **how** it reaches the venue safely and on time.

---

# 4. Logistics Job

Every transport activity shall be represented by a Logistics Job.

ID format

```
LOG-##########
```

Example

```
LOG-0000042819
```

Every Logistics Job contains:

- Logistics Job ID
- Event
- Event Version
- Client
- Warehouse
- Destination
- Job Type
- Priority
- Dispatch Wave
- Status
- Planned Start
- Planned Arrival
- Planned Completion
- Logistics Manager
- Responsible Team
- Related Picking Orders
- Related Packing Units
- Related Vehicle Loads

---

# 5. Logistics Job Types

Supported types include:

- Event Delivery
- Event Collection
- Inter-Warehouse Transfer
- Supplier Collection
- Supplier Return
- Client Asset Collection
- Client Asset Return
- Maintenance Delivery
- Maintenance Collection
- Emergency Delivery
- Emergency Recovery
- Vehicle Repositioning
- Container Relocation

Future job types may be added without changing the core architecture.

---

# 6. Logistics Status

Each Logistics Job shall have one current status.

Statuses:

- Draft
- Planning
- Awaiting Assets
- Awaiting Vehicle
- Awaiting Crew
- Ready
- Loading
- Loaded
- Dispatched
- In Transit
- Arrived
- Unloading
- Delivered
- Collection Started
- Returning
- Completed
- Cancelled
- Suspended
- Exception

---

# 7. Logistics Stops

A Logistics Job may contain multiple Stops.

Examples

Warehouse

↓

Supplier

↓

Venue A

↓

Venue B

↓

Return Warehouse

Each Stop includes:

- Stop Number
- Stop Type
- Address
- GPS Coordinates
- Contact Person
- Planned Arrival
- Planned Departure
- Actual Arrival
- Actual Departure
- Service Time
- Access Instructions
- Delivery Requirements
- Collection Requirements

---

# 8. Stop Types

Supported Stop Types:

- Warehouse
- Supplier
- Venue
- Client
- Temporary Storage
- Maintenance Provider
- Fuel Station
- Cross Dock
- Customs
- Rest Stop
- Overnight Storage
- Disposal Site

---

# 9. Route Planning

Every Logistics Job may have one or more Routes.

Route planning considers:

- Distance
- Estimated duration
- Traffic
- Vehicle restrictions
- Height limits
- Weight limits
- Toll roads
- Venue access windows
- Setup schedule
- Multiple deliveries
- Driver hours
- Fuel planning

Route optimisation is advisory.

Operators may override proposed routes.

---

# 10. Dispatch Waves

A Dispatch Wave groups multiple Logistics Jobs.

Example

Wave 1

- Structures

Wave 2

- Furniture

Wave 3

- Styling

Wave 4

- Catering

Dispatch Waves support:

- Labour planning
- Vehicle scheduling
- Loading sequence
- Venue setup sequencing

---

# 11. Vehicle Assignment

Each Logistics Job may assign:

- One Vehicle
- Multiple Vehicles
- Trailer
- Support Vehicle

Assignment records include:

- Vehicle
- Driver
- Assistant Crew
- Dispatch Time
- Expected Return
- Fuel Status
- Vehicle Readiness
- Current Capacity

---

# 12. Vehicle Types

Supported vehicle types include:

- Panel Van
- Box Truck
- Curtain Side
- Flatbed
- Refrigerated Truck
- Low Bed
- Trailer
- Pickup
- Motorcycle Courier
- Forklift
- Crane Truck
- Mobile Workshop

---

# 13. Vehicle Record

Vehicle records contain:

- Vehicle ID
- Registration
- Fleet Number
- Vehicle Type
- Dimensions
- Maximum Weight
- Maximum Volume
- Axle Limits
- Refrigeration Capability
- Lift Gate
- Crane
- Trailer Compatibility
- Fuel Type
- Maintenance Status
- Insurance
- Licence Expiry

Vehicle records belong to Fleet Management but are referenced by Logistics.

---

# 14. Vehicle Capacity

Capacity calculations include:

- Weight
- Volume
- Floor Area
- Length
- Height
- Width
- Loading Zones
- Fragile Areas
- Refrigerated Compartments

The system must prevent unsafe loading.

---

# 15. Vehicle Readiness

Before assignment the vehicle must satisfy:

- Maintenance complete
- Roadworthy
- Insurance valid
- Driver assigned
- Fuel sufficient
- Tyres acceptable
- Documentation available
- Required equipment onboard

---

# 16. Driver Assignment

Every dispatched vehicle requires:

- Driver
- Licence Verification
- Contact Details
- Mobile Device
- Shift
- Working Hours
- Emergency Contact

Drivers may not be assigned beyond configured working-hour rules.

---

# 17. Crew Assignment

Crew may include:

- Driver
- Assistant
- Loader
- Installer
- Electrician
- Rigger
- AV Technician
- Supervisor

Crew assignments remain separate from Event staffing.

---

# 18. Load Plan

Every vehicle has a Load Plan.

Load Plan includes:

- Vehicle
- Dispatch Wave
- Packing Units
- Loose Assets
- Weight
- Volume
- Loading Sequence
- Unloading Sequence
- Destination Zones
- Special Instructions

---

# 19. Vehicle Manifest

The Vehicle Manifest represents actual loaded contents.

It contains:

- Packing Units
- Serialized Assets
- Quantity Items
- Total Weight
- Total Volume
- Seal Numbers
- Driver
- Dispatch Time
- Destination
- QR Manifest

The Manifest reflects actual loaded assets.

Not planned assets.

---

# 20. Loading Verification

Loading requires confirmation that:

- Correct vehicle
- Correct Packing Units
- Correct quantity
- Correct dispatch wave
- Correct destination
- Correct route

Every loaded Packing Unit must be scanned unless an approved grouped-loading process exists.

---

# 21. Partial Loading

A Logistics Job may be partially loaded.

The system records:

- Planned Units
- Loaded Units
- Outstanding Units
- Missing Units
- Approved Exceptions

Dispatch is blocked if mandatory items remain outstanding.

---

# 22. Vehicle Sealing

Vehicles may require seals.

Seal records contain:

- Seal Number
- Vehicle
- Applied By
- Timestamp
- Manifest Version
- Verification
- Opening Record

Breaking a seal creates an audit record.

---

# 23. Dispatch

Dispatch records:

- Dispatch Time
- Driver
- Vehicle
- Manifest
- Responsible Operator
- GPS Start
- Odometer
- Fuel

Dispatch changes custody from Warehouse to Logistics.

---

# 24. Chain of Custody

Every custody transfer must record:

- From
- To
- Time
- User
- Method
- Assets
- Evidence

Custody transfers include:

Warehouse

↓

Driver

↓

Venue Manager

↓

Event Operations

↓

Collection Crew

↓

Warehouse

---

# 25. GPS Tracking

Where supported, vehicles may transmit:

- Position
- Speed
- Heading
- ETA
- Last Contact
- Route Deviation

GPS supplements logistics.

It does not replace custody scans.

---

# 26. ETA Calculation

ETA may consider:

- Traffic
- Distance
- Stops
- Driver Hours
- Weather
- Delays

Updated ETAs should automatically update event dashboards.

---

# 27. Delivery Confirmation

Delivery confirmation records:

- Arrival
- Recipient
- Time
- Signature
- Photos
- GPS
- QR Verification
- Exceptions

Delivery does not imply deployment.

---

# 28. Venue Unloading

Unloading verifies:

- All expected units arrived
- Missing units
- Damaged units
- Unexpected units
- Seal condition

Unloaded assets move into Event Custody.

---

# 29. Delivery Exceptions

Exceptions include:

- Vehicle Breakdown
- Traffic Delay
- Access Denied
- Venue Closed
- Weather Delay
- Missing Assets
- Damaged Assets
- Wrong Vehicle
- Wrong Venue
- Security Incident

Each exception requires:

- Severity
- Owner
- Resolution Plan

---

# 30. Multi-Venue Deliveries

One Logistics Job may service multiple venues.

Each venue maintains independent:

- Arrival
- Delivery
- Custody
- Exceptions

---

# 31. Emergency Logistics

Emergency Jobs may bypass normal optimisation.

Still required:

- Audit
- Approval
- Manifest
- Custody

---

# 32. Collection Jobs

Collection Jobs reverse delivery.

Workflow:

Venue

↓

Collect

↓

Verify

↓

Load

↓

Return

↓

Warehouse

↓

Inspection

↓

Storage

---

# 33. Return Verification

Returns compare:

- Delivered
- Collected
- Missing
- Damaged
- Client Retained
- Supplier Returned

---

# 34. Supplier Logistics

Supplier deliveries require:

- Supplier Reference
- Collection Window
- Delivery Window
- Contact
- Verification
- Ownership

Supplier assets remain supplier-owned.

---

# 35. Client-Owned Logistics

Client assets require:

- Intake Evidence
- Custody Record
- Separate Identification
- Return Confirmation

---

# 36. Cross-Docking

Cross-docking allows:

Incoming Vehicle

↓

Unload

↓

Immediate Reload

↓

Dispatch

No warehouse storage is required.

---

# 37. Logistics Readiness

A Logistics Job becomes Ready when:

- Assets staged
- Vehicle assigned
- Crew assigned
- Manifest verified
- Route planned
- Required approvals complete

---

# 38. Delay Management

Delays may be classified:

- Minor
- Significant
- Critical

The system recalculates:

- ETA
- Setup Risk
- Event Impact
- Downstream Deliveries

---

# 39. Logistics Risk

Risk levels:

- Low
- Moderate
- High
- Critical

Factors:

- Distance
- Weather
- Traffic
- Vehicle Reliability
- Time Buffer
- Asset Value
- Crew Experience

---

# 40. Communication

Notifications include:

- Vehicle Dispatched
- ETA Changed
- Delay
- Arrival
- Delivery Complete
- Missing Assets
- Damage
- Vehicle Breakdown
- Return Started
- Return Complete

---

# 41. Fleet Integration

Fleet systems may provide:

- GPS
- Fuel
- Diagnostics
- Odometer
- Maintenance
- Driver Logs

Fleet remains an external subsystem.

---

# 42. QR Integration

QR scanning supports:

- Vehicle Loading
- Vehicle Unloading
- Delivery
- Collection
- Manifest Verification
- Custody Transfer

---

# 43. Reservation Integration

Logistics consumes:

- Confirmed Reservations
- Approved Allocations
- Dispatch Waves

Logistics does not change reservation quantities.

---

# 44. Event Execution Integration

Event Execution receives:

- Delivery Status
- ETA
- Delivered Assets
- Outstanding Assets

---

# 45. Commercial Workspace Integration

Logistics events may trigger:

- Extra Delivery Charges
- Additional Labour
- Waiting Charges
- Emergency Transport

Commercial approval remains mandatory.

---

# 46. Finance Integration

Logistics records support:

- Fleet Cost Allocation
- Labour Cost
- Fuel Cost
- Toll Cost
- Delivery Cost
- Internal Chargebacks

They do not directly create accounting entries.

---

# 47. AI Assistance

AI may:

- Optimise routes
- Predict delays
- Suggest vehicle assignment
- Recommend dispatch waves
- Forecast congestion
- Suggest consolidation
- Predict return times

AI may not:

- Dispatch vehicles
- Change manifests
- Approve substitutions
- Commit commercial transport costs

without operator approval.

---

# 48. Roles and Permissions

Minimum roles:

- View Logistics
- Create Logistics Jobs
- Edit Routes
- Assign Vehicles
- Assign Drivers
- Dispatch Vehicle
- Confirm Delivery
- Confirm Collection
- Manage Exceptions
- View GPS
- Override Route
- Close Logistics Job

---

# 49. Audit Requirements

Audit records include:

- Logistics Job creation
- Vehicle assignment
- Crew assignment
- Manifest changes
- Dispatch
- GPS exceptions
- Delivery
- Collection
- Custody transfers
- Delay events
- Route changes
- Vehicle changes
- Manual overrides

Every audit contains:

- User
- Timestamp
- Previous State
- New State
- Reason
- Related Job

---

# 50. Locked Business Rules

**AM-LG-001**  
Every physical transport activity must be represented by a Logistics Job.

**AM-LG-002**  
The Vehicle Manifest must represent the actual loaded contents, not merely the planned load.

**AM-LG-003**  
Vehicle dispatch transfers custody from Warehouse Operations to the assigned Logistics team.

**AM-LG-004**  
Every custody transfer must be explicitly recorded and auditable.

**AM-LG-005**  
Delivery confirms arrival at destination but does not confirm Event Deployment.

**AM-LG-006**  
Return logistics must reconcile delivered, collected, missing and damaged assets.

**AM-LG-007**  
Supplier-owned assets remain supplier-owned throughout transport.

**AM-LG-008**  
Client-owned assets require independent custody tracking throughout transport.

**AM-LG-009**  
Loading and unloading must validate actual assets through QR or approved verification methods.

**AM-LG-010**  
Partial loading and partial delivery must remain visible and may not be represented as complete fulfilment.

**AM-LG-011**  
Vehicle capacity limits may not be exceeded without an authorised and audited exception.

**AM-LG-012**  
A Logistics Job may not reach Ready status until assets, vehicle, crew and required documentation are prepared.

**AM-LG-013**  
Logistics may optimise transport but may not alter approved Event Design, Requirement Items or Reservation quantities.

**AM-LG-014**  
GPS tracking is supplementary evidence and does not replace structured custody or QR-based verification.

**AM-LG-015**  
Every Logistics exception must be classified, assigned and tracked to resolution.

**AM-LG-016**  
AI may recommend logistics improvements but may not dispatch vehicles, alter manifests or commit commercial transport actions without operator approval.

---

# 51. Completion Criteria

Asset Logistics and Transport Control is complete when EventOS can:

- Create Logistics Jobs.
- Plan routes and multiple stops.
- Assign vehicles, drivers and crews.
- Build actual vehicle manifests.
- Verify loading and unloading.
- Manage dispatch waves.
- Track chain of custody.
- Support GPS and ETA updates.
- Process deliveries and collections.
- Handle supplier and client-owned logistics.
- Support cross-docking.
- Manage logistics exceptions and delays.
- Integrate with QR Tracking, Warehouse, Reservation, Event Execution, Commercial Workspace and Finance.
- Preserve a complete logistics audit trail.

---

## Section 09.07 — Event Deployment, Setup and Asset Utilisation

---

# 1. Purpose

Event Deployment, Setup and Asset Utilisation governs the controlled transition of assets from transport into operational use at an event.

This section ensures that EventOS can answer:

- Has every required asset arrived?
- Where exactly is every asset deployed?
- Which Requirement Item does it fulfil?
- Which Event Design element does it support?
- Who currently has custody of the asset?
- Has setup been completed correctly?
- Is the asset operational?
- Has the client accepted the installation where required?
- Is the asset still at the correct location?
- What assets remain unused?
- What assets were substituted?
- What assets must be collected during breakdown?

This module provides the digital representation of the actual physical event.

It is the point where the approved Event Design becomes a deployed reality.

---

# 2. Architectural Position

Deployment occurs after logistics and before event operation.

The lifecycle is:

```
Warehouse

↓

Transport

↓

Venue Arrival

↓

Deployment

↓

Setup

↓

Operational Use

↓

Breakdown

↓

Collection

↓

Return Logistics
```

This section integrates with:

- Event Design Studio
- Requirement Engine
- Asset Reservation
- Warehouse
- QR Tracking
- Logistics
- Maintenance
- Commercial Workspace
- Finance
- Damage & Loss Management

---

# 3. Deployment Philosophy

The Event Design remains the authoritative description of the intended event.

Deployment records how the approved design was physically implemented.

Therefore EventOS maintains three separate concepts:

- Planned Design
- Planned Deployment
- Actual Deployment

The actual deployment must never overwrite the approved design.

Differences become deployment variances.

---

# 4. Deployment Record

Every deployment activity belongs to a Deployment Record.

ID Format

```
DEP-##########
```

Example

```
DEP-0000037428
```

Each Deployment Record contains:

- Deployment ID
- Event
- Event Version
- Venue
- Deployment Zone
- Requirement Item
- Design Element
- Asset Definition
- Asset Instance(s)
- Quantity
- Deployment Status
- Responsible Team
- Planned Setup Time
- Actual Setup Time
- Completion Time
- Verified By
- Created Timestamp

---

# 5. Deployment Status

Each Deployment Record has one status.

Supported statuses:

- Planned
- Awaiting Assets
- Assets Arrived
- Setup Started
- Partially Installed
- Installed
- Verification Required
- Verified
- Operational
- At Risk
- Damaged
- Removed
- Breakdown Started
- Collected
- Closed

---

# 6. Deployment Zones

Every asset deployed at a venue shall belong to one Deployment Zone.

Examples:

- Main Entrance
- Registration
- Ceremony
- Dining Hall
- Stage
- VIP Lounge
- Dance Floor
- Kitchen
- Bar
- Green Room
- Loading Bay
- Operations Room
- Outdoor Garden
- Generator Area

Deployment Zones are operational.

They are independent of warehouse locations.

---

# 7. Venue Map

A venue may contain a structured deployment map.

Hierarchy:

```
Venue

↓

Area

↓

Zone

↓

Sub Zone

↓

Position
```

Example

```
Dining Hall

↓

Table Block B

↓

Table 18

↓

Chair Position 4
```

The deployment map allows assets to be located precisely.

---

# 8. Deployment Positions

Positions represent exact physical placement.

Examples:

- Stage Left
- Stage Right
- Centre Stage
- Table 12
- Bar Counter Rear
- Ceiling Point C14
- Wall Position W03

Positions enable:

- Precise setup
- Breakdown
- Maintenance
- Client approval

---

# 9. Deployment Sequence

Setup may require sequencing.

Example:

1. Flooring
2. Structures
3. Electrical
4. Rigging
5. Lighting
6. Audio
7. Furniture
8. Linen
9. Decor
10. Styling

The sequence may be generated from Requirement Dependencies.

Completion of one stage may unlock the next.

---

# 10. Deployment Tasks

Deployment work is divided into Deployment Tasks.

Each task contains:

- Task ID
- Zone
- Requirement Item
- Assigned Crew
- Required Assets
- Dependencies
- Estimated Duration
- Priority
- Status

Tasks are linked to project execution.

---

# 11. Crew Assignment

Deployment Tasks may be assigned to:

- Setup Crew
- Electricians
- AV Technicians
- Decor Team
- Floral Team
- Rigging Team
- Furniture Team
- Catering Team
- Supervisor

Assignments remain independent from warehouse assignments.

---

# 12. Asset Check-In

Assets arriving at the venue must be checked in.

Check-in records:

- Arrival Time
- Vehicle
- Driver
- QR Scan
- Deployment Zone
- Condition
- Exceptions

Arrival does not imply installation.

---

# 13. Deployment Confirmation

Deployment requires confirmation that:

- Correct asset
- Correct quantity
- Correct zone
- Correct Requirement Item
- Correct Design Element

Every serialized asset should be QR verified where practical.

---

# 14. Requirement Fulfilment

Each deployed asset must reference:

- Requirement Item
- Design Element

Example

Requirement

```
120 Guest Chairs
```

Deployment

```
120 White Tiffany Chairs

Dining Hall

Installed
```

This provides end-to-end traceability.

---

# 15. Design Element Mapping

Assets may support one Design Element.

Examples:

- Ceremony Arch
- Dining Layout
- Main Stage
- Cocktail Area
- Floral Installation

Multiple assets may support one Design Element.

---

# 16. Utilisation

Asset Utilisation begins when an asset becomes operational.

Utilisation answers:

- Is the asset in active use?
- How long was it used?
- Which event used it?

Utilisation is distinct from deployment.

---

# 17. Utilisation States

Supported states:

- Reserved
- Deployed
- Active
- Standby
- Idle
- Backup
- Temporary Removal
- Failed
- Completed

---

# 18. Operational Readiness

Before becoming Operational an asset may require:

- Functional Test
- Electrical Test
- Audio Test
- Lighting Focus
- Network Test
- Calibration
- Cleaning
- Client Inspection

---

# 19. Operational Verification

Verification records:

- Verified By
- Timestamp
- Checklist
- Photos
- Notes
- Exceptions

---

# 20. Deployment Checklists

Asset categories may define checklists.

Examples

Lighting

- Powered
- Addressed
- Focused
- Tested

Furniture

- Clean
- Stable
- Correct Position

Audio

- Powered
- Signal
- Gain
- Backup Tested

---

# 21. Client Acceptance

Some deployments require client acceptance.

Acceptance records:

- Client Representative
- Time
- Comments
- Photos
- Signature

Acceptance does not release EventOS from later operational responsibilities.

---

# 22. Deployment Variance

Variance exists when actual deployment differs from design.

Examples:

- Wrong asset
- Wrong quantity
- Wrong location
- Substitute used
- Missing asset

Variances remain linked to:

- Requirement Item
- Design Element
- Change Request

---

# 23. Approved Substitutions

Approved substitutions record:

- Original Asset
- Replacement Asset
- Approval
- Reason
- Design Impact
- Commercial Impact

Substitutions never overwrite the original Requirement.

---

# 24. Temporary Relocation

Assets may move during an event.

Example

Speaker

Stage Left

↓

VIP Lounge

Temporary relocation records:

- Start Time
- End Time
- Reason
- Responsible User

---

# 25. Event Custody

Custody may transfer:

- Logistics
- Setup Crew
- Event Operations
- Technical Lead
- Client Representative
- Breakdown Crew

Every custody transfer is auditable.

---

# 26. Operational Issues

Operational Issues include:

- Failure
- Damage
- Missing Accessories
- Incorrect Position
- Power Loss
- Network Failure
- Water Damage

Issues are linked to deployed assets.

---

# 27. Incident Recording

Every deployment incident records:

- Time
- User
- Asset
- Zone
- Description
- Photos
- Severity
- Resolution

---

# 28. Emergency Asset Replacement

Replacement workflow:

Failed Asset

↓

Replacement Requested

↓

Replacement Approved

↓

Replacement Delivered

↓

Installed

↓

Verified

History remains preserved.

---

# 29. Live Asset Tracking

During the event EventOS may display:

- Current Position
- Current Custodian
- Operational Status
- Utilisation State

---

# 30. High-Value Assets

High-value assets may require:

- Additional scans
- Custody signatures
- GPS evidence
- Security verification

---

# 31. Client-Owned Assets

Client-owned assets require:

- Separate custody
- Separate utilisation
- Separate return tracking

---

# 32. Supplier-Owned Assets

Supplier-owned assets require:

- Supplier custody
- Separate deployment
- Supplier return workflow

---

# 33. Maintenance During Event

Some assets may require:

- Battery Replacement
- Lamp Replacement
- Fuel
- Cleaning
- Consumables

Maintenance events remain linked to utilisation.

---

# 34. Breakdown Planning

Breakdown begins after event completion.

Planning includes:

- Collection Order
- Reverse Setup Sequence
- Crew
- Vehicles
- Return Warehouse

---

# 35. Reverse Sequence

Typical reverse order:

1. Styling
2. Decor
3. Linen
4. Furniture
5. Lighting
6. Audio
7. Structures

---

# 36. Breakdown Tasks

Tasks include:

- Remove
- Verify
- Pack
- Scan
- Stage
- Load

---

# 37. Breakdown Verification

Verification confirms:

- Correct asset removed
- Quantity
- Condition
- Accessories
- Damage

---

# 38. Missing During Breakdown

Missing assets immediately create:

- Missing Record
- Investigation
- Financial Hold
- Collection Exception

---

# 39. Damage During Breakdown

Damage records include:

- Photos
- Description
- Responsible Party
- Estimated Cost
- Severity

---

# 40. Utilisation Metrics

Metrics include:

- Days Used
- Hours Active
- Number of Events
- Revenue Generated
- Idle Time
- Failure Rate

These support future planning.

---

# 41. Asset Wear

Utilisation contributes to:

- Wear Level
- Service Interval
- Remaining Useful Life

Wear calculations are advisory unless Maintenance rules require action.

---

# 42. Asset History

Each asset maintains:

- Every Event
- Every Deployment
- Every Position
- Every Failure
- Every Repair
- Every Movement

---

# 43. Event Completion

Deployment closes only after:

- Assets Removed
- Variances Resolved
- Breakdown Completed
- Collection Confirmed

---

# 44. QR Integration

QR supports:

- Venue Arrival
- Deployment
- Relocation
- Verification
- Breakdown
- Collection

---

# 45. Reservation Integration

Deployment updates:

- Fulfilment Progress
- Actual Usage
- Completion

Reservations remain historical.

---

# 46. Logistics Integration

Deployment consumes:

- Delivered Assets
- Vehicle Manifests
- Delivery Exceptions

---

# 47. Warehouse Integration

After breakdown:

Assets return through:

- Logistics
- Warehouse Receiving
- Inspection

---

# 48. Commercial Workspace Integration

Deployment records may support:

- Additional Charges
- Client Changes
- Extra Labour
- Damage Claims
- Lost Asset Claims

Approval remains mandatory.

---

# 49. Finance Integration

Deployment provides evidence for:

- Asset Utilisation
- Event Costing
- Depreciation Analysis
- Damage Recovery

No accounting entry is created directly.

---

# 50. AI Assistance

AI may:

- Recommend deployment sequence
- Predict setup delays
- Detect missing assets
- Suggest replacements
- Forecast breakdown duration

AI may not:

- Approve substitutions
- Modify Event Design
- Accept client sign-off
- Commit commercial changes

without operator approval.

---

# 51. Roles and Permissions

Minimum roles:

- View Deployment
- Create Deployment
- Start Setup
- Verify Installation
- Record Variances
- Record Incidents
- Move Assets
- Confirm Client Acceptance
- Start Breakdown
- Complete Breakdown
- Close Deployment

---

# 52. Audit Requirements

Audit includes:

- Deployment creation
- Asset placement
- Relocation
- Verification
- Client acceptance
- Variances
- Incidents
- Breakdown
- Collection
- Closure

Each audit records:

- User
- Timestamp
- Previous State
- New State
- Related Asset
- Related Requirement
- Reason

---

# 53. Locked Business Rules

**AM-DP-001**  
Every deployed asset must be linked to an approved Requirement Item.

**AM-DP-002**  
Every deployed asset must reference the Event Design element it fulfils.

**AM-DP-003**  
Planned Design, Planned Deployment and Actual Deployment must remain separate data concepts.

**AM-DP-004**  
Actual deployment must never overwrite the approved Event Design; differences shall be recorded as deployment variances.

**AM-DP-005**  
Every serialized asset deployed at a venue shall have one current deployment location or operational state.

**AM-DP-006**  
Deployment Zones and Positions shall use structured venue hierarchies and may not rely solely on free-text descriptions.

**AM-DP-007**  
An asset arriving at a venue is not considered deployed until installation or placement has been confirmed.

**AM-DP-008**  
Operational status and utilisation status are separate concepts and shall be tracked independently.

**AM-DP-009**  
Temporary relocation of an asset during an event shall preserve complete location and custody history.

**AM-DP-010**  
Approved substitutions shall retain links to the original Requirement Item, Design Element and approval record.

**AM-DP-011**  
Client-owned and supplier-owned assets shall maintain separate ownership and custody records throughout deployment.

**AM-DP-012**  
Event incidents, failures and damage shall be linked to the deployed asset and deployment context.

**AM-DP-013**  
Breakdown shall verify the removal and condition of all deployed assets before collection.

**AM-DP-014**  
Missing or damaged assets discovered during breakdown shall immediately generate controlled exception records.

**AM-DP-015**  
Every deployment, relocation, verification, client acceptance and breakdown activity shall be fully auditable.

**AM-DP-016**  
AI may recommend deployment improvements but may not approve substitutions, modify Event Designs or commit commercial decisions without operator approval.

---

# 54. Completion Criteria

Event Deployment, Setup and Asset Utilisation is complete when EventOS can:

- Create structured Deployment Records.
- Map deployed assets to Requirement Items and Event Design elements.
- Track venue zones and exact deployment positions.
- Manage deployment tasks and crew assignments.
- Confirm venue asset check-in.
- Verify installation and operational readiness.
- Record client acceptance where required.
- Capture deployment variances and approved substitutions.
- Track live asset utilisation and temporary relocations.
- Maintain continuous chain of custody during the event.
- Record operational incidents and emergency replacements.
- Plan and execute structured breakdown activities.
- Verify returned assets before collection.
- Measure asset utilisation and wear.
- Integrate with QR Tracking, Logistics, Warehouse, Commercial Workspace and Finance.
- Preserve a complete deployment and utilisation audit trail.

---

## Section 09.08 — Asset Inspection, Damage, Loss and Maintenance

### 1. Purpose

Asset Inspection, Damage, Loss and Maintenance governs how EventOS assesses asset condition, records defects, controls damaged or missing assets, plans maintenance and restores eligible assets to operational availability.

The section must ensure that EventOS can answer:

- What condition is the asset currently in?
- When was it last inspected?
- Is it safe and event ready?
- What defect or damage has been identified?
- Where and when did the damage occur?
- Is the asset missing, lost or stolen?
- Which events and reservations are affected?
- What maintenance is required?
- Who is responsible for the work?
- What parts, labour and external services are required?
- When will the asset become available again?
- Should the asset be repaired, replaced, written off or retired?
- Is any cost recoverable from a client, supplier, employee, insurer or third party?

This section protects asset safety, operational readiness, financial value and future event fulfilment.

---

## 2. Architectural Position

The asset-health lifecycle is:

`Use or Movement → Inspection → Condition Assessment → Defect Decision → Quarantine or Maintenance → Repair and Verification → Return to Service`

Where an asset is missing:

`Missing Detection → Search and Investigation → Recovery or Loss Confirmation → Commercial and Financial Resolution → Return to Service or Write-Off`

This section integrates with:

- Asset Identity
- Warehouse Management
- QR Tracking
- Reservation and Allocation
- Picking, Packing and Staging
- Logistics
- Event Deployment
- Requirement Engine
- Commercial Workspace
- Procurement Studio
- Finance
- Insurance and Claims
- Supplier Management
- Personnel and Responsibility Records

---

## 3. Core Operational Distinctions

EventOS must keep the following concepts separate.

### 3.1 Inspection

A structured assessment performed at a defined point in the asset lifecycle.

### 3.2 Condition

The current assessed physical and operational state of the asset.

### 3.3 Defect

A specific identified fault, deficiency or nonconformity.

### 3.4 Damage

Physical deterioration caused by an incident, misuse, accident, environment, wear or handling.

### 3.5 Failure

An inability to perform the intended operational function.

### 3.6 Maintenance

Planned or corrective work intended to preserve or restore operational capability.

### 3.7 Quarantine

A controlled state preventing use while suitability, ownership, safety or condition remains unresolved.

### 3.8 Missing

An asset expected at a known place or process stage but not found.

### 3.9 Lost

An asset whose location remains unknown after the required search process.

### 3.10 Stolen

An asset whose disappearance is reasonably classified as theft and handled through the required investigation and reporting process.

### 3.11 Write-Off

An approved financial and operational decision that the asset will no longer remain an active recoverable asset.

These states and records must remain distinct.

---

## 4. Inspection Record

Every formal inspection must have an immutable Inspection ID.

Format:

`INS-##########`

Example:

`INS-0000031468`

Each Inspection Record must contain:

- Inspection ID
- Asset Instance, Batch, Kit, Container or Quantity Stock reference
- Asset Definition
- Inspection Type
- Inspection Status
- Inspection Trigger
- Inspection location
- Related event or operational process
- Required completion date
- Inspector
- Inspection started timestamp
- Inspection completed timestamp
- Condition before inspection
- Condition after inspection
- Inspection outcome
- Evidence
- Follow-up action
- Created by
- Created timestamp

Where applicable:

- Requirement Item
- Deployment Record
- Logistics Job
- Return Record
- Picking Order
- Maintenance Work Order
- Damage Record
- Supplier
- Client
- Custody party
- Certification
- Meter reading
- Utilisation reading

---

## 5. Inspection Types

EventOS shall support the following Inspection Types:

- Initial Asset Intake
- Goods Receipt
- Client-Owned Asset Intake
- Supplier-Hire Intake
- Pre-Allocation
- Pre-Pick
- Pre-Dispatch
- Venue Arrival
- Pre-Deployment
- Operational Safety Check
- During-Event Inspection
- Breakdown Inspection
- Return Inspection
- Post-Cleaning Inspection
- Post-Maintenance Inspection
- Periodic Condition Inspection
- Regulatory Inspection
- Certification Inspection
- Inventory Verification
- Damage Assessment
- Recovery Inspection
- Disposal Inspection
- Ad Hoc Inspection

Inspection types may have category-specific templates and approval rules.

---

## 6. Inspection Status

Permitted Inspection statuses are:

- Planned
- Due
- Assigned
- In Progress
- Awaiting Evidence
- Awaiting Specialist
- Completed
- Failed
- Follow-Up Required
- Suspended
- Cancelled
- Closed

A Completed inspection may still result in an asset being quarantined, damaged or maintenance-required.

---

## 7. Inspection Trigger

An inspection may be triggered by:

- Asset receipt
- Event return
- Reported damage
- Reported failure
- Maintenance completion
- Scheduled interval
- Utilisation threshold
- Regulatory deadline
- Certification expiry
- Long-term storage
- Ownership transfer
- Supplier return
- Client complaint
- Warehouse discrepancy
- Recovery after loss
- Risk rule
- Manual request

The trigger must remain recorded for audit and reporting.

---

## 8. Inspection Templates

Inspection Templates define the checks required for an asset category or process.

A template may contain:

- Checklist items
- Required measurements
- Acceptable limits
- Condition criteria
- Photographic requirements
- Test equipment
- Required qualifications
- Failure rules
- Automatic quarantine rules
- Follow-up actions
- Approval requirements
- Certification outputs

Templates must be version controlled.

---

## 9. Inspection Checklist Item

Every checklist item may define:

- Check description
- Check type
- Mandatory or optional
- Pass criteria
- Measurement unit
- Minimum value
- Maximum value
- Evidence required
- Failure severity
- Follow-up action
- Specialist requirement
- Safety classification

Supported response types include:

- Pass or Fail
- Yes or No
- Numeric measurement
- Condition grade
- Text observation
- Multiple selection
- Photograph
- Signature
- Document upload
- Serial or certification reference

---

## 10. Condition Model

Every serialized Asset Instance must have one current Condition Grade.

Standard grades are:

- New
- Premium
- Event Ready
- Serviceable
- Restricted Use
- Repairable
- Major Repair Required
- Beyond Economic Repair
- Unfit for Use
- Unknown

Condition Grade represents overall suitability.

It does not replace individual defect records.

---

## 11. Condition Dimensions

EventOS may assess condition across separate dimensions:

- Visual
- Structural
- Mechanical
- Electrical
- Electronic
- Functional
- Cleanliness
- Cosmetic
- Safety
- Completeness
- Certification
- Packaging
- Battery health
- Consumable readiness

An asset may be visually acceptable but functionally failed.

The overall Condition Grade must be derived from the most relevant operational rules, not visual appearance alone.

---

## 12. Condition Assessment

A Condition Assessment must record:

- Overall Condition Grade
- Dimension-level ratings
- defects found
- missing components
- contamination
- cleanliness
- evidence
- inspector
- assessment timestamp
- usage restrictions
- next action
- availability impact

Condition changes must preserve prior assessments.

---

## 13. Condition Requirements by Use

Asset suitability may depend on intended use.

Examples:

- Premium client-facing event
- Standard event
- Internal utility use
- Outdoor use
- Back-of-house use
- Safety-critical use
- Food-contact use
- High-load technical use

An asset classified as Serviceable may be acceptable for one use but unsuitable for another.

Reservation and allocation must evaluate condition against the required use context.

---

## 14. Defect Record

Every identified defect must have an immutable Defect ID.

Format:

`DFT-##########`

A Defect Record must contain:

- Defect ID
- Asset reference
- Defect category
- Defect description
- Severity
- Detection source
- Detected by
- Detection timestamp
- Detection location
- Related inspection
- Related event or process
- Operational impact
- Safety impact
- Availability impact
- Evidence
- Current defect status
- Assigned owner
- Required resolution date

---

## 15. Defect Categories

Supported categories include:

- Cosmetic
- Structural
- Mechanical
- Electrical
- Electronic
- Software or Firmware
- Battery
- Connection
- Fabric
- Surface Finish
- Corrosion
- Water Damage
- Heat Damage
- Contamination
- Missing Component
- Calibration
- Certification
- Packaging
- Labelling
- QR Identity
- Safety
- Other

---

## 16. Defect Severity

Defect severity levels are:

- Observation
- Minor
- Moderate
- Major
- Critical
- Safety Critical

Severity determines:

- Quarantine requirement
- maintenance priority
- approval level
- reservation impact
- escalation
- reporting
- release restrictions

Safety Critical defects must immediately block use.

---

## 17. Defect Status

Permitted statuses are:

- Open
- Under Assessment
- Accepted for Restricted Use
- Maintenance Required
- Repair in Progress
- Awaiting Parts
- Awaiting Supplier
- Awaiting Approval
- Resolved
- Not Reproducible
- Deferred
- Written Off
- Closed

A defect may be deferred only where the asset remains safe and the permitted use is clearly defined.

---

## 18. Damage Record

Every material damage event must have an immutable Damage Record ID.

Format:

`DMG-##########`

Each Damage Record must contain:

- Damage Record ID
- Asset or quantity
- Damage category
- Damage severity
- Date and time detected
- Estimated occurrence time
- Location detected
- probable occurrence location
- Related event
- Related logistics job
- Related warehouse process
- Current custodian
- Reported by
- Description
- Photographs
- Immediate action
- Availability impact
- Suspected cause
- Suspected responsible party
- Investigation requirement
- Estimated repair cost
- Estimated replacement cost
- Recovery potential
- Current status

---

## 19. Damage Categories

Supported Damage Categories include:

- Handling Damage
- Transport Damage
- Installation Damage
- Operational Damage
- Breakdown Damage
- Water Damage
- Weather Damage
- Fire or Heat Damage
- Electrical Damage
- Overload
- Impact
- Crushing
- Abrasion
- Contamination
- Cleaning Damage
- Misuse
- Normal Wear
- Manufacturing Defect
- Supplier Damage
- Client Damage
- Unknown Cause

---

## 20. Damage Status

Permitted Damage statuses are:

- Reported
- Under Assessment
- Quarantined
- Repair Approved
- Repair in Progress
- Awaiting Parts
- Awaiting External Service
- Repair Complete
- Recovery Pending
- Insurance Claim Pending
- Liability Disputed
- Beyond Economic Repair
- Written Off
- Closed

---

## 21. Damage Detection Context

Damage may be detected during:

- Goods receipt
- warehouse movement
- picking
- packing
- loading
- transport
- venue unloading
- setup
- event operation
- breakdown
- return transport
- warehouse return
- cleaning
- maintenance
- inventory count

The detection point must not automatically be treated as the occurrence point.

EventOS must separately record:

- Where damage was detected
- Where damage probably occurred
- Who had custody during the likely occurrence period

---

## 22. Immediate Damage Response

When damage is reported, EventOS must determine whether to:

- Continue use
- Continue use with restriction
- Remove from service
- Quarantine
- Replace immediately
- Perform emergency repair
- Require specialist assessment
- Create safety incident
- Notify insurance
- Preserve evidence
- Escalate to commercial review

The immediate response must be based on safety and operational rules.

---

## 23. Damage Assessment

A Damage Assessment must evaluate:

- Nature of damage
- extent
- cause
- repairability
- safety
- impact on functionality
- impact on appearance
- repair cost
- replacement cost
- repair duration
- expected remaining useful life
- event impact
- liability
- insurance relevance
- salvage potential

The assessment must result in a recommended disposition.

---

## 24. Damage Disposition

Permitted dispositions are:

- No Action Required
- Clean and Reinspect
- Minor Internal Repair
- Major Internal Repair
- External Repair
- Manufacturer Repair
- Supplier Return
- Restricted Use
- Component Replacement
- Asset Rebuild
- Insurance Assessment
- Write-Off Recommended
- Disposal Recommended
- Salvage for Parts

Disposition approval must follow value, safety and ownership rules.

---

## 25. Quarantine

Quarantine prevents an asset from being reserved, allocated, picked, deployed or treated as available.

A Quarantine Record must contain:

- Asset
- reason
- start timestamp
- quarantine location
- initiated by
- related defect, damage or inspection
- release conditions
- review date
- responsible owner
- current status

Quarantine statuses:

- Active
- Under Review
- Awaiting Inspection
- Awaiting Decision
- Release Approved
- Released
- Converted to Maintenance
- Converted to Write-Off
- Closed

---

## 26. Quarantine Rules

An asset must enter quarantine where:

- Safety suitability is uncertain.
- A Safety Critical defect exists.
- Ownership is disputed.
- Identification is uncertain.
- Contamination is suspected.
- Certification is invalid.
- Damage requires assessment.
- Returned condition is disputed.
- Evidence must be preserved.
- Incorrect parts or configuration are suspected.

Only an authorised release process may return the asset to eligible availability.

---

## 27. Missing Asset Record

Every missing asset or missing quantity must have an immutable Missing Record ID.

Format:

`MIS-##########`

Each Missing Record must contain:

- Missing Record ID
- Asset Instance or Asset Definition
- Quantity where applicable
- Last confirmed location
- Last confirmed scan
- Last confirmed custodian
- Expected location
- Related event
- Related warehouse or logistics process
- Detected by
- Detection timestamp
- Detection context
- Search priority
- Current classification
- Investigation owner
- Financial exposure
- Replacement urgency
- Current status

---

## 28. Missing Classification

A missing record may be classified as:

- Location Discrepancy
- Temporarily Misplaced
- Missing in Warehouse
- Missing in Transit
- Missing at Venue
- Missing During Breakdown
- Missing from Supplier
- Missing from Client Custody
- Lost
- Suspected Theft
- Confirmed Theft
- Data Error
- Recovered

Classification may change as evidence develops.

---

## 29. Missing Status

Permitted statuses are:

- Reported
- Search Initiated
- Under Investigation
- Likely Location Identified
- Recovery in Progress
- Recovered
- Loss Pending Confirmation
- Lost
- Suspected Stolen
- Theft Confirmed
- Insurance Claim Pending
- Financial Resolution Pending
- Written Off
- Closed

---

## 30. Search Procedure

A missing-asset search may include:

- Last scan review
- location search
- adjacent-location search
- container and kit review
- vehicle manifest review
- venue-zone review
- custody interview
- photograph review
- QR activity review
- GPS evidence
- warehouse count
- supplier confirmation
- client confirmation
- security footage reference
- access-log reference

Search steps must be configurable by asset value and risk.

---

## 31. Missing Quantity Control

For quantity-tracked assets, a shortage must record:

- Expected quantity
- actual quantity
- missing quantity
- unit of measure
- source process
- likely cause
- counting method
- recount status
- responsible owner
- financial exposure

A quantity discrepancy must not automatically be classified as theft.

---

## 32. Lost Asset Confirmation

An asset may be classified as Lost only after:

- Required searches are complete.
- Relevant custody records are reviewed.
- Data-entry errors are excluded.
- Relevant containers and locations are checked.
- Responsible approval is obtained.
- Reservation and financial impacts are assessed.

Lost status removes the asset from eligible availability.

---

## 33. Theft Handling

Suspected or confirmed theft may require:

- Security escalation
- evidence preservation
- police case reference
- insurer notification
- client notification
- supplier notification
- access review
- user-permission review
- QR revocation
- financial hold
- disciplinary or legal referral

EventOS records the operational process.

It does not determine criminal liability.

---

## 34. Recovery

When a missing, lost or stolen asset is recovered, EventOS must:

1. Confirm identity.
2. record recovery location and time.
3. record recovering party.
4. inspect condition.
5. verify QR identity.
6. assess evidence requirements.
7. review ownership and custody.
8. update investigation status.
9. assess reservation impact.
10. determine whether the asset may return to service.

Recovered assets must not automatically become available before inspection.

---

## 35. Maintenance Work Order

Every maintenance activity must be controlled through a Maintenance Work Order.

Format:

`MWO-##########`

Example:

`MWO-0000027306`

Each Work Order must contain:

- Maintenance Work Order ID
- Asset reference
- Maintenance Type
- Trigger
- Priority
- Work Order status
- Requested by
- Assigned technician or provider
- Planned start
- Planned completion
- Actual start
- Actual completion
- Work location
- Required parts
- Required labour
- Required tools
- Safety requirements
- Estimated cost
- Approved cost
- Actual cost
- Related defect or damage
- Related inspection
- Availability impact
- Verification requirement

---

## 36. Maintenance Types

Supported Maintenance Types include:

- Preventive Maintenance
- Corrective Maintenance
- Predictive Maintenance
- Condition-Based Maintenance
- Emergency Repair
- Cleaning
- Calibration
- Testing
- Certification
- Software or Firmware Update
- Battery Service
- Component Replacement
- Refurbishment
- Repainting or Refinishing
- Upholstery Repair
- Structural Repair
- Electrical Repair
- External Manufacturer Service
- Supplier Warranty Repair
- Inspection Only
- Decommissioning Preparation

---

## 37. Maintenance Status

Permitted statuses are:

- Requested
- Under Review
- Approved
- Planned
- Assigned
- Awaiting Asset
- Awaiting Parts
- Awaiting Technician
- In Progress
- Paused
- External Service
- Quality Check Required
- Completed
- Failed
- Cancelled
- Closed

---

## 38. Maintenance Priority

Priority levels are:

- Routine
- Planned
- High
- Urgent
- Emergency
- Safety Critical

Priority must consider:

- Safety
- reservation impact
- event proximity
- asset uniqueness
- revenue impact
- supplier commitments
- replacement availability
- legal or certification requirements

Commercial urgency may not reduce safety requirements.

---

## 39. Preventive Maintenance Plan

Asset Definitions or Asset Instances may have Preventive Maintenance Plans.

A plan may be based on:

- Calendar interval
- operating hours
- event count
- distance
- cycle count
- energy throughput
- battery cycles
- inspection result
- environmental exposure
- manufacturer requirement
- regulatory requirement
- seasonal schedule

Each plan must define:

- Maintenance task
- interval
- tolerance window
- responsible role
- required qualification
- checklist
- parts
- estimated duration
- release criteria

---

## 40. Maintenance Schedule

Scheduled maintenance must create future unavailability windows.

The schedule must be considered during:

- Availability calculation
- reservation
- allocation
- picking release
- logistics planning

Maintenance may be rescheduled only through controlled approval.

Safety-critical or legally required work may not be postponed solely to satisfy an event reservation.

---

## 41. Predictive Maintenance

EventOS may use utilisation and condition data to predict maintenance needs.

Inputs may include:

- Operating hours
- event count
- failure history
- temperature exposure
- vibration
- load
- battery performance
- inspection trends
- technician observations
- manufacturer guidance

Predictive results are advisory until converted into approved work orders or mandatory system rules.

---

## 42. Maintenance Task

A Work Order may contain multiple Maintenance Tasks.

Each task must contain:

- Task description
- sequence
- assigned technician
- skill requirement
- status
- estimated duration
- actual duration
- parts required
- test requirement
- completion evidence
- result
- follow-up action

Task dependencies must be supported.

---

## 43. Maintenance Parts

Parts used during maintenance may be:

- Stock-controlled parts
- consumables
- serialized components
- supplier-provided parts
- recovered components
- client-provided parts

Every installed serialized component must preserve:

- Component identity
- source
- installation date
- removed component
- technician
- warranty
- parent asset relationship

---

## 44. Removed Components

A removed component must be classified as:

- Reusable
- Repairable
- Return to Supplier
- Warranty Claim
- Quarantined
- Scrap
- Hazardous Disposal
- Evidence Hold

Removed components must not silently disappear from inventory or asset history.

---

## 45. External Maintenance Provider

Where work is performed externally, EventOS must record:

- Service provider
- dispatch and custody
- quotation
- approved scope
- expected completion
- warranty
- external reference
- shipping or logistics
- received condition
- service report
- actual cost
- return inspection

The asset remains operationally controlled through an external-custody state.

---

## 46. Warranty Repair

Warranty work must record:

- Warranty provider
- warranty terms
- claim reference
- reported defect
- claim date
- accepted or rejected status
- supplier response
- replacement unit
- repair outcome
- uncovered cost
- warranty effect

A warranty claim does not automatically suspend replacement planning for a confirmed event.

---

## 47. Maintenance Cost Approval

Maintenance cost approval may depend on:

- Estimated cost
- asset replacement value
- ownership
- warranty
- insurance
- remaining useful life
- event urgency
- repair history
- repair-to-replacement ratio

Work exceeding approval thresholds must not proceed without authorised approval, except emergency safety actions.

---

## 48. Repair-versus-Replace Decision

EventOS must support structured repair-versus-replace assessment.

The assessment may consider:

- Repair cost
- replacement cost
- downtime
- remaining useful life
- reliability after repair
- availability of parts
- asset utilisation
- strategic importance
- current condition
- obsolescence
- supplier support
- event demand
- salvage value
- warranty
- insurance recovery

The system may recommend a decision.

An authorised operator must approve the final disposition.

---

## 49. Beyond Economic Repair

An asset may be classified as Beyond Economic Repair where:

- Repair cost exceeds policy threshold.
- Repair will not restore required reliability.
- Parts are unavailable.
- The asset is obsolete.
- Safety cannot be assured.
- Repeated failures make continued repair unjustifiable.
- Remaining useful life is insufficient.

This classification does not itself write off the asset.

Write-off requires separate approval.

---

## 50. Maintenance Completion

A Maintenance Work Order may become Completed only where:

- Required tasks are finished.
- Required parts are recorded.
- work evidence is attached.
- technician completion is recorded.
- safety checks are complete.
- outstanding defects are resolved or explicitly accepted.
- actual cost and labour are captured where required.
- post-maintenance verification is scheduled or completed.

Completed maintenance does not automatically mean Return to Service.

---

## 51. Post-Maintenance Verification

Post-maintenance verification must confirm:

- Correct repair
- functional operation
- safety
- completeness
- configuration
- calibration
- cleanliness
- certification
- QR identity
- condition
- permitted use

The verifier may be required to be independent from the technician.

---

## 52. Return to Service

An asset may return to service only after:

- Blocking defects are resolved.
- required maintenance is complete.
- mandatory inspection passes.
- required certification is valid.
- quarantine release is approved.
- condition grade is updated.
- usage restrictions are defined.
- current warehouse location is confirmed.

Return to Service must be a controlled and auditable action.

---

## 53. Restricted Return to Service

An asset may be returned with restrictions.

Examples:

- Indoor use only
- Utility events only
- Maximum load reduced
- Not client-facing
- Backup use only
- Temporary operation until replacement
- Specific accessory required

Restrictions must be visible during reservation, allocation, picking and deployment.

---

## 54. Maintenance Failure

A Work Order may fail where:

- Fault remains unresolved.
- repair introduces another defect.
- testing fails.
- required parts are unavailable.
- repair is unsafe.
- cost exceeds approval.
- asset is found beyond economic repair.

Failure must trigger a new disposition decision.

---

## 55. Cleaning Management

Cleaning may be treated as a maintenance activity where asset readiness depends on it.

Cleaning records may include:

- Cleaning method
- chemicals used
- temperature
- responsible team
- contamination status
- stain treatment
- drying
- inspection
- hygiene certification
- actual quantity processed

Clean and dirty stock must remain operationally distinguishable.

---

## 56. Calibration and Certification

Assets requiring calibration or certification must record:

- Certificate type
- issuing party
- certificate number
- issue date
- expiry date
- calibration result
- permitted range
- next due date
- attached certificate
- related Asset Instance

Expired or failed certification must block regulated or safety-critical use.

---

## 57. Maintenance History

Every Asset Instance must provide a chronological maintenance history containing:

- Work Orders
- inspections
- defects
- damage
- parts replaced
- technicians
- external providers
- costs
- downtime
- verification
- restrictions
- return-to-service actions

Maintenance history must remain available after retirement or write-off.

---

## 58. Downtime

Every maintenance, quarantine, loss or investigation process must contribute to asset downtime.

Downtime may be classified as:

- Planned Maintenance Downtime
- Unplanned Repair Downtime
- Quarantine Downtime
- Awaiting Parts
- External Service
- Loss Investigation
- Certification Hold
- Supplier Delay
- Administrative Hold

Downtime reporting supports availability and lifecycle decisions.

---

## 59. Reservation Impact Analysis

When an asset becomes damaged, missing, quarantined or maintenance-required, EventOS must identify:

- Current reservation
- future reservations
- hard allocations
- provisional allocations
- picking orders
- Packing Units
- staging allocations
- Logistics Jobs
- Deployment Records
- contingency assets
- replacement options

Affected reservations must be assigned an updated risk state.

---

## 60. Replacement Fulfilment

Where an affected asset is required for an event, EventOS may propose:

- Another Asset Instance
- another batch
- another warehouse
- an approved substitute
- supplier hire
- purchase
- expedited repair
- contingency asset
- event design change

The proposed replacement must follow Reservation, Procurement, Commercial and Event Design approval rules.

---

## 61. Damage and Loss Liability

A damage or loss record may assign a provisional responsibility classification:

- Internal Operations
- Warehouse
- Logistics
- Setup Crew
- Event Operations
- Client
- Supplier
- Venue
- External Contractor
- Unknown
- Shared Responsibility
- Normal Wear
- Manufacturing Defect

This classification is provisional until approved.

It must not be treated as legal liability without the required review.

---

## 62. Responsibility Evidence

Responsibility assessment may consider:

- Chain of custody
- scan history
- photographs
- inspection records
- signed handovers
- vehicle manifests
- deployment records
- witness statements
- access records
- security records
- manufacturer findings
- maintenance history

EventOS must preserve conflicting evidence and unresolved responsibility.

---

## 63. Damage and Loss Recovery

Recovery processes may include:

- Client charge
- supplier claim
- employee recovery
- insurer claim
- venue claim
- warranty claim
- internal write-off
- shared settlement
- no recovery

Operational users may propose recovery.

Commercial and Finance approval remains mandatory.

---

## 64. Claim Record

Where external recovery is pursued, EventOS may create a Claim Record.

Format:

`CLM-##########`

Each Claim Record must contain:

- Claim ID
- Damage or Missing Record
- Claim type
- claimant business
- responsible party
- insurer or supplier
- claimed amount
- supporting evidence
- submitted date
- status
- accepted amount
- rejected amount
- settlement date
- financial references

---

## 65. Claim Status

Permitted statuses are:

- Draft
- Under Review
- Awaiting Evidence
- Approved for Submission
- Submitted
- Acknowledged
- Under Assessment
- Partially Accepted
- Accepted
- Rejected
- Disputed
- Settled
- Withdrawn
- Closed

---

## 66. Write-Off Recommendation

A Write-Off Recommendation may be created where an asset is:

- Lost
- Stolen
- Destroyed
- Beyond economic repair
- obsolete
- unsafe
- unrecoverable
- permanently contaminated
- financially immaterial under policy

The recommendation must contain:

- Asset
- reason
- condition
- repair estimate
- replacement value
- residual value
- recovery status
- insurance status
- ownership
- evidence
- recommended effective date
- proposed disposal method
- approvals required

---

## 67. Write-Off Approval

Write-off approval must be separated from:

- Damage reporting
- Loss confirmation
- maintenance decision
- physical disposal
- accounting entry

The approved write-off authorises retirement from active operational inventory.

Finance remains responsible for accounting treatment.

---

## 68. Disposal and Salvage Handover

Approved write-off may lead to:

- Disposal
- recycling
- hazardous disposal
- sale as damaged
- salvage for parts
- return to owner
- return to supplier
- donation
- evidence retention

Disposal execution belongs to Asset Lifecycle and Disposal control but must retain links to the originating damage, maintenance or loss records.

---

## 69. Maintenance Capacity Planning

EventOS must support planning for:

- Technician capacity
- workshop capacity
- external-provider capacity
- parts availability
- test equipment
- cleaning capacity
- calibration capacity
- scheduled downtime
- emergency work
- reservation deadlines

Maintenance backlogs must be visible to Operations.

---

## 70. Maintenance Queue

The Maintenance Queue must show:

- Work Orders awaiting approval
- assets awaiting inspection
- safety-critical work
- event-critical work
- work awaiting parts
- external service
- overdue work
- quality checks
- failed repairs
- return-to-service pending
- cost approvals
- warranty cases

---

## 71. Parts Reservation

Parts required for approved maintenance may be reserved through inventory control.

The parts reservation must reference:

- Work Order
- part
- quantity
- warehouse
- required date
- substitute policy
- issue status
- returned unused quantity

Parts reservation must remain distinct from event asset reservation.

---

## 72. Workshop Location Control

Assets under internal maintenance must have a structured workshop location.

Examples:

- Awaiting Assessment
- Mechanical Bench
- Electrical Bench
- Cleaning Bay
- Paint Area
- Upholstery Area
- Awaiting Parts
- Quality Control
- Completed Work Holding

The warehouse record remains authoritative for physical location.

---

## 73. Maintenance Custody

Custody may transfer between:

- Warehouse
- Internal technician
- External service provider
- Manufacturer
- Supplier
- Quality inspector
- Logistics

Every custody transfer must be auditable.

---

## 74. Technician Qualifications

Maintenance Tasks may require defined qualifications.

Examples:

- Electrician
- rigger
- refrigeration technician
- certified calibrator
- fabric specialist
- welder
- electronics technician
- manufacturer-authorised technician

EventOS must prevent assignment where a mandatory qualification is missing or expired.

---

## 75. Safety Controls

Maintenance may require:

- Isolation
- lockout and tagout
- discharge
- battery removal
- pressure release
- lifting controls
- protective equipment
- hazardous-material handling
- confined-space control
- test certification

Safety requirements may not be bypassed by schedule or commercial pressure.

---

## 76. Maintenance Documentation

A Work Order may include:

- Service manual
- technical drawing
- wiring diagram
- parts list
- fault history
- test procedure
- safety procedure
- manufacturer bulletin
- warranty document
- prior service report

Documents must remain linked to the Asset Definition or Asset Instance as appropriate.

---

## 77. Service-Level Targets

Maintenance categories may define:

- Response target
- assessment target
- repair target
- parts-order target
- verification target
- return-to-service target

Targets may vary by:

- Priority
- event impact
- asset class
- value
- safety
- ownership
- contract

---

## 78. Escalation

EventOS must support escalation for:

- Safety Critical defect
- missed inspection
- overdue maintenance
- event-critical repair
- repeated failure
- missing high-value asset
- suspected theft
- unresolved liability
- claim deadline
- excessive downtime
- external-provider delay
- repair cost overrun

Escalation must target responsible roles.

---

## 79. Notifications

Required notifications include:

- Inspection due
- Inspection failed
- Asset quarantined
- Damage reported
- Safety Critical defect
- Missing asset reported
- Asset recovered
- Maintenance due
- Work Order approved
- Parts unavailable
- Repair delayed
- Repair completed
- Verification failed
- Return to Service approved
- Reservation affected
- Claim deadline approaching
- Write-off approval required

---

## 80. Asset Health Dashboard

The dashboard must show:

- Inspections due
- overdue inspections
- quarantined assets
- open defects
- damaged assets
- missing assets
- suspected theft
- active maintenance
- work awaiting parts
- external-service assets
- safety-critical issues
- event-critical risks
- assets awaiting Return to Service
- claims in progress
- write-off recommendations
- maintenance backlog
- downtime trends

---

## 81. Search and Filtering

Users must be able to search and filter by:

- Asset
- Asset Definition
- Asset Instance
- Inspection ID
- Defect ID
- Damage Record ID
- Missing Record ID
- Maintenance Work Order ID
- Claim ID
- Event
- Warehouse
- Location
- Supplier
- Client
- Custodian
- Technician
- Condition
- Severity
- Status
- Priority
- Ownership
- Date range
- Certification expiry
- Reservation impact
- Cost threshold

---

## 82. Reporting

Required reports include:

- Asset condition distribution
- Inspection compliance
- Failed inspections
- Damage by event
- Damage by cause
- Damage by custodian
- Damage recovery
- Missing and lost assets
- Theft incidents
- Recovery rate
- Maintenance backlog
- Maintenance cost
- Cost by asset
- Cost by asset category
- Downtime
- Mean time between failures
- Mean time to repair
- Repeat failures
- Warranty recoveries
- External-provider performance
- Repair-versus-replace outcomes
- Write-offs
- Return-to-service turnaround
- Certification compliance

---

## 83. Reliability Metrics

EventOS may calculate:

- Mean Time Between Failures
- Mean Time to Repair
- Failure frequency
- repeat-defect rate
- maintenance cost per operating hour
- maintenance cost per event
- downtime percentage
- first-time repair success
- inspection failure rate
- warranty recovery rate

Metrics must be advisory and transparently derived.

---

## 84. Lifecycle Health Score

EventOS may calculate an advisory Asset Health Score using:

- Condition
- age
- utilisation
- defect history
- failure history
- maintenance compliance
- downtime
- repair cost
- certification
- parts availability
- obsolescence

The score may support planning.

It must not independently retire, write off or allocate the asset.

---

## 85. Commercial Workspace Integration

Commercial Workspace must be informed where inspection, damage, loss or maintenance creates:

- Client damage charge
- supplier claim
- emergency replacement cost
- additional transport
- additional labour
- event change
- refund exposure
- insurance recovery
- warranty recovery
- cancellation impact
- asset unavailability
- external repair cost

Commercial action requires approval.

---

## 86. Procurement Integration

Procurement may receive demand for:

- Replacement asset
- repair parts
- consumables
- external service
- calibration
- emergency hire
- specialist inspection
- replacement QR labels
- protective packaging

Procurement must reference the originating Work Order, Damage Record or shortage.

---

## 87. Finance Integration

Finance may use records from this section for:

- Repair expense
- capital improvement
- inventory adjustment
- insurance recovery
- client recovery
- supplier recovery
- write-off
- impairment
- disposal value
- maintenance accrual
- warranty credit
- cost allocation

Operational records provide evidence.

They do not independently create accounting entries.

---

## 88. Reservation Integration

Reservation and Allocation must consume:

- Current condition
- quarantine state
- maintenance windows
- certification
- usage restrictions
- estimated return-to-service date
- missing or lost status
- repair risk

Assets that are unsuitable or unavailable must be excluded from eligible capacity.

---

## 89. Warehouse Integration

Warehouse Management must reflect:

- Inspection locations
- quarantine locations
- workshop locations
- external custody
- recovery holding
- clean and dirty states
- awaiting-parts locations
- completed-maintenance holding

Every physical asset movement must remain auditable.

---

## 90. QR Tracking Integration

QR scanning must support:

- Start inspection
- identify defect
- report damage
- place in quarantine
- issue to maintenance
- transfer to external service
- record recovery
- issue parts
- verify repair
- release from quarantine
- return to service

QR activity must not bypass mandatory approvals.

---

## 91. Event Deployment Integration

Event Deployment must be able to:

- Report operational defects
- report failures
- request replacement
- record emergency repair
- record missing assets
- preserve event context
- update utilisation
- transfer custody to maintenance or recovery teams

---

## 92. AI Assistance

AI may assist by:

- Identifying likely defect patterns
- predicting maintenance due dates
- estimating failure risk
- proposing repair-versus-replace options
- identifying affected reservations
- suggesting likely missing-asset locations
- detecting repeated damage patterns
- estimating repair duration
- recommending parts
- prioritising maintenance queues
- identifying probable warranty cases

AI may not:

- Release an asset from quarantine
- certify an asset as safe
- approve maintenance cost
- assign legal liability
- confirm theft
- approve a write-off
- commit commercial recovery
- alter financial records

without authorised operator approval.

---

## 93. Roles and Permissions

Minimum permission groups:

- View Asset Condition
- Create Inspections
- Perform Inspections
- Approve Inspection Results
- Create Defects
- Report Damage
- Assess Damage
- Quarantine Assets
- Release Quarantine
- Report Missing Assets
- Manage Missing Investigations
- Confirm Lost Status
- Record Theft Reference
- Create Maintenance Work Orders
- Approve Maintenance
- Assign Technicians
- Complete Maintenance Tasks
- Record Parts Usage
- Perform Post-Maintenance Verification
- Approve Return to Service
- Manage Warranty Claims
- Manage Damage and Loss Claims
- Recommend Write-Off
- Approve Write-Off
- View Maintenance Costs
- View Liability Information
- Manage Inspection Templates
- Manage Maintenance Plans

Permissions may be restricted by:

- Business
- warehouse
- asset category
- ownership
- asset value
- safety classification
- event
- location
- cost threshold
- role qualification

---

## 94. Audit Requirements

EventOS must retain an immutable audit history for:

- Inspection creation
- checklist completion
- condition changes
- defect creation
- defect severity changes
- damage reporting
- damage assessment
- quarantine
- quarantine release
- missing-asset reporting
- search activity
- loss confirmation
- theft classification
- recovery
- Work Order creation
- maintenance approval
- task execution
- parts usage
- external service
- cost changes
- verification
- Return to Service
- restricted-use decisions
- claims
- write-off recommendations
- write-off approvals
- manual overrides
- AI recommendations accepted or rejected

Each audit entry must contain:

- User
- Timestamp
- Device
- Asset
- Related record
- Previous state
- New state
- Reason
- Evidence
- Approval reference
- Event or operational context
- Custody context where applicable

---

## 95. Locked Business Rules

**AM-IDLM-001**  
Inspection, condition, defect, damage, failure, maintenance, quarantine, missing, loss, theft and write-off must remain separate data concepts.

**AM-IDLM-002**  
Every formal inspection must reference the inspected asset or controlled stock entity and the applicable inspection context.

**AM-IDLM-003**  
Condition changes must preserve the complete prior assessment history.

**AM-IDLM-004**  
A Condition Grade does not replace detailed defect records.

**AM-IDLM-005**  
An asset with a Safety Critical defect must be immediately excluded from operational availability.

**AM-IDLM-006**  
An asset whose safety, identity, ownership, contamination or certification is unresolved must remain quarantined.

**AM-IDLM-007**  
Quarantined assets may not be reserved, allocated, picked, packed, dispatched or deployed.

**AM-IDLM-008**  
Only an authorised release process may return a quarantined asset to eligible availability.

**AM-IDLM-009**  
The point where damage is detected must remain separate from the location and time where it probably occurred.

**AM-IDLM-010**  
Damage responsibility and legal liability may not be automatically inferred from custody or detection location alone.

**AM-IDLM-011**  
A missing asset must not be classified as Lost or Stolen until the required investigation and approval process is completed.

**AM-IDLM-012**  
A recovered asset must undergo identity and condition verification before returning to service.

**AM-IDLM-013**  
Missing, lost, stolen, quarantined and unsuitable assets must be excluded from eligible availability.

**AM-IDLM-014**  
Every maintenance activity must be represented by a Maintenance Work Order or approved controlled maintenance transaction.

**AM-IDLM-015**  
Scheduled maintenance must create an availability restriction for the applicable maintenance window.

**AM-IDLM-016**  
Safety-critical or legally required maintenance may not be postponed solely to satisfy event demand.

**AM-IDLM-017**  
Maintenance completion does not automatically authorise Return to Service.

**AM-IDLM-018**  
Return to Service requires successful completion of all mandatory inspection, safety, certification and quarantine-release requirements.

**AM-IDLM-019**  
Restricted-use assets must display their restrictions during reservation, allocation, picking and deployment.

**AM-IDLM-020**  
Serialized components installed or removed during maintenance must retain full identity and parent-asset history.

**AM-IDLM-021**  
External maintenance must preserve asset ownership, custody and location traceability.

**AM-IDLM-022**  
A warranty claim does not automatically remove the requirement to protect confirmed event fulfilment.

**AM-IDLM-023**  
Repair-versus-replace recommendations may be system assisted, but final disposition requires authorised approval.

**AM-IDLM-024**  
Beyond Economic Repair classification does not independently authorise write-off, disposal or accounting treatment.

**AM-IDLM-025**  
Write-off approval, physical disposal and Finance accounting treatment must remain separate controlled actions.

**AM-IDLM-026**  
Damage, loss and maintenance events affecting reserved assets must trigger impact analysis across all affected reservations and operational workflows.

**AM-IDLM-027**  
Operational users may propose client, supplier, insurer or third-party recovery but may not commit commercial recovery without approval.

**AM-IDLM-028**  
Evidence linked to damage, theft, liability, insurance or disputed custody must be preserved according to retention rules.

**AM-IDLM-029**  
Maintenance and condition history must remain available after asset retirement, write-off or disposal.

**AM-IDLM-030**  
AI may assist with prediction, prioritisation and recommendations but may not certify safety, release quarantine, assign liability, approve write-off or commit commercial or financial actions without operator approval.

---

## 96. Completion Criteria

Asset Inspection, Damage, Loss and Maintenance is complete when EventOS can:

- Create and manage formal inspections.
- apply version-controlled inspection templates.
- track condition grades and condition dimensions.
- create and resolve defect records.
- report, assess and classify damage.
- quarantine unsuitable or unresolved assets.
- manage missing-asset searches and investigations.
- distinguish missing, lost and stolen states.
- recover and reinspect located assets.
- create preventive, corrective, predictive and emergency Maintenance Work Orders.
- schedule maintenance against asset availability.
- assign qualified technicians and external providers.
- track parts, labour, costs and removed components.
- manage warranty repairs.
- support repair-versus-replace decisions.
- perform post-maintenance verification.
- control Return to Service and restricted-use release.
- manage calibration and certification.
- assess reservation and event impact.
- manage damage, loss, warranty and insurance claims.
- recommend and approve asset write-offs.
- report on condition, reliability, maintenance cost, downtime and recovery.
- integrate with Warehouse, QR Tracking, Reservation, Procurement, Commercial Workspace, Event Deployment and Finance.
- preserve a complete asset-health, maintenance, loss and recovery audit trail.

---

## Section 09.09 — Asset Lifecycle, Valuation, Depreciation and Disposal

### 1. Purpose

Asset Lifecycle, Valuation, Depreciation and Disposal governs how EventOS manages an asset from acquisition through operational use, refurbishment, impairment, retirement and final disposal.

The section must ensure that EventOS can answer:

- When did the asset enter service?
- What was its acquisition basis?
- What is its original cost?
- What is its current operational value?
- What is its accounting value?
- How much revenue and utilisation has it generated?
- What maintenance and damage costs have accumulated?
- Is the asset still economically viable?
- Has it become obsolete, unsafe or strategically unsuitable?
- Should it be retained, refurbished, redeployed, sold, salvaged, donated or disposed of?
- What approvals are required before retirement or disposal?
- What evidence confirms that disposal occurred?
- What financial and operational records must remain after disposal?

This section controls the long-term governance of the asset.

It does not replace Finance as the authority for formal accounting treatment.

---

## 2. Architectural Position

The lifecycle sequence is:

`Acquisition → Intake → Commissioning → Active Use → Maintenance → Refurbishment → Revaluation or Impairment → Retirement Decision → Disposal → Historical Retention`

This section integrates with:

- Asset Identity
- Procurement Studio
- Commercial Workspace
- Warehouse Management
- Reservation and Allocation
- Event Deployment
- Inspection, Damage, Loss and Maintenance
- Finance
- Insurance and Claims
- Supplier Management
- Sustainability Reporting
- Audit and Governance

Asset Management controls the operational lifecycle.

Finance controls statutory accounting entries, depreciation posting, impairment recognition and ledger treatment.

---

## 3. Core Lifecycle Distinctions

EventOS must keep the following concepts separate.

### 3.1 Acquisition

The event through which the business obtains ownership or long-term control of an asset.

### 3.2 Commissioning

The point at which the asset becomes approved for operational use.

### 3.3 Operational Life

The period during which the asset may be reserved, allocated and deployed.

### 3.4 Useful Life

The estimated period over which the asset is expected to provide economic or operational benefit.

### 3.5 Accounting Value

The value recognised through Finance according to the applicable accounting policy.

### 3.6 Operational Value

The asset’s usefulness to EventOS operations.

### 3.7 Replacement Value

The estimated cost to replace the asset with an equivalent asset.

### 3.8 Market Value

The estimated amount recoverable through sale in the current market.

### 3.9 Residual Value

The estimated value remaining at the end of the asset’s useful life.

### 3.10 Impairment

A reduction in expected recoverable value.

### 3.11 Retirement

Removal from active operational use.

### 3.12 Disposal

The final transfer, destruction, sale, recycling, return or other authorised exit of the asset.

Retirement does not automatically mean disposal.

---

## 4. Lifecycle Record

Every serialized Asset Instance must have one Lifecycle Record.

Lifecycle Record ID format:

`LFC-##########`

Example:

`LFC-0000018426`

Each Lifecycle Record must contain:

- Lifecycle Record ID
- Asset Instance
- Asset Definition
- Ownership type
- Acquisition method
- Acquisition date
- Commissioning date
- Original acquisition cost
- Currency
- Funding source
- Expected useful life
- Expected residual value
- Depreciation policy reference
- Current lifecycle stage
- Current operational status
- Current accounting status
- Current valuation date
- Replacement value
- Market value where known
- Accumulated maintenance cost
- Accumulated refurbishment cost
- Accumulated damage cost
- Revenue attribution where applicable
- Retirement status
- Disposal status
- Created by
- Created timestamp

---

## 5. Quantity-Tracked Lifecycle Control

Quantity-tracked assets must be governed at Asset Definition, batch or controlled stock-unit level.

Lifecycle control may apply to:

- Entire Asset Definition
- Specific batch
- Stock category
- Warehouse stock pool
- Ownership pool
- Age cohort
- Condition cohort

Examples:

- Retire all linen from Batch LIN-0042.
- Dispose of 250 damaged glasses.
- Revalue a complete décor collection.
- replace all chairs manufactured before a defined date.

Quantity-tracked lifecycle actions must record exact affected quantities.

---

## 6. Lifecycle Stages

Permitted Lifecycle Stages are:

- Planned Acquisition
- Pending Receipt
- Received
- Pending Commissioning
- Active
- Restricted Use
- Under Refurbishment
- Held for Review
- Impaired
- Retired
- Held for Sale
- Held for Disposal
- Disposed
- Returned to Owner
- Archived

Lifecycle stage must remain distinct from:

- Physical location
- condition
- maintenance status
- reservation status
- accounting status

---

## 7. Acquisition Methods

Supported Acquisition Methods include:

- Direct Purchase
- Internal Manufacture
- Capital Project
- Lease
- Finance Agreement
- Donation
- Client Transfer
- Supplier Transfer
- Business Acquisition
- Intercompany Transfer
- Asset Conversion
- Recovered Asset
- Opening Balance Migration
- Other Approved Method

The acquisition method must remain permanently recorded.

---

## 8. Acquisition Record

An Acquisition Record must contain:

- Acquisition Record ID
- Asset or quantity
- Acquisition method
- Supplier or source party
- Purchase Order or agreement
- invoice reference
- receipt reference
- acquisition date
- ownership effective date
- cost components
- currency
- tax treatment reference
- funding source
- warranty
- expected useful life
- residual value assumption
- responsible approver
- supporting documents

Acquisition data may originate from Procurement or Finance but must remain linked to the asset.

---

## 9. Cost Basis

The asset cost basis may include:

- Purchase price
- freight
- import duties
- installation
- commissioning
- testing
- custom fabrication
- professional fees
- initial configuration
- directly attributable labour
- initial packaging
- required certification
- capitalised refurbishment
- other approved directly attributable costs

EventOS may collect these operational cost elements.

Finance determines which elements are capitalised.

---

## 10. Commissioning

An asset may be commissioned only where:

- Identity is complete.
- ownership is confirmed.
- required inspection has passed.
- required certification is valid.
- required configuration is complete.
- warehouse location is confirmed.
- QR identity is active where required.
- operating instructions are available.
- maintenance plan is assigned where required.
- condition is suitable.
- responsible approval is complete.

Commissioning status must be auditable.

---

## 11. Commissioning Record

The Commissioning Record must contain:

- Asset
- commissioning date
- commissioned by
- inspection reference
- certification reference
- configuration
- operating limits
- condition grade
- maintenance plan
- warranty start
- initial location
- initial operational restriction
- supporting evidence

Commissioning does not create the asset’s accounting entry.

---

## 12. Useful Life

Useful life may be expressed as:

- Calendar years
- Months
- Event count
- Operating hours
- Cycles
- Distance
- Usage volume
- Hybrid threshold

Examples:

- Five years
- 500 events
- 10,000 operating hours
- 1,000 battery cycles
- Whichever threshold occurs first

Useful-life assumptions must be version controlled.

---

## 13. Useful-Life Review

Useful life must be reviewed when:

- Failure frequency changes.
- Maintenance cost increases materially.
- Asset utilisation changes.
- Technology becomes obsolete.
- Manufacturer support changes.
- Safety standards change.
- Refurbishment extends life.
- Asset condition deteriorates.
- Market demand changes.
- Event Design trends make the asset unsuitable.
- Parts become unavailable.

A revised useful life must not overwrite prior assumptions.

---

## 14. Residual Value

Residual value represents the expected recoverable value at the end of useful life.

It may consider:

- Resale value
- salvage value
- reusable components
- scrap value
- return value
- deposit recovery
- supplier buyback
- zero value
- disposal cost where negative

Residual-value assumptions must be dated and approved.

---

## 15. Valuation Types

EventOS shall support the following valuation types:

- Original Acquisition Cost
- Current Replacement Value
- Current Market Value
- Operational Value
- Insured Value
- Residual Value
- Salvage Value
- Recoverable Amount
- Book Value from Finance
- Internal Planning Value

Each valuation must clearly identify its purpose.

---

## 16. Valuation Record

Every valuation must have an immutable Valuation Record ID.

Format:

`VAL-##########`

Each record must contain:

- Valuation Record ID
- Asset or asset group
- Valuation type
- value
- currency
- effective date
- valuation method
- source
- valuer
- confidence level
- supporting evidence
- assumptions
- review date
- approval status
- related Finance reference where applicable

---

## 17. Valuation Methods

Supported valuation methods may include:

- Supplier Quotation
- Current Replacement Estimate
- Market Comparable
- External Appraisal
- Internal Appraisal
- Indexed Cost
- Depreciated Replacement Cost
- Salvage Estimate
- Insurance Schedule
- Finance Ledger Import
- Disposal Offer
- Auction Estimate

Valuation method must remain visible.

---

## 18. Valuation Confidence

Valuation confidence may be classified as:

- Verified
- High
- Moderate
- Low
- Indicative
- Unknown

Confidence must reflect evidence quality.

An indicative value must not be presented as an approved accounting value.

---

## 19. Depreciation Policy Reference

Every depreciable asset must reference a Finance-approved Depreciation Policy.

The policy may define:

- Method
- useful life
- residual value
- start date rule
- period convention
- component treatment
- revaluation treatment
- impairment treatment
- disposal treatment
- currency
- ownership scope

EventOS stores the policy reference.

Finance remains authoritative for depreciation posting.

---

## 20. Supported Depreciation Methods

EventOS may support operational modelling of:

- Straight-Line
- Diminishing Balance
- Units of Production
- Event-Count Based
- Operating-Hours Based
- Usage-Based
- Component Depreciation
- Non-Depreciating
- Finance-Managed External Method

Operational models must not be treated as statutory accounting calculations unless confirmed by Finance.

---

## 21. Depreciation Schedule

A Depreciation Schedule may contain:

- Asset
- policy
- depreciation start date
- acquisition cost
- capitalised additions
- residual value
- useful life
- depreciation method
- opening value
- period depreciation
- accumulated depreciation
- closing value
- Finance posting reference
- schedule version

Historical schedules must remain available after policy changes.

---

## 22. Component Depreciation

Significant components may be depreciated separately where Finance policy requires it.

Examples:

- Generator engine
- refrigeration compressor
- modular structure
- battery pack
- control system
- lighting head
- chassis
- removable high-value component

Component identity must remain linked to the parent asset.

Component replacement must update both operational and Finance references.

---

## 23. Capital Improvement

A Capital Improvement is work that materially extends useful life, increases capacity, improves capability or changes the asset’s economic benefit.

Examples:

- Major structural rebuild
- control-system upgrade
- refrigeration conversion
- engine replacement
- complete reupholstery of a premium collection
- major capacity expansion

EventOS may propose that work be reviewed as capital improvement.

Finance approves capitalisation.

---

## 24. Refurbishment Record

Every major refurbishment must have a Refurbishment Record.

Format:

`RFB-##########`

The record must contain:

- Asset
- refurbishment scope
- reason
- condition before
- planned start
- actual start
- completion date
- provider
- parts
- labour
- total cost
- expected life extension
- capability change
- condition after
- valuation impact
- certification impact
- commissioning requirement
- approval
- supporting evidence

---

## 25. Refurbishment Outcome

Permitted outcomes are:

- Restored to Original Standard
- Upgraded
- Life Extended
- Cosmetic Improvement
- Restricted Use
- Partial Completion
- Failed Refurbishment
- Beyond Economic Repair
- Recommissioning Required

A refurbished asset must undergo required inspection before returning to service.

---

## 26. Impairment Trigger

Impairment review may be triggered by:

- Major damage
- repeated failure
- obsolescence
- reduced demand
- regulatory change
- loss of certification
- excessive maintenance cost
- long-term underutilisation
- market-value decline
- supplier support withdrawal
- event-industry trend change
- unrecoverable functionality
- legal restriction
- contamination
- loss or theft

---

## 27. Impairment Review

An Impairment Review must consider:

- Current condition
- future usefulness
- market demand
- replacement value
- market value
- recoverable amount
- maintenance cost
- repair cost
- operating restrictions
- expected utilisation
- remaining useful life
- salvage value
- insurance recovery
- disposal cost

The review may recommend impairment.

Finance approves and records formal accounting impairment.

---

## 28. Impairment Record

Format:

`IMP-##########`

Each Impairment Record must contain:

- Asset
- trigger
- review date
- operational findings
- valuation evidence
- recommended impairment amount
- recommended revised value
- useful-life impact
- reservation impact
- approved by
- Finance reference
- effective date
- review outcome

---

## 29. Operational Value

Operational Value reflects the asset’s practical usefulness to EventOS.

It may consider:

- Demand frequency
- revenue contribution
- design relevance
- substitution availability
- reliability
- maintenance burden
- logistics burden
- condition
- storage burden
- strategic importance
- client preference
- replacement difficulty

Operational Value may differ significantly from accounting value.

---

## 30. Strategic Asset Classification

Assets may be classified as:

- Core Strategic
- High-Demand
- Premium Differentiator
- Standard Operational
- Contingency
- Low Utilisation
- Obsolete
- Non-Core
- Disposal Candidate

Strategic classification must support portfolio decisions.

It must not automatically change accounting treatment.

---

## 31. Utilisation Value Analysis

EventOS may calculate asset performance using:

- Number of events
- active-use hours
- days deployed
- reservation frequency
- revenue contribution
- contribution margin
- maintenance cost
- logistics cost
- storage cost
- damage rate
- downtime
- replacement frequency
- client demand

The calculation method must be transparent.

---

## 32. Revenue Attribution

Where operationally appropriate, revenue may be attributed to:

- Asset Instance
- Asset Definition
- asset family
- kit
- collection
- business unit
- event
- client
- region

Revenue attribution is analytical.

It does not replace invoicing or Finance records.

---

## 33. Total Cost of Ownership

EventOS may calculate Total Cost of Ownership using:

- Acquisition cost
- financing cost where provided
- maintenance
- repair
- refurbishment
- storage
- insurance
- certification
- transport
- cleaning
- energy
- consumables
- damage
- downtime
- disposal cost
- less recoveries

The model must show included and excluded cost categories.

---

## 34. Lifecycle Profitability

Lifecycle profitability may compare:

- Revenue attributed
- acquisition cost
- operating cost
- maintenance cost
- logistics cost
- storage cost
- refurbishment cost
- damage recovery
- residual value
- disposal proceeds

This analysis is advisory and depends on Finance data quality.

---

## 35. Replacement Planning

Replacement planning must identify assets likely to require replacement due to:

- Useful-life expiry
- condition deterioration
- repeated failure
- obsolescence
- demand growth
- capacity shortage
- regulation
- supplier discontinuation
- low reliability
- high maintenance cost
- changing Event Design trends
- portfolio standardisation

Replacement planning may create future Procurement demand.

---

## 36. Replacement Candidate Record

A Replacement Candidate Record must contain:

- Asset or asset group
- reason
- recommended replacement date
- risk if delayed
- expected replacement cost
- expected downtime
- current utilisation
- current condition
- remaining useful life
- maintenance trend
- recommended replacement type
- budget period
- responsible owner
- status

---

## 37. Replacement Status

Permitted statuses are:

- Identified
- Under Review
- Budget Requested
- Approved for Planning
- Procurement Pending
- Replacement Ordered
- Replacement Received
- Replacement Commissioned
- Existing Asset Pending Retirement
- Completed
- Deferred
- Cancelled

---

## 38. Portfolio Review

EventOS shall support portfolio review by:

- Asset category
- asset family
- warehouse
- region
- age
- condition
- utilisation
- profitability
- maintenance burden
- strategic classification
- replacement need
- ownership
- supplier
- insured value

Portfolio review supports long-term investment decisions.

---

## 39. Lifecycle Risk

Lifecycle Risk may consider:

- Age
- condition
- failure frequency
- parts availability
- supplier support
- certification
- maintenance backlog
- utilisation
- strategic importance
- replacement lead time
- insurance status
- regulatory exposure

Risk levels:

- Low
- Moderate
- High
- Critical

---

## 40. Retirement Trigger

Retirement review may be triggered by:

- Useful-life end
- approved write-off
- obsolescence
- replacement completion
- repeated failure
- unsafe condition
- strategic portfolio change
- lease expiry
- ownership return
- business closure
- asset standardisation
- disposal opportunity
- regulatory prohibition

---

## 41. Retirement Record

Every asset retirement must have a Retirement Record.

Format:

`RET-##########`

Each Retirement Record must contain:

- Asset
- retirement reason
- recommendation source
- proposed retirement date
- approved retirement date
- current condition
- current location
- reservation impact
- active allocation impact
- maintenance status
- ownership
- book value reference
- market value
- residual value
- disposal recommendation
- approvals
- responsible owner
- status

---

## 42. Retirement Status

Permitted statuses are:

- Proposed
- Under Review
- Awaiting Finance Review
- Awaiting Operational Approval
- Approved
- Scheduled
- Removed from Service
- Held for Sale
- Held for Disposal
- Returned to Owner
- Cancelled
- Completed

---

## 43. Retirement Preconditions

An asset may be removed from active service only where:

- Active reservations are resolved.
- allocations are released or replaced.
- open Logistics Jobs are resolved.
- deployment is closed.
- maintenance and damage records are reviewed.
- ownership is confirmed.
- client or supplier obligations are resolved.
- required approvals are complete.
- current location is confirmed.
- disposal or holding location is assigned.

Emergency safety retirement may occur immediately, with remaining administration completed afterward.

---

## 44. Retirement Effect

When an asset is Removed from Service:

- It must become unavailable for reservation.
- Active QR identity may be restricted.
- warehouse location must remain known.
- active maintenance must be closed or converted.
- open claims must remain linked.
- Finance must be notified.
- disposal planning may begin.
- historical records must remain accessible.

---

## 45. Temporary Retirement

An asset may be temporarily retired because of:

- Seasonal closure
- long-term storage
- strategic hold
- pending market review
- pending legal decision
- exhibition use
- ownership dispute
- replacement evaluation

Temporary retirement must have a review date and release conditions.

---

## 46. Disposal Record

Every final disposal action must have an immutable Disposal Record.

Format:

`DSP-##########`

Each Disposal Record must contain:

- Disposal Record ID
- Asset or quantity
- disposal method
- disposal reason
- disposal status
- approved retirement reference
- ownership
- disposal location
- disposal party
- planned date
- actual date
- expected proceeds
- actual proceeds
- expected cost
- actual cost
- tax or legal reference
- environmental requirement
- data-erasure requirement
- evidence
- approved by
- executed by
- witnessed by where required
- Finance reference

---

## 47. Disposal Methods

Supported Disposal Methods include:

- Sale
- Auction
- Trade-In
- Supplier Buyback
- Return to Owner
- Return to Supplier
- Donation
- Internal Transfer
- Intercompany Transfer
- Recycling
- Scrap
- Salvage for Parts
- Destruction
- Hazardous Disposal
- E-Waste Disposal
- Abandonment Prohibited
- Other Approved Method

---

## 48. Disposal Status

Permitted statuses are:

- Draft
- Under Review
- Approved
- Scheduled
- Awaiting Buyer
- Awaiting Collection
- In Transfer
- Completed
- Cancelled
- Failed
- Disputed
- Closed

---

## 49. Sale of Asset

An asset sale must record:

- Buyer
- offer
- approved sale price
- tax treatment reference
- payment status
- collection terms
- condition disclosure
- warranty disclaimer
- ownership-transfer date
- custody transfer
- invoice or sales reference
- removal confirmation

The asset must not be marked Disposed before ownership and custody transfer are complete.

---

## 50. Auction Disposal

Auction disposal may record:

- Auction provider
- auction reference
- reserve price
- listing date
- sale date
- winning bidder
- gross proceeds
- commission
- net proceeds
- collection status
- unsold outcome

Unsold assets remain held for disposal until a new decision is approved.

---

## 51. Trade-In

Trade-In must link:

- Retired asset
- replacement asset
- supplier
- trade-in allowance
- purchase reference
- transfer date
- custody confirmation
- Finance treatment

Trade-in value must remain distinguishable from purchase discount.

---

## 52. Donation

Donation requires:

- Recipient
- recipient eligibility
- approved value
- condition disclosure
- transfer terms
- collection
- acknowledgement
- tax-document reference where applicable
- responsible approver

Donation does not bypass ownership or Finance controls.

---

## 53. Recycling and Scrap

Recycling or scrap records must include:

- Material category
- quantity or weight
- recycler
- certificate
- proceeds
- disposal cost
- hazardous-material status
- environmental evidence
- date
- custody transfer

Serialized assets must retain their identity history after material destruction.

---

## 54. Salvage for Parts

An asset may be dismantled for reusable components.

The process must:

1. Identify the parent asset.
2. approve dismantling.
3. record removed components.
4. create or confirm component identities.
5. classify reusable parts.
6. quarantine uncertain parts.
7. dispose of remaining material.
8. close the parent asset.
9. preserve full lineage.

The parent asset must not remain active after completed dismantling.

---

## 55. Destruction

Destruction may be required where:

- Asset is unsafe.
- Counterfeit use is possible.
- Security risk exists.
- Data cannot otherwise be protected.
- Legal or insurance conditions require it.
- Contamination prevents reuse.
- Brand protection requires destruction.

Destruction must require evidence and, where applicable, witness confirmation.

---

## 56. Hazardous Disposal

Hazardous Disposal may apply to:

- Batteries
- refrigerants
- chemicals
- contaminated materials
- electronic waste
- pressure vessels
- fuel
- oils
- lamps
- fire-damaged equipment

The process must record:

- Hazard classification
- approved provider
- transport method
- certificate
- disposal date
- regulatory reference
- responsible person
- evidence

---

## 57. Data-Bearing Assets

Assets containing data or configuration may require data sanitisation.

Examples:

- Computers
- servers
- tablets
- network equipment
- controllers
- storage devices
- smart displays
- mobile devices

Data-erasure records must contain:

- Method
- standard
- performed by
- verification
- date
- device identifier
- exception
- certificate

Disposal may not complete until required data sanitisation is verified.

---

## 58. QR and Identifier Closure

At disposal:

- Active operational QR labels must be revoked.
- retained evidence labels may remain historically resolvable.
- public QR access must be disabled unless intentionally preserved.
- internal Asset IDs must remain immutable.
- manufacturer serial numbers must remain in history.
- replacement labels must not be issued.

Revoking the QR does not delete the asset record.

---

## 59. Disposal Evidence

Disposal evidence may include:

- Photograph
- signed handover
- buyer receipt
- collection note
- destruction certificate
- recycling certificate
- payment evidence
- disposal invoice
- weighbridge ticket
- ownership-transfer document
- witness confirmation
- GPS location
- data-erasure certificate

Evidence requirements must depend on value, risk, ownership and disposal method.

---

## 60. Custody During Disposal

Custody must remain tracked through:

- Retirement holding
- sale holding
- collection
- transport
- recycler
- buyer
- supplier
- owner return
- destruction provider

Disposal status must not be completed while custody remains unresolved.

---

## 61. Disposal Hold

An asset may be placed on Disposal Hold because of:

- Open insurance claim
- legal dispute
- ownership dispute
- client dispute
- supplier dispute
- police evidence
- pending audit
- missing Finance approval
- incomplete valuation
- active reservation
- unresolved data-erasure requirement

Assets on Disposal Hold may not be transferred or destroyed.

---

## 62. Disposal Approval Levels

Approval may depend on:

- Asset value
- book value
- ownership
- disposal method
- environmental risk
- safety risk
- legal risk
- buyer relationship
- related party
- expected loss
- proceeds
- insurance
- asset category

High-value disposals may require dual or committee approval.

---

## 63. Related-Party Disposal

A disposal involving a related party must require:

- Relationship disclosure
- independent valuation
- approval escalation
- pricing justification
- conflict-of-interest declaration
- audit visibility
- Finance approval

The system must flag potential related-party transactions.

---

## 64. Disposal Pricing

Disposal pricing may be based on:

- Market valuation
- auction estimate
- supplier offer
- trade-in offer
- scrap rate
- salvage value
- independent appraisal
- Finance-approved minimum
- reserve price

The approved price and actual proceeds must remain distinct.

---

## 65. Disposal Cost

Disposal cost may include:

- Transport
- dismantling
- labour
- auction fees
- recycling fees
- destruction fees
- hazardous handling
- data erasure
- legal fees
- storage
- cleaning
- administration

EventOS may collect these costs for Finance and lifecycle analysis.

---

## 66. Disposal Proceeds

Proceeds may include:

- Sale revenue
- auction proceeds
- scrap value
- recycling rebate
- supplier buyback
- trade-in allowance
- insurance recovery
- deposit recovery

Different proceeds must remain separately classified.

---

## 67. Finance Handover

When disposal is completed, EventOS must provide Finance with:

- Asset
- acquisition reference
- retirement date
- disposal date
- disposal method
- book-value reference
- approved disposal value
- proceeds
- disposal cost
- impairment reference
- write-off reference
- buyer or recipient
- tax reference
- evidence
- ownership-transfer confirmation

Finance determines the final accounting entry.

---

## 68. Insurance Alignment

Asset values may be compared with insured values.

The system must identify:

- Underinsured assets
- overinsured assets
- uninsured assets
- disposed assets still insured
- newly commissioned assets not yet insured
- major refurbishments requiring policy update
- replacement-value changes
- ownership changes

Insurance updates require authorised operator action.

---

## 69. Asset Portfolio Renewal

EventOS should support renewal planning across:

- Budget years
- asset categories
- warehouses
- regions
- business units
- replacement programmes
- refurbishment programmes
- disposal programmes

Renewal planning must align operational need with Finance budgets.

---

## 70. Capital Planning

Capital planning may include:

- Replacement assets
- new capacity
- premium asset collections
- standardisation
- technology upgrades
- regional expansion
- risk reduction
- sustainability improvements
- maintenance-capacity reduction

Asset lifecycle data should support the investment case.

---

## 71. Sustainability Metrics

EventOS may record:

- Reuse cycles
- refurbishment instead of replacement
- recycled material
- diverted waste
- donated assets
- recovered components
- e-waste processed
- hazardous waste
- disposal certificates
- emissions estimates where available

Sustainability calculations must disclose methodology.

---

## 72. Obsolescence

Obsolescence may be:

- Technical
- Visual
- Commercial
- Regulatory
- Operational
- Supplier-Support
- Digital
- Safety
- Brand
- Client-Preference

An asset may be functional but still operationally obsolete.

---

## 73. Obsolescence Review

The review must consider:

- Event Design relevance
- client demand
- substitute availability
- compatibility
- technology support
- consumable availability
- software support
- certification
- appearance
- storage burden
- logistics burden
- commercial return

The outcome may recommend continued use, restricted use, refurbishment, sale or disposal.

---

## 74. End-of-Life Forecast

EventOS may forecast End-of-Life using:

- Useful-life assumptions
- condition trend
- failure rate
- maintenance cost
- parts availability
- utilisation
- obsolescence
- regulation
- asset health score
- replacement lead time

Forecasts are advisory.

---

## 75. Lifecycle Dashboard

The dashboard must show:

- Assets nearing useful-life end
- impaired assets
- high maintenance-cost assets
- underutilised assets
- obsolete assets
- replacement candidates
- retirement proposals
- assets held for sale
- assets held for disposal
- disposal holds
- completed disposals
- expected proceeds
- disposal costs
- insurance mismatches
- capital renewal needs
- sustainability outcomes

---

## 76. Search and Filtering

Users must be able to search and filter by:

- Asset
- Asset Definition
- Asset Instance
- Lifecycle Record
- Valuation Record
- Refurbishment Record
- Impairment Record
- Retirement Record
- Disposal Record
- acquisition method
- acquisition date
- useful life
- age
- condition
- strategic classification
- operational value
- book-value reference
- market value
- replacement value
- lifecycle stage
- retirement status
- disposal method
- ownership
- warehouse
- supplier
- buyer
- date range
- approval status
- Finance status

---

## 77. Reporting

Required reports include:

- Asset age profile
- useful-life expiry
- acquisition cost
- replacement value
- market value
- insured value
- book-value reconciliation
- depreciation schedule reference
- maintenance-to-value ratio
- utilisation-to-value ratio
- lifecycle profitability
- impairment history
- refurbishment history
- replacement forecast
- retirement pipeline
- disposal pipeline
- disposal proceeds
- disposal cost
- gains and losses reference
- salvage recovery
- sustainability outcomes
- obsolete asset exposure
- underinsured asset exposure

---

## 78. Procurement Integration

Procurement may receive demand from:

- Approved replacement plans
- capital renewal
- refurbishment parts
- replacement due to obsolescence
- replacement due to regulation
- replacement due to disposal
- portfolio expansion

The originating lifecycle and approval references must remain linked.

---

## 79. Commercial Workspace Integration

Commercial Workspace may receive lifecycle information relating to:

- Asset sale
- trade-in
- supplier buyback
- client transfer
- donation approval
- external refurbishment
- disposal contract
- recycler appointment
- auction provider
- related-party disposal
- recovery from client or supplier

Commercial actions require approval.

---

## 80. Warehouse Integration

Warehouse Management must reflect:

- Retirement holding locations
- sale holding
- disposal holding
- salvage areas
- hazardous holding
- buyer collection zones
- external disposal custody
- dismantling locations
- returned-to-owner status

Every physical movement must remain auditable.

---

## 81. Reservation Integration

Assets in the following stages must be excluded from new reservations:

- Retired
- Held for Sale
- Held for Disposal
- Disposed
- Returned to Owner
- Archived

Assets Under Refurbishment or Held for Review may be available only under explicit rules.

---

## 82. Maintenance Integration

Maintenance must provide lifecycle decisions with:

- Repair history
- downtime
- repeated failures
- cost
- refurbishment potential
- parts availability
- remaining-life estimate
- condition
- safety
- repair-versus-replace recommendation

Lifecycle decisions must not ignore unresolved safety issues.

---

## 83. QR Tracking Integration

QR Tracking must support:

- Retirement scan
- movement into retirement holding
- transfer to buyer
- transfer to recycler
- salvage dismantling
- destruction confirmation
- return to owner
- QR revocation
- custody evidence

QR activity does not replace disposal approval.

---

## 84. Finance Integration

Finance may provide:

- Book value
- accumulated depreciation
- depreciation method
- capital additions
- impairment amount
- disposal gain or loss
- tax treatment
- ledger references
- accounting status

EventOS may display these values subject to permission.

Finance remains authoritative.

---

## 85. AI Assistance

AI may assist by:

- Forecasting end of life
- identifying replacement candidates
- detecting underutilised assets
- recommending refurbishment
- estimating market value
- comparing repair versus replacement
- identifying obsolescence
- proposing disposal groups
- estimating disposal proceeds
- identifying insurance mismatches
- optimising capital renewal plans

AI may not:

- Change accounting values
- approve impairment
- approve retirement
- approve disposal
- select a buyer
- set a sale price
- approve a related-party transaction
- write off an asset
- commit Finance entries

without authorised operator approval.

---

## 86. Roles and Permissions

Minimum permission groups:

- View Lifecycle Data
- Create Acquisition Records
- Confirm Commissioning
- Edit Useful-Life Assumptions
- Create Valuation Records
- Approve Operational Valuations
- View Book Values
- Manage Depreciation References
- Create Refurbishment Records
- Create Impairment Reviews
- Approve Operational Impairment Recommendation
- Create Replacement Candidates
- Approve Replacement Planning
- Propose Retirement
- Approve Retirement
- Create Disposal Records
- Approve Disposal
- Execute Disposal
- Record Disposal Proceeds
- Manage Salvage
- Revoke Asset QR
- Confirm Data Erasure
- View Disposal Financials
- Manage Lifecycle Policies
- View Portfolio Analytics

Permissions may be restricted by:

- Business
- asset category
- ownership
- asset value
- warehouse
- disposal method
- buyer
- Finance role
- related-party status
- environmental risk
- security classification

---

## 87. Audit Requirements

EventOS must retain an immutable audit history for:

- Acquisition creation
- commissioning
- useful-life changes
- residual-value changes
- valuation creation
- valuation approval
- depreciation-policy reference changes
- capital-improvement classification
- refurbishment
- impairment review
- replacement recommendation
- retirement proposal
- retirement approval
- removal from service
- disposal proposal
- disposal approval
- sale
- transfer
- recycling
- salvage
- destruction
- data erasure
- QR revocation
- proceeds
- disposal cost
- custody transfer
- Finance handover
- manual override
- AI recommendation accepted or rejected

Each audit entry must contain:

- User
- Timestamp
- Asset
- Related lifecycle record
- Previous state
- New state
- Value before
- Value after
- Reason
- Approval reference
- Evidence
- Finance reference where applicable
- Custody context
- Disposal party where applicable

---

## 88. Locked Business Rules

**AM-LVD-001**  
Acquisition, commissioning, useful life, valuation, depreciation, impairment, retirement, write-off and disposal must remain separate data concepts.

**AM-LVD-002**  
Every serialized asset must retain one permanent Lifecycle Record.

**AM-LVD-003**  
Asset retirement does not automatically constitute disposal.

**AM-LVD-004**  
Disposal does not automatically determine Finance accounting treatment.

**AM-LVD-005**  
EventOS may model depreciation, but Finance remains authoritative for statutory depreciation and ledger posting.

**AM-LVD-006**  
Operational value, market value, replacement value, insured value and book value must remain separately identified.

**AM-LVD-007**  
Indicative valuations may not be presented as approved accounting values.

**AM-LVD-008**  
Useful-life, residual-value and valuation changes must preserve complete prior versions.

**AM-LVD-009**  
A capital improvement classification requires Finance review before capitalisation.

**AM-LVD-010**  
Refurbishment completion does not automatically authorise Return to Service.

**AM-LVD-011**  
An impairment recommendation does not itself create an accounting impairment.

**AM-LVD-012**  
An asset may not be retired while active reservations, allocations, deployments or unresolved custody obligations remain, except for immediate safety removal.

**AM-LVD-013**  
A retired asset must be excluded from new reservation and allocation.

**AM-LVD-014**  
A disposal action requires approved ownership, retirement and disposal authority.

**AM-LVD-015**  
An asset may not be marked Disposed while custody, ownership transfer or required evidence remains unresolved.

**AM-LVD-016**  
Write-off approval, disposal execution and Finance accounting entries must remain separate controlled actions.

**AM-LVD-017**  
Disposal proceeds, trade-in allowance, insurance recovery and supplier recovery must remain separately classified.

**AM-LVD-018**  
Serialized assets dismantled for salvage must preserve parent-component lineage.

**AM-LVD-019**  
Data-bearing assets may not complete disposal until required data sanitisation is verified.

**AM-LVD-020**  
Hazardous assets and materials must follow approved disposal and evidence requirements.

**AM-LVD-021**  
Active QR identities must be revoked when operational ownership or control permanently ends.

**AM-LVD-022**  
Asset identity and lifecycle history must remain permanently available after retirement and disposal.

**AM-LVD-023**  
Assets under legal, insurance, ownership or audit hold may not be sold, transferred, dismantled or destroyed.

**AM-LVD-024**  
Related-party disposal requires declared relationship, independent pricing support and enhanced approval.

**AM-LVD-025**  
Operational users may propose disposal pricing but may not commit sale, donation, transfer or disposal terms without approval.

**AM-LVD-026**  
Disposal evidence must be proportionate to asset value, environmental risk, security risk and legal requirements.

**AM-LVD-027**  
Replacement planning must consider operational demand, lifecycle cost, condition, reliability and procurement lead time.

**AM-LVD-028**  
Assets classified as obsolete may remain operational only where use remains safe, approved and commercially justified.

**AM-LVD-029**  
Sustainability metrics must disclose their calculation method and source data.

**AM-LVD-030**  
AI may assist with lifecycle forecasts, valuation estimates and recommendations but may not approve impairment, retirement, disposal, pricing or accounting treatment without authorised operator approval.

---

## 89. Completion Criteria

Asset Lifecycle, Valuation, Depreciation and Disposal is complete when EventOS can:

- Maintain permanent Lifecycle Records.
- capture acquisition and commissioning.
- manage useful-life and residual-value assumptions.
- store operational, market, replacement, insured and Finance-provided values.
- reference Finance depreciation policies and schedules.
- manage component depreciation references.
- record capital improvements and major refurbishments.
- perform impairment reviews.
- evaluate operational value and strategic importance.
- calculate transparent utilisation, cost and lifecycle analytics.
- create replacement candidates and portfolio renewal plans.
- forecast asset end of life.
- propose and approve asset retirement.
- remove assets safely from operational availability.
- manage temporary retirement.
- create and control Disposal Records.
- support sale, auction, trade-in, donation, recycling, salvage and destruction.
- manage hazardous and data-bearing asset disposal.
- retain custody throughout disposal.
- capture disposal proceeds, costs and evidence.
- revoke operational QR identities.
- hand completed lifecycle events to Finance.
- report on replacement, retirement, disposal, sustainability and portfolio health.
- preserve a complete lifecycle and disposal audit trail.

---

## Section 09.10 — Asset Analytics, Governance and Module Closure

---

# 1. Purpose

Asset Analytics, Governance and Module Closure establishes the enterprise-wide governance framework for Asset Management within EventOS.

It defines:

- Asset governance
- Operational analytics
- Executive reporting
- Compliance
- Data quality
- Security
- Risk management
- Performance measurement
- Cross-module integration
- Long-term operational intelligence

This section completes the Asset Management architecture and defines how Asset Management becomes a trusted enterprise system rather than simply an inventory application.

---

# 2. Architectural Philosophy

Asset Management exists to support Event Design.

Everything begins with the Event Design.

```
Client Brief

↓

Event Design

↓

Requirement Engine

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

Asset Management never exists independently.

Its purpose is to fulfil approved Event Designs with maximum operational efficiency while preserving asset value.

---

# 3. Governance Objectives

The governance model shall ensure:

- Complete asset traceability
- Accurate availability
- High data integrity
- Controlled financial exposure
- Controlled operational risk
- Regulatory compliance
- Complete auditability
- Scalable operations
- Reliable executive reporting
- Continuous operational improvement

---

# 4. Governance Layers

Governance operates across five layers:

### Layer 1 — Asset Identity

Identity integrity.

### Layer 2 — Operational Control

Movement, custody and utilisation.

### Layer 3 — Lifecycle Management

Maintenance, condition and retirement.

### Layer 4 — Commercial Governance

Ownership, procurement and recovery.

### Layer 5 — Strategic Governance

Investment, portfolio optimisation and analytics.

---

# 5. Asset Governance Principles

EventOS shall govern assets according to the following principles.

### Principle 1

Every asset has one identity.

### Principle 2

Every movement is traceable.

### Principle 3

Every custody transfer is auditable.

### Principle 4

Availability is calculated.

Never manually assumed.

### Principle 5

Asset history is immutable.

### Principle 6

Operational decisions are evidence-based.

### Principle 7

Financial decisions require appropriate approval.

### Principle 8

AI advises.

Humans approve.

---

# 6. Enterprise Asset Visibility

Authorised users shall be able to determine at any time:

- Asset location
- Asset condition
- Asset owner
- Current custodian
- Reservation status
- Deployment status
- Maintenance status
- Lifecycle stage
- Financial references
- Event assignment

within seconds.

---

# 7. Enterprise Search

Enterprise Asset Search shall support searching by:

- Asset ID
- QR Code
- Barcode
- RFID (future)
- Manufacturer Serial Number
- Asset Name
- Asset Category
- Asset Family
- Asset Group
- Asset Type
- Warehouse
- Venue
- Client
- Supplier
- Event
- Requirement Item
- Design Element
- Purchase Order
- Invoice
- Maintenance Work Order
- Inspection Record
- Damage Record
- Disposal Record
- Current Custodian
- Vehicle
- Kit
- Packing Unit
- Container
- GPS reference (where available)

Search results must remain permission-aware.

---

# 8. Enterprise Dashboards

Asset dashboards shall support multiple operational levels.

Examples:

### Executive Dashboard

- Portfolio Value
- Availability
- Utilisation
- Asset Health
- Replacement Forecast
- Maintenance Cost
- Damage Trends

---

### Operations Dashboard

- Available Assets
- Current Deployments
- Vehicles in Transit
- Warehouse Activity
- Active Picking
- Active Packing
- Current Exceptions

---

### Warehouse Dashboard

- Receiving
- Picking
- Staging
- Dispatch
- Returns
- Quarantine
- Inventory Accuracy

---

### Event Dashboard

- Assets Delivered
- Setup Progress
- Missing Assets
- Damaged Assets
- Active Replacements

---

### Maintenance Dashboard

- Open Work Orders
- Due Maintenance
- Quarantined Assets
- Failed Inspections
- Parts Waiting

---

### Commercial Dashboard

- Client Damage
- Supplier Claims
- Asset Recovery
- Replacement Costs
- Insurance Cases

---

# 9. Operational KPIs

The platform shall calculate operational KPIs including:

### Asset Availability

Percentage available.

---

### Asset Utilisation

Hours or days used.

---

### Reservation Fulfilment

Successful reservations.

---

### Deployment Accuracy

Correct deployment.

---

### Picking Accuracy

Correctly picked assets.

---

### Packing Accuracy

Correctly packed assets.

---

### Dispatch Accuracy

Correctly dispatched loads.

---

### Delivery Accuracy

Correct deliveries.

---

### Inventory Accuracy

Expected versus actual inventory.

---

### Return Accuracy

Returned correctly.

---

### Maintenance Compliance

Completed on time.

---

### Inspection Compliance

Inspection completion percentage.

---

### Asset Downtime

Unavailable hours.

---

### Damage Frequency

Damage rate.

---

### Loss Frequency

Missing and lost rate.

---

### Recovery Rate

Recovered assets.

---

### Repair Success

Successful repairs.

---

### Mean Time Between Failures

MTBF.

---

### Mean Time To Repair

MTTR.

---

### Replacement Rate

Replacement frequency.

---

### Disposal Rate

Assets retired.

---

# 10. Strategic KPIs

Strategic reporting shall include:

- Asset Portfolio Growth
- Asset Portfolio Age
- Portfolio Risk
- Capital Replacement Forecast
- Asset Profitability
- Cost per Event
- Revenue per Asset
- Revenue per Category
- Maintenance Cost Trend
- Damage Cost Trend
- Logistics Cost Trend
- Asset Health Trend
- Asset ROI
- Supplier Reliability
- Replacement Pipeline
- Sustainability Metrics

---

# 11. Asset Scorecards

Each Asset Instance may display a consolidated scorecard.

Typical sections:

- Identity
- Current Status
- Current Location
- Condition
- Utilisation
- Maintenance
- Damage
- Financial Summary
- Lifecycle
- Current Event
- Current Custodian
- Risk
- Asset Health Score

The scorecard is read-only and aggregates data from across the platform.

---

# 12. Executive Portfolio Analysis

Executives shall be able to analyse assets by:

- Business
- Division
- Warehouse
- Region
- Country
- Asset Family
- Supplier
- Category
- Strategic Classification
- Event Type
- Client Type
- Age
- Value
- Profitability

---

# 13. Data Quality Framework

Asset data quality shall be continuously measured.

Metrics include:

- Missing QR labels
- Duplicate identities
- Missing serial numbers
- Missing photographs
- Missing ownership
- Missing location
- Invalid lifecycle stage
- Invalid warehouse assignment
- Missing inspection
- Missing maintenance
- Missing approvals

---

# 14. Data Integrity Rules

The platform shall continuously validate:

- Duplicate Asset IDs
- Duplicate QR Codes
- Invalid relationships
- Invalid warehouse locations
- Invalid reservation links
- Invalid custody
- Broken audit references
- Missing mandatory data
- Circular relationships
- Orphan records

Integrity failures generate governance exceptions.

---

# 15. Governance Exceptions

Examples:

- Duplicate identity
- Asset without owner
- Asset without warehouse
- Asset without location
- Unknown custodian
- Reservation inconsistency
- Deployment inconsistency
- Financial mismatch
- Missing disposal approval
- Missing maintenance approval

---

# 16. Compliance Monitoring

Compliance monitoring includes:

- Inspection compliance
- Maintenance compliance
- Certification compliance
- Calibration compliance
- Safety compliance
- Ownership compliance
- Audit compliance
- Regulatory compliance

---

# 17. Risk Monitoring

Operational risks include:

- High-value assets deployed
- High-value assets missing
- Overdue maintenance
- Overdue inspections
- Critical failures
- High damage trends
- Theft hotspots
- Inventory shrinkage
- Supplier dependency
- Capacity shortages

---

# 18. Audit Governance

Every Asset Management action shall remain permanently auditable.

Audit entries shall never be physically deleted.

Audit records shall remain immutable.

Only authorised archival procedures may move historical audit data into long-term storage.

---

# 19. Historical Preservation

Historical information shall survive:

- Asset retirement
- Disposal
- Write-off
- Supplier changes
- Client changes
- Warehouse closure
- Business restructuring

Historical reporting must remain possible decades later.

---

# 20. Data Retention

Retention policies may vary by:

- Operational records
- Financial records
- Regulatory requirements
- Legal requirements
- Country
- Industry

Deletion policies must never violate legal retention requirements.

---

# 21. Archiving

Archived assets shall remain searchable.

Archived assets shall not participate in:

- Reservations
- Availability
- Picking
- Logistics
- Deployment

unless explicitly restored.

---

# 22. Business Continuity

Asset Management must support:

- Backup
- Disaster Recovery
- Offline Warehouse Operations
- Offline QR Scanning
- Offline Deployment
- Synchronisation

No asset history may be lost due to temporary connectivity loss.

---

# 23. Security

Asset information shall be protected by:

- Role permissions
- Business isolation
- Warehouse permissions
- Event permissions
- Financial permissions
- Approval permissions
- Audit permissions

Sensitive information shall be masked where appropriate.

---

# 24. Segregation of Duties

The platform should support separation of critical responsibilities.

Examples:

A user who approves a write-off should not be the same user who executes disposal where policy requires separation.

Likewise, maintenance verification, financial approvals and high-value asset releases may require independent reviewers.

Segregation rules should be configurable to suit different organisations.

---

# 25. Multi-Business Governance

Multiple ClientOS businesses operating within EventOS shall maintain:

- Separate ownership
- Separate inventory
- Separate warehouses
- Separate approvals
- Separate reporting
- Separate financial references

Cross-business transfers require approved transfer workflows.

---

# 26. Global Scalability

Asset Management shall support:

- Multiple countries
- Multiple currencies
- Multiple languages
- Multiple tax jurisdictions
- Multiple legal entities
- Multiple warehouse networks

without architectural redesign.

---

# 27. AI Governance

AI may analyse:

- Utilisation
- Maintenance
- Asset Health
- Portfolio Risk
- Replacement Forecast
- Procurement Needs
- Logistics
- Demand Trends

AI shall explain significant recommendations with supporting data where practical.

AI recommendations should be traceable so operators can review why a suggestion was made.

---

# 28. Cross-Module Integration Summary

Asset Management integrates with:

### Event Design

Consumes approved design requirements.

---

### Requirement Engine

Consumes fulfilment requirements.

---

### Procurement Studio

Receives purchased assets.

Creates replacement demand.

---

### Commercial Workspace

Supports pricing, claims, recovery and client changes.

---

### Logistics

Controls movement.

---

### Execution

Controls deployment.

---

### Finance

Provides operational evidence.

Receives financial references.

---

### Marketplace

Supports supplier-owned assets where applicable.

---

# 29. Asset Module Boundaries

Asset Management is responsible for:

- Identity
- Availability
- Storage
- Reservation
- Movement
- Custody
- Deployment
- Inspection
- Maintenance
- Lifecycle
- Operational reporting

Asset Management is **not** responsible for:

- Event Design
- Client approvals
- Quotation generation
- Procurement negotiation
- Accounting
- Payroll
- CRM

Those remain within their respective modules.

---

# 30. Future Expansion

The architecture intentionally allows future modules to extend Asset Management without redesign.

Potential future capabilities include:

- IoT-enabled smart assets
- BLE/UWB real-time location tracking
- Autonomous warehouse robotics
- Drone-assisted inventory counting
- RFID support
- Predictive spare-parts optimisation
- Carbon-footprint optimisation
- Digital twin visualisation
- Computer-vision verification
- Automated warehouse storage systems

These extensions must integrate through existing Asset Identity, Custody and Lifecycle models.

---

# 31. Module Completion Statement

Asset Management is now architecturally complete.

The module provides an end-to-end enterprise asset management capability covering:

- Asset creation and identity
- Warehousing
- Reservation and allocation
- Picking, packing and staging
- Logistics and transport
- Event deployment
- Inspection and maintenance
- Damage and loss management
- Lifecycle management
- Valuation and disposal
- Enterprise governance
- Executive analytics

Every physical asset can now be traced from acquisition to final disposal while maintaining complete operational, commercial and historical integrity.

---

# 32. Locked Business Rules

**AM-GOV-001**  
Every operational asset shall have a complete, traceable lifecycle from acquisition through disposal.

**AM-GOV-002**  
Asset availability shall always be system-calculated from current operational state and shall not be manually overridden except through authorised administrative controls with a full audit trail.

**AM-GOV-003**  
Every asset movement, custody transfer, condition change and lifecycle event shall be permanently auditable.

**AM-GOV-004**  
Historical asset records shall remain available after retirement, disposal, write-off or archival.

**AM-GOV-005**  
Operational analytics shall be derived from transactional data and shall not alter operational records.

**AM-GOV-006**  
Governance dashboards shall present read-only consolidated information and shall not permit transactional changes.

**AM-GOV-007**  
Asset Management shall remain the authoritative operational source for asset identity, location, custody, condition and utilisation.

**AM-GOV-008**  
Finance shall remain the authoritative source for statutory accounting values and financial postings.

**AM-GOV-009**  
Cross-module integrations shall preserve ownership of data within the originating module.

**AM-GOV-010**  
Data integrity validation shall execute continuously and record governance exceptions without modifying operational data automatically.

**AM-GOV-011**  
Archived assets shall remain historically accessible while being excluded from operational workflows unless formally restored.

**AM-GOV-012**  
Role-based security and configurable segregation of duties shall be enforced for governance-sensitive operations.

**AM-GOV-013**  
Multi-business isolation shall preserve operational, commercial and financial independence between ClientOS businesses.

**AM-GOV-014**  
AI recommendations shall remain advisory, explainable where practical, and shall never perform controlled operational or commercial actions without authorised operator approval.

**AM-GOV-015**  
Asset Management shall support future technologies and tracking methods without requiring changes to the core Asset Identity, Custody or Lifecycle architecture.

---

# 33. Module 09 Completion Criteria

Module 09 — Asset Management is complete when EventOS can:

- Create and uniquely identify every asset.
- Manage warehouse storage and inventory.
- Track assets through QR-based identity and movement.
- Reserve and allocate assets to Event Designs.
- Execute picking, packing and staging operations.
- Plan and manage logistics and transport.
- Deploy and monitor assets during event execution.
- Inspect, maintain and repair assets.
- Manage damage, loss, quarantine and recovery.
- Govern asset lifecycle, valuation, retirement and disposal.
- Produce enterprise-grade analytics, governance reporting and audit trails.
- Integrate seamlessly with Event Design, Requirements, Procurement, Commercial Workspace, Execution and Finance while preserving clear ownership of responsibilities.

---

### Module 09 Summary

Module 09 transforms Asset Management from a simple inventory function into a comprehensive Enterprise Asset Management (EAM) capability purpose-built for the event industry. Every asset—whether a single serialized lighting fixture, a pallet of décor, a hired supplier item, or a client-owned installation—can be identified, reserved, transported, deployed, maintained, analysed and ultimately retired with complete traceability. This ensures that the Event Design remains fully supported throughout its physical execution, while providing executives with reliable operational intelligence and preserving a complete historical record for governance, compliance and future planning.

---

**Recovery Status:** COMPLETE  
**Next Module:** M010 — Event Execution

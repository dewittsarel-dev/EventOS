export const RESOURCE_TYPES = [
  'ASSET',
  'BULK_ITEM',
  'CONSUMABLE',
  'SERVICE',
  'STAFF',
  'VEHICLE',
  'VENUE',
] as const;

export type ResourceTypeValue = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_QUANTITY_MODES = [
  'SERIALIZED',
  'QUANTITY',
  'CAPACITY',
  'UNLIMITED',
] as const;

export type ResourceQuantityModeValue =
  (typeof RESOURCE_QUANTITY_MODES)[number];

export const RESOURCE_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'DISPATCHED',
  'MAINTENANCE',
  'DAMAGED',
  'RETIRED',
] as const;

export type ResourceStatusValue = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_VISIBILITIES = [
  'PRIVATE',
  'MARKETPLACE',
  'HIDDEN',
] as const;

export type ResourceVisibilityValue = (typeof RESOURCE_VISIBILITIES)[number];

export const RESOURCE_CONDITIONS = [
  'UNKNOWN',
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'DAMAGED',
  'RETIRED',
] as const;

export type ResourceConditionValue = (typeof RESOURCE_CONDITIONS)[number];

export const RESOURCE_RESERVATION_SOURCE_TYPES = [
  'EVENT',
  'RENTAL_ORDER',
  'MARKETPLACE_BOOKING',
  'INTERNAL_JOB',
  'MAINTENANCE',
  'MANUAL_HOLD',
] as const;

export type ResourceReservationSourceTypeValue =
  (typeof RESOURCE_RESERVATION_SOURCE_TYPES)[number];

export const RESOURCE_RESERVATION_STATUSES = [
  'DRAFT',
  'PENDING',
  'RESERVED',
  'CONFIRMED',
  'RELEASED',
  'CANCELLED',
  'EXPIRED',
  'DISPATCHED',
  'RETURNED',
] as const;

export type ResourceReservationStatusValue =
  (typeof RESOURCE_RESERVATION_STATUSES)[number];

export type ResourceRecord = {
  id: string;
  organizationId: string;
  supplierId: string | null;
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  keywords: string[];
  aiSummary: string | null;
  searchPhrases: string[];
  imageUrls: string[];
  resourceType: ResourceTypeValue;
  quantityMode: ResourceQuantityModeValue;
  sku: string | null;
  barcode: string | null;
  status: ResourceStatusValue;
  visibility: ResourceVisibilityValue;
  unit: string;
  totalQuantity: number | null;
  condition: ResourceConditionValue;
  locationId: string | null;
  locationName: string | null;
  purchaseValue: number | null;
  replacementValue: number | null;
  rentalPrice: number | null;
  damagedQuantity: number;
  maintenanceQuantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  reservedQuantity?: number;
  lostQuantity?: number;
  availableQuantity?: number;
};

export type ResourceAvailabilitySummary = {
  resourceId: string;
  totalQuantity: number;
  reservedQuantity: number;
  lostQuantity: number;
  availableQuantity: number;
};

export type ResourceReservationRecord = {
  id: string;
  organizationId: string;
  resourceId: string;
  sourceType: ResourceReservationSourceTypeValue;
  sourceId: string;
  quantity: number;
  startDateTime: string;
  endDateTime: string;
  status: ResourceReservationStatusValue;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const EVENT_RESOURCE_ALLOCATION_STATUSES = [
  'Reserved',
  'Picked',
  'InTransit',
  'OnSite',
  'Returning',
  'Returned',
  'Damaged',
  'Lost',
  'Cancelled',
] as const;

export type EventResourceAllocationStatusValue =
  (typeof EVENT_RESOURCE_ALLOCATION_STATUSES)[number];

export const EVENT_RESOURCE_OUTSTANDING_STATUSES = [
  'Open',
  'Fulfilled',
  'Cancelled',
] as const;

export type EventResourceOutstandingStatusValue =
  (typeof EVENT_RESOURCE_OUTSTANDING_STATUSES)[number];

export type EventResourceAllocationRecord = {
  id: string;
  eventId: string;
  resourceId: string;
  organizationId: string;
  quantityRequested: number;
  quantityReserved: number;
  quantityReturned: number;
  quantityDamaged: number;
  quantityLost: number;
  reservedDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: EventResourceAllocationStatusValue;
  createdByUserId: string;
  updatedByUserId: string;
  resourceReservationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventResourceOutstandingRecord = {
  id: string;
  eventId: string;
  resourceId: string;
  allocationId: string | null;
  organizationId: string;
  requestedQuantity: number;
  reservedQuantity: number;
  outstandingQuantity: number;
  status: EventResourceOutstandingStatusValue;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type EventResourceRequestInput = {
  resourceId: string;
  quantity: number;
  reservedDate?: string;
  expectedReturnDate?: string;
  allowPartial?: boolean;
  notes?: string;
};

export type ReserveResourcesForEventInput = {
  actorUserId: string;
  organizationId: string;
  eventId: string;
  requests: EventResourceRequestInput[];
};

export type ReserveResourcesForEventResult = {
  allocations: EventResourceAllocationRecord[];
  outstandings: EventResourceOutstandingRecord[];
};

export type ReleaseEventAllocationsInput = {
  actorUserId: string;
  organizationId: string;
  eventId: string;
  reason: 'Completed' | 'Cancelled';
};

export type AvailabilityConflictInfo = {
  requestedQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  conflictingReservationIds: string[];
  conflictStartDateTime: string;
  conflictEndDateTime: string;
  earliestNextAvailability: string | null;
};

export type ResourceAvailabilitySnapshot = {
  resourceId: string;
  quantityMode: ResourceQuantityModeValue;
  requestable: boolean;
  confirmationRequired: boolean;
  requestedQuantity: number;
  availableQuantity: number | null;
  reservedQuantity: number | null;
  canFulfill: boolean;
  conflict: AvailabilityConflictInfo | null;
};

export type AvailabilityCalendarEntry = {
  startDateTime: string;
  endDateTime: string;
  reservedQuantity: number;
  availableQuantity: number | null;
};

export type AvailabilityCalendarResult = {
  resourceId: string;
  quantityMode: ResourceQuantityModeValue;
  from: string;
  to: string;
  entries: AvailabilityCalendarEntry[];
};

export type CreateResourceInput = {
  actorUserId: string;
  organizationId: string;
  supplierId?: string | null;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  keywords?: string[];
  aiSummary?: string;
  searchPhrases?: string[];
  imageUrls?: string[];
  resourceType: ResourceTypeValue;
  quantityMode: ResourceQuantityModeValue;
  sku?: string;
  barcode?: string;
  status?: ResourceStatusValue;
  visibility?: ResourceVisibilityValue;
  unit: string;
  totalQuantity?: number | null;
  condition?: ResourceConditionValue;
  locationId?: string | null;
  purchaseValue?: number | null;
  replacementValue?: number | null;
  rentalPrice?: number | null;
  damagedQuantity?: number;
  maintenanceQuantity?: number;
  notes?: string;
};

export type UpdateResourceInput = {
  actorUserId: string;
  resourceId: string;
  supplierId?: string | null;
  name?: string;
  description?: string | null;
  category?: string;
  tags?: string[];
  keywords?: string[];
  aiSummary?: string | null;
  searchPhrases?: string[];
  imageUrls?: string[];
  resourceType?: ResourceTypeValue;
  quantityMode?: ResourceQuantityModeValue;
  sku?: string | null;
  barcode?: string | null;
  status?: ResourceStatusValue;
  visibility?: ResourceVisibilityValue;
  unit?: string;
  totalQuantity?: number | null;
  condition?: ResourceConditionValue;
  locationId?: string | null;
  purchaseValue?: number | null;
  replacementValue?: number | null;
  rentalPrice?: number | null;
  damagedQuantity?: number;
  maintenanceQuantity?: number;
  notes?: string | null;
};

export type ArchiveResourceInput = {
  actorUserId: string;
  resourceId: string;
};

export type RestoreResourceInput = {
  actorUserId: string;
  resourceId: string;
};

export type SearchResourcesInput = {
  actorUserId: string;
  organizationId: string;
  query?: string;
  category?: string;
  tags?: string;
  keywords?: string;
  supplierId?: string;
  resourceType?: ResourceTypeValue;
  quantityMode?: ResourceQuantityModeValue;
  status?: ResourceStatusValue;
  visibility?: ResourceVisibilityValue;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
};

export type GetResourceInput = {
  actorUserId: string;
  resourceId: string;
};

export type CheckAvailabilityInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
  startDateTime: string;
  endDateTime: string;
  quantity: number;
};

export type CreateReservationInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
  sourceType: ResourceReservationSourceTypeValue;
  sourceId: string;
  quantity: number;
  startDateTime: string;
  endDateTime: string;
  status?: ResourceReservationStatusValue;
  notes?: string;
};

export type UpdateReservationInput = {
  actorUserId: string;
  reservationId: string;
  quantity?: number;
  startDateTime?: string;
  endDateTime?: string;
  status?: ResourceReservationStatusValue;
  notes?: string | null;
};

export type ConfirmReservationInput = {
  actorUserId: string;
  reservationId: string;
  notes?: string;
};

export type ReleaseReservationInput = {
  actorUserId: string;
  reservationId: string;
  notes?: string;
};

export type CancelReservationInput = {
  actorUserId: string;
  reservationId: string;
  notes?: string;
};

export type GetReservationsForResourceInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
  from?: string;
  to?: string;
};

export type GetReservationsForSourceInput = {
  actorUserId: string;
  organizationId: string;
  sourceType: ResourceReservationSourceTypeValue;
  sourceId: string;
};

export type GetEventResourceAllocationsInput = {
  actorUserId: string;
  organizationId: string;
  eventId: string;
};

export type GetResourceAllocationHistoryInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
};

export type GetResourceAvailabilitySummaryInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
};

export type GetAvailabilityCalendarInput = {
  actorUserId: string;
  organizationId: string;
  resourceId: string;
  from: string;
  to: string;
};

export type ResourceSearchResult = {
  data: ResourceRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

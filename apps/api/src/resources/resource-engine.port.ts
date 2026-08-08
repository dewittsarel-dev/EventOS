import type { CapabilityActionDefinition } from '../capabilities/capability.types';
import type {
  ArchiveResourceInput,
  AvailabilityCalendarResult,
  CancelReservationInput,
  CheckAvailabilityInput,
  ConfirmReservationInput,
  EventResourceAllocationRecord,
  GetEventResourceAllocationsInput,
  GetResourceAllocationHistoryInput,
  GetResourceAvailabilitySummaryInput,
  ReleaseEventAllocationsInput,
  CreateResourceInput,
  CreateReservationInput,
  GetAvailabilityCalendarInput,
  GetReservationsForResourceInput,
  GetReservationsForSourceInput,
  GetResourceInput,
  ReleaseReservationInput,
  ReserveResourcesForEventInput,
  ReserveResourcesForEventResult,
  ResourceReservationRecord,
  ResourceAvailabilitySnapshot,
  ResourceAvailabilitySummary,
  ResourceRecord,
  ResourceSearchResult,
  RestoreResourceInput,
  SearchResourcesInput,
  UpdateReservationInput,
  UpdateResourceInput,
} from './resource.types';

export interface ResourceEnginePort {
  listSupportedActions(): CapabilityActionDefinition[];
  createResource(input: CreateResourceInput): Promise<ResourceRecord>;
  updateResource(input: UpdateResourceInput): Promise<ResourceRecord>;
  archiveResource(input: ArchiveResourceInput): Promise<ResourceRecord>;
  restoreResource(input: RestoreResourceInput): Promise<ResourceRecord>;
  searchResources(input: SearchResourcesInput): Promise<ResourceSearchResult>;
  getResource(input: GetResourceInput): Promise<ResourceRecord>;
  checkAvailability(
    input: CheckAvailabilityInput,
  ): Promise<ResourceAvailabilitySnapshot>;
  createReservation(
    input: CreateReservationInput,
  ): Promise<ResourceReservationRecord>;
  updateReservation(
    input: UpdateReservationInput,
  ): Promise<ResourceReservationRecord>;
  confirmReservation(
    input: ConfirmReservationInput,
  ): Promise<ResourceReservationRecord>;
  releaseReservation(
    input: ReleaseReservationInput,
  ): Promise<ResourceReservationRecord>;
  cancelReservation(
    input: CancelReservationInput,
  ): Promise<ResourceReservationRecord>;
  getReservationsForResource(
    input: GetReservationsForResourceInput,
  ): Promise<ResourceReservationRecord[]>;
  getReservationsForSource(
    input: GetReservationsForSourceInput,
  ): Promise<ResourceReservationRecord[]>;
  getAvailabilityCalendar(
    input: GetAvailabilityCalendarInput,
  ): Promise<AvailabilityCalendarResult>;
  reserveResourcesForEvent(
    input: ReserveResourcesForEventInput,
  ): Promise<ReserveResourcesForEventResult>;
  getEventResourceAllocations(
    input: GetEventResourceAllocationsInput,
  ): Promise<EventResourceAllocationRecord[]>;
  getResourceAllocationHistory(
    input: GetResourceAllocationHistoryInput,
  ): Promise<EventResourceAllocationRecord[]>;
  getResourceAvailabilitySummary(
    input: GetResourceAvailabilitySummaryInput,
  ): Promise<ResourceAvailabilitySummary>;
  releaseEventAllocations(
    input: ReleaseEventAllocationsInput,
  ): Promise<EventResourceAllocationRecord[]>;
}

export const RESOURCE_ENGINE_PORT = Symbol('RESOURCE_ENGINE_PORT');

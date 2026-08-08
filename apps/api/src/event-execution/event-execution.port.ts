import type { CapabilityActionDefinition } from '../capabilities/capability.types';
import type {
  ArchiveEventExecutionInput,
  AssignEventTasksInput,
  BuildEventExecutionPlanInput,
  CancelEventExecutionInput,
  CollectEventExecutionInput,
  CompleteEventExecutionInput,
  CreateEventExecutionInput,
  DispatchEventExecutionInput,
  EventExecutionAvailabilityEffect,
  EventExecutionRecord,
  GenerateEventPurchaseOrdersInput,
  GenerateSupplierBookingsInput,
  ReleaseEventResourcesInput,
  ReserveEventResourcesInput,
} from './event-execution.types';

export interface EventExecutionPort {
  listSupportedActions(): CapabilityActionDefinition[];
  createExecution(
    input: CreateEventExecutionInput,
  ): Promise<EventExecutionRecord>;
  buildExecutionPlan(
    input: BuildEventExecutionPlanInput,
  ): Promise<EventExecutionRecord>;
  reserveResources(
    input: ReserveEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect>;
  releaseResources(
    input: ReleaseEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect>;
  generatePurchaseOrders(
    input: GenerateEventPurchaseOrdersInput,
  ): Promise<EventExecutionAvailabilityEffect>;
  generateSupplierBookings(
    input: GenerateSupplierBookingsInput,
  ): Promise<EventExecutionAvailabilityEffect>;
  assignTasks(
    input: AssignEventTasksInput,
  ): Promise<EventExecutionAvailabilityEffect>;
  dispatch(input: DispatchEventExecutionInput): Promise<EventExecutionRecord>;
  collect(input: CollectEventExecutionInput): Promise<EventExecutionRecord>;
  complete(input: CompleteEventExecutionInput): Promise<EventExecutionRecord>;
  cancel(input: CancelEventExecutionInput): Promise<EventExecutionRecord>;
  archive(input: ArchiveEventExecutionInput): Promise<EventExecutionRecord>;
}

export const EVENT_EXECUTION_PORT = Symbol('EVENT_EXECUTION_PORT');

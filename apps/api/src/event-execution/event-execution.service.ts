import { Injectable, NotImplementedException } from '@nestjs/common';
import type { CapabilityActionDefinition } from '../capabilities/capability.types';
import { eventExecutionCapabilityActions } from './event-execution-capability.actions';
import type { EventExecutionPort } from './event-execution.port';
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

const PHASE_ONE_MESSAGE =
  'EVENT EXECUTION ENGINE - PHASE 1 provides architecture contracts only. Workflow persistence and execution are not implemented yet.';

@Injectable()
export class EventExecutionService implements EventExecutionPort {
  listSupportedActions(): CapabilityActionDefinition[] {
    return eventExecutionCapabilityActions.map((action) => ({ ...action }));
  }

  createExecution(
    input: CreateEventExecutionInput,
  ): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  buildExecutionPlan(
    input: BuildEventExecutionPlanInput,
  ): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  reserveResources(
    input: ReserveEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    return this.notImplemented(input);
  }

  releaseResources(
    input: ReleaseEventResourcesInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    return this.notImplemented(input);
  }

  generatePurchaseOrders(
    input: GenerateEventPurchaseOrdersInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    return this.notImplemented(input);
  }

  generateSupplierBookings(
    input: GenerateSupplierBookingsInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    return this.notImplemented(input);
  }

  assignTasks(
    input: AssignEventTasksInput,
  ): Promise<EventExecutionAvailabilityEffect> {
    return this.notImplemented(input);
  }

  dispatch(input: DispatchEventExecutionInput): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  collect(input: CollectEventExecutionInput): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  complete(input: CompleteEventExecutionInput): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  cancel(input: CancelEventExecutionInput): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  archive(input: ArchiveEventExecutionInput): Promise<EventExecutionRecord> {
    return this.notImplemented(input);
  }

  private notImplemented<T>(input: unknown): Promise<T> {
    void input;
    return Promise.reject(new NotImplementedException(PHASE_ONE_MESSAGE));
  }
}

import type {
  CapabilityActionDefinition,
  CapabilityName,
} from './capability.types';

export type AiCapabilityInvocationRequest = {
  capability: CapabilityName;
  action: string;
  organizationId: string;
  actorId?: string;
  payload: Record<string, unknown>;
};

export interface AiServicePort {
  listActions(capability?: CapabilityName): CapabilityActionDefinition[];
  invoke(request: AiCapabilityInvocationRequest): Promise<unknown>;
}

export const AI_SERVICE_PORT = Symbol('AI_SERVICE_PORT');

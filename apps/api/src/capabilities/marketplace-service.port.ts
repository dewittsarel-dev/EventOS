import type {
  CapabilityActionDefinition,
  CapabilityName,
} from './capability.types';

export type MarketplaceDispatchRequest = {
  capability: CapabilityName;
  action: string;
  organizationId: string;
  payload: Record<string, unknown>;
};

export interface MarketplaceServicePort {
  listPublishedActions(
    capability?: CapabilityName,
  ): CapabilityActionDefinition[];
  dispatch(request: MarketplaceDispatchRequest): Promise<unknown>;
}

export const MARKETPLACE_SERVICE_PORT = Symbol('MARKETPLACE_SERVICE_PORT');

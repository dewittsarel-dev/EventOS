import { Injectable } from '@nestjs/common';
import { capabilityCatalog } from './capability-catalog';
import type {
  CapabilityActionDefinition,
  CapabilityDescriptor,
  CapabilityName,
} from './capability.types';

@Injectable()
export class CapabilityRegistryService {
  listCapabilities(): CapabilityDescriptor[] {
    return capabilityCatalog.map((entry) => ({
      ...entry,
      actions: entry.actions.map((action) => ({ ...action })),
    }));
  }

  describeCapability(name: CapabilityName): CapabilityDescriptor | null {
    const match = capabilityCatalog.find((entry) => entry.name === name);
    if (!match) {
      return null;
    }

    return {
      ...match,
      actions: match.actions.map((action) => ({ ...action })),
    };
  }

  listActions(capability?: CapabilityName): CapabilityActionDefinition[] {
    const source = capability
      ? capabilityCatalog.filter((entry) => entry.name === capability)
      : capabilityCatalog;

    return source.flatMap((entry) =>
      entry.actions.map((action) => ({ ...action })),
    );
  }
}

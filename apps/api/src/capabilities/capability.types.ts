export const CAPABILITY_NAMES = [
  'Event',
  'EventExecution',
  'Inventory',
  'Resource',
  'Marketplace',
  'Booking',
  'PurchaseOrder',
  'Quote',
  'Client',
  'Transaction',
] as const;

export type CapabilityName = (typeof CAPABILITY_NAMES)[number];

export const CAPABILITY_CONSUMERS = [
  'manual-ui',
  'guided-wizard',
  'ai',
  'marketplace',
  'mobile-app',
] as const;

export type CapabilityConsumer = (typeof CAPABILITY_CONSUMERS)[number];

export type CapabilityActionDefinition = {
  capability: CapabilityName;
  action: string;
  description: string;
  consumers: CapabilityConsumer[];
};

export type CapabilityDescriptor = {
  name: CapabilityName;
  description: string;
  actions: CapabilityActionDefinition[];
};

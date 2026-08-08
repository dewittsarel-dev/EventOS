import type { CapabilityActionDefinition } from '../capabilities/capability.types';

const eventExecutionConsumers = [
  'manual-ui',
  'guided-wizard',
  'ai',
  'marketplace',
  'mobile-app',
] as const;

export const eventExecutionCapabilityActions: CapabilityActionDefinition[] = [
  {
    capability: 'EventExecution',
    action: 'event-execution.create',
    description: 'Create an executable workflow context for an event.',
    consumers: [...eventExecutionConsumers],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.build-plan',
    description: 'Build or refresh the execution plan for an event lifecycle.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.reserve-resources',
    description: 'Prepare resource reservation requests for event execution.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.release-resources',
    description: 'Release previously prepared resource reservations.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.generate-purchase-orders',
    description: 'Prepare purchase-order intents required for the event.',
    consumers: ['manual-ui', 'guided-wizard', 'ai'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.generate-supplier-bookings',
    description: 'Prepare supplier booking intents required for the event.',
    consumers: ['manual-ui', 'guided-wizard', 'ai'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.assign-tasks',
    description: 'Prepare operational task assignment for event execution.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.dispatch',
    description: 'Transition an execution workflow toward dispatch readiness.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.collect',
    description:
      'Transition an execution workflow toward collection completion.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.complete',
    description: 'Mark an execution workflow as operationally complete.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.cancel',
    description:
      'Cancel an execution workflow without deleting the underlying event.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'EventExecution',
    action: 'event-execution.archive',
    description: 'Archive a completed or cancelled execution workflow.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
];

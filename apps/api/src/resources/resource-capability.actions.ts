import type { CapabilityActionDefinition } from '../capabilities/capability.types';

const resourceConsumers = [
  'manual-ui',
  'guided-wizard',
  'ai',
  'marketplace',
  'mobile-app',
] as const;

export const resourceCapabilityActions: CapabilityActionDefinition[] = [
  {
    capability: 'Resource',
    action: 'resource.create-resource',
    description: 'Create a resource record within organization scope.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.update-resource',
    description: 'Update an existing resource record.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.archive-resource',
    description: 'Archive a resource without deleting historical records.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'Resource',
    action: 'resource.restore-resource',
    description: 'Restore an archived resource to active planning.',
    consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
  },
  {
    capability: 'Resource',
    action: 'resource.search-resources',
    description: 'Search and filter resources across organization boundaries.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.get-resource',
    description: 'Get one resource and current metadata by id.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.check-availability',
    description: 'Calculate point-in-time availability for a requested window.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.create-reservation',
    description: 'Create a reservation for a resource and time window.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.update-reservation',
    description: 'Update reservation timing, quantity or notes.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.confirm-reservation',
    description: 'Confirm a pending reservation after final checks.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.release-reservation',
    description: 'Release a reservation and restore resource availability.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.cancel-reservation',
    description: 'Cancel a reservation without deleting historical data.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.get-reservations-for-resource',
    description: 'List reservations attached to a single resource.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.get-reservations-for-source',
    description: 'List reservations linked to a source workflow reference.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.get-availability-calendar',
    description: 'Get a timeline availability calendar for a resource.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.reserve-resources-for-event',
    description:
      'Reserve resources for a specific event with optional partial fulfillment.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.release-event-allocations',
    description:
      'Release or cancel event-linked allocations when the event lifecycle transitions.',
    consumers: [
      'manual-ui',
      'guided-wizard',
      'ai',
      'marketplace',
      'mobile-app',
    ],
  },
  {
    capability: 'Resource',
    action: 'resource.get-event-allocations',
    description: 'List resource allocations for an event.',
    consumers: [...resourceConsumers],
  },
  {
    capability: 'Resource',
    action: 'resource.get-resource-history',
    description: 'List historical allocation records for a resource.',
    consumers: [...resourceConsumers],
  },
];

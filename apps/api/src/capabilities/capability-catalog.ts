import type { CapabilityDescriptor } from './capability.types';
import { eventExecutionCapabilityActions } from '../event-execution/event-execution-capability.actions';
import { resourceCapabilityActions } from '../resources/resource-capability.actions';

const sharedConsumers = [
  'manual-ui',
  'guided-wizard',
  'ai',
  'marketplace',
  'mobile-app',
] as const;

export const capabilityCatalog: CapabilityDescriptor[] = [
  {
    name: 'Event',
    description: 'Plan, schedule and govern event lifecycle operations.',
    actions: [
      {
        capability: 'Event',
        action: 'event.list',
        description: 'List and filter event records.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Event',
        action: 'event.upsert',
        description: 'Create or update an event workflow record.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
    ],
  },
  {
    name: 'EventExecution',
    description:
      'Manage executable event workflow lifecycle orchestration without replacing core event CRUD records.',
    actions: eventExecutionCapabilityActions,
  },
  {
    name: 'Inventory',
    description: 'Track stock, storage, receiving and movement operations.',
    actions: [
      {
        capability: 'Inventory',
        action: 'inventory.list',
        description: 'List inventory, stock and storage context.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Inventory',
        action: 'inventory.adjust',
        description: 'Apply stock adjustments and receiving movements.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
    ],
  },
  {
    name: 'Resource',
    description:
      'Manage generic rentable, sellable and usable business resources without subtype-specific rules.',
    actions: resourceCapabilityActions,
  },
  {
    name: 'Marketplace',
    description:
      'Project published data and public workflows into a standalone marketplace surface.',
    actions: [
      {
        capability: 'Marketplace',
        action: 'marketplace.publish',
        description:
          'Publish approved operational data to the marketplace surface.',
        consumers: ['ai', 'marketplace'],
      },
      {
        capability: 'Marketplace',
        action: 'marketplace.withdraw',
        description:
          'Remove previously published data from the marketplace surface.',
        consumers: ['ai', 'marketplace'],
      },
    ],
  },
  {
    name: 'Booking',
    description:
      'Handle booking requests, confirmations and operational handoff.',
    actions: [
      {
        capability: 'Booking',
        action: 'booking.list',
        description: 'List booking requests and fulfillment state.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Booking',
        action: 'booking.transition',
        description:
          'Advance booking state through approval or fulfillment steps.',
        consumers: [
          'manual-ui',
          'guided-wizard',
          'ai',
          'marketplace',
          'mobile-app',
        ],
      },
    ],
  },
  {
    name: 'PurchaseOrder',
    description:
      'Create, approve, send and reconcile supplier purchasing workflows.',
    actions: [
      {
        capability: 'PurchaseOrder',
        action: 'purchase-order.list',
        description: 'List purchase orders and receiving progress.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'PurchaseOrder',
        action: 'purchase-order.draft.save',
        description:
          'Create or update draft purchase orders with supplier product lines.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
      {
        capability: 'PurchaseOrder',
        action: 'purchase-order.transition',
        description:
          'Submit, approve, send, archive or restore purchase orders.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
    ],
  },
  {
    name: 'Quote',
    description: 'Prepare, revise and track quote workflows for customers.',
    actions: [
      {
        capability: 'Quote',
        action: 'quote.list',
        description: 'List and search quote records.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Quote',
        action: 'quote.upsert',
        description: 'Create or update a quote draft.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
    ],
  },
  {
    name: 'Client',
    description:
      'Manage customer and relationship data used across capabilities.',
    actions: [
      {
        capability: 'Client',
        action: 'client.list',
        description: 'List contacts and customer records.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Client',
        action: 'client.upsert',
        description: 'Create or update customer records.',
        consumers: ['manual-ui', 'guided-wizard', 'ai', 'mobile-app'],
      },
    ],
  },
  {
    name: 'Transaction',
    description:
      'Coordinate financial and commercial state transitions across the platform.',
    actions: [
      {
        capability: 'Transaction',
        action: 'transaction.list',
        description: 'List payable, receivable or settlement records.',
        consumers: [...sharedConsumers],
      },
      {
        capability: 'Transaction',
        action: 'transaction.reconcile',
        description: 'Reconcile transaction state against operational records.',
        consumers: ['manual-ui', 'guided-wizard', 'ai'],
      },
    ],
  },
];

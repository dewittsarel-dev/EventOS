import { describe, expect, it } from 'vitest';
import {
  APP_NAV_ROUTES,
  OPERATIONS_NAV_ROUTES,
  PRIMARY_NAV_ROUTES,
  buildBreadcrumbs,
  routeTitle,
} from './route-meta';

describe('route meta', () => {
  it('contains all primary navigation routes', () => {
    const paths = PRIMARY_NAV_ROUTES.map((route) => route.href);

    expect(paths).toEqual([
      '/',
      '/events',
      '/documents',
      '/activity',
      '/settings/organization',
    ]);
    expect(OPERATIONS_NAV_ROUTES.map((route) => route.href)).toContain('/purchase-orders');
    expect(APP_NAV_ROUTES.map((route) => route.href)).toContain('/marketplace');
  });

  it('builds breadcrumbs including dashboard root', () => {
    const crumbs = buildBreadcrumbs('/tasks/timeline');

    expect(crumbs).toEqual([
      { href: '/', label: 'Home' },
      { href: '/tasks', label: 'Tasks' },
      { href: '/tasks/timeline', label: 'Timeline' },
    ]);
  });

  it('uses a human label instead of exposing record identifiers', () => {
    expect(buildBreadcrumbs('/events/123e4567-e89b-12d3-a456-426614174000')).toEqual([
      { href: '/', label: 'Home' },
      { href: '/events', label: 'Events' },
      { href: '/events/123e4567-e89b-12d3-a456-426614174000', label: 'Details' },
    ]);
  });

  it('resolves titles from nested paths', () => {
    expect(routeTitle('/events/123')).toBe('Events');
    expect(routeTitle('/suppliers/123')).toBe('Suppliers');
    expect(routeTitle('/purchase-orders/123')).toBe('Purchase Orders');
    expect(routeTitle('/quotations')).toBe('Quotations');
    expect(routeTitle('/marketplace')).toBe('Marketplace');
    expect(routeTitle('/documents')).toBe('Documents');
  });
});

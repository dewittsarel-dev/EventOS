import { describe, expect, it } from 'vitest';
import { APP_NAV_ROUTES, buildBreadcrumbs, routeTitle } from './route-meta';

describe('route meta', () => {
  it('contains all primary navigation routes', () => {
    const paths = APP_NAV_ROUTES.map((route) => route.href);

    expect(paths).toEqual([
      '/',
      '/contacts',
      '/events',
      '/suppliers',
      '/quotations',
      '/tasks',
      '/marketplace',
    ]);
  });

  it('builds breadcrumbs including dashboard root', () => {
    const crumbs = buildBreadcrumbs('/tasks/timeline');

    expect(crumbs).toEqual([
      { href: '/', label: 'Dashboard' },
      { href: '/tasks', label: 'Tasks' },
      { href: '/tasks/timeline', label: 'Timeline' },
    ]);
  });

  it('resolves titles from nested paths', () => {
    expect(routeTitle('/events/123')).toBe('Events');
    expect(routeTitle('/suppliers/123')).toBe('Suppliers');
    expect(routeTitle('/quotations')).toBe('Quotations');
    expect(routeTitle('/marketplace')).toBe('Marketplace');
  });
});

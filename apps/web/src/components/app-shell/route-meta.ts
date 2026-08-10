export type AppRouteMeta = {
  href: string;
  label: string;
  section: string;
  matchPrefix?: string;
  placeholder?: boolean;
};

export const PRIMARY_NAV_ROUTES: AppRouteMeta[] = [
  { href: '/', label: 'Home', section: 'Primary' },
  { href: '/events', label: 'Events', section: 'Primary' },
  { href: '/documents', label: 'Documents', section: 'Primary' },
  { href: '/activity', label: 'Activity', section: 'Primary' },
  {
    href: '/settings/organization',
    label: 'Settings',
    section: 'Primary',
    matchPrefix: '/settings',
  },
];

export const OPERATIONS_NAV_ROUTES: AppRouteMeta[] = [
  { href: '/contacts', label: 'Contacts', section: 'Operations' },
  { href: '/meeting-notes', label: 'Meeting Notes', section: 'Operations' },
  { href: '/suppliers', label: 'Suppliers', section: 'Operations' },
  { href: '/inventory', label: 'Resources', section: 'Operations' },
  { href: '/purchase-orders', label: 'Purchase Orders', section: 'Operations' },
  { href: '/quotations', label: 'Quotations', section: 'Operations' },
  { href: '/tasks', label: 'Tasks', section: 'Operations' },
];

export const APP_NAV_ROUTES = [
  ...PRIMARY_NAV_ROUTES,
  ...OPERATIONS_NAV_ROUTES,
  { href: '/marketplace', label: 'Marketplace', section: 'Separate surface' },
];

export function routeMatches(pathname: string, route: AppRouteMeta) {
  const matchPath = route.matchPrefix ?? route.href;

  if (matchPath === '/') {
    return pathname === '/';
  }

  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

function prettifySegment(segment: string) {
  if (segment === '[id]' || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)) {
    return 'Details';
  }

  if (segment === 'new') {
    return 'New';
  }

  if (segment === 'edit') {
    return 'Edit';
  }

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ href: '/', label: 'Home' }];
  }

  const crumbs = [{ href: '/', label: 'Home' }];

  let current = '';

  for (const segment of segments) {
    current += `/${segment}`;
    crumbs.push({ href: current, label: prettifySegment(segment) });
  }

  return crumbs;
}

export function routeTitle(pathname: string) {
  const matched = APP_NAV_ROUTES.find((route) => routeMatches(pathname, route));

  if (!matched) {
    return 'Workspace';
  }

  return matched.label;
}

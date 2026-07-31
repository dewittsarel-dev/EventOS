export type AppRouteMeta = {
  href: string;
  label: string;
  section: string;
  placeholder?: boolean;
};

export const APP_NAV_ROUTES: AppRouteMeta[] = [
  { href: '/', label: 'Dashboard', section: 'Overview' },
  { href: '/contacts', label: 'Contacts', section: 'Operations' },
  { href: '/events', label: 'Events', section: 'Operations' },
  { href: '/meeting-notes', label: 'Meeting Notes', section: 'Operations' },
  { href: '/suppliers', label: 'Suppliers', section: 'Operations' },
  { href: '/inventory', label: 'Inventory', section: 'Operations' },
  { href: '/quotations', label: 'Quotations', section: 'Operations' },
  { href: '/tasks', label: 'Tasks', section: 'Operations' },
  {
    href: '/marketplace',
    label: 'Marketplace',
    section: 'Growth',
    placeholder: true,
  },
];

function prettifySegment(segment: string) {
  if (segment === '[id]') {
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
    return [{ href: '/', label: 'Dashboard' }];
  }

  const crumbs = [{ href: '/', label: 'Dashboard' }];

  let current = '';

  for (const segment of segments) {
    current += `/${segment}`;
    crumbs.push({ href: current, label: prettifySegment(segment) });
  }

  return crumbs;
}

export function routeTitle(pathname: string) {
  const matched = APP_NAV_ROUTES.find((route) =>
    pathname === route.href ? true : pathname.startsWith(`${route.href}/`),
  );

  if (!matched) {
    return 'Workspace';
  }

  return matched.label;
}

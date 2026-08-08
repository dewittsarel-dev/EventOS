const PROTECTED_ROUTE_PREFIXES = [
  '/contacts',
  '/events',
  '/meeting-notes',
  '/suppliers',
  '/inventory',
  '/resources',
  '/purchase-orders',
  '/goods-receipts',
  '/quotations',
  '/tasks',
  '/settings',
] as const;

const PUBLIC_ROUTE_PREFIXES = ['/login', '/marketplace'] as const;

export function isDevelopmentAuthBypassEnabled() {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
    return true;
  }

  return process.env.NODE_ENV === 'development';
}

export function isProtectedAppPath(pathname: string) {
  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  if (pathname === '/' || pathname === '/dashboard') {
    return true;
  }

  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function buildLoginRedirectPath(pathname: string, search: string) {
  const nextPath = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(nextPath || '/')}`;
}

export function navigateToLogin(pathname: string, search: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace(buildLoginRedirectPath(pathname, search));
}

export function navigateToPath(path: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace(path);
}


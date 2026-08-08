'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  APP_NAV_ROUTES,
  buildBreadcrumbs,
  routeTitle,
} from './route-meta';
import {
  isDevelopmentAuthBypassEnabled,
  isProtectedAppPath,
  navigateToLogin,
  navigateToPath,
} from './protected-routes';
import { Breadcrumbs } from './breadcrumbs';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ContactsIcon,
  DashboardIcon,
  EventsIcon,
  InventoryIcon,
  LogoutIcon,
  MarketplaceIcon,
  MenuIcon,
  MeetingNotesIcon,
  NotificationIcon,
  PurchaseOrdersIcon,
  QuotationsIcon,
  SearchIcon,
  SuppliersIcon,
  TasksIcon,
  UserIcon,
} from './shell-icons';
import { seedDevelopmentWorkspace } from '../../lib/auth-api';
import { useAppSession } from './session-context';

type AppShellProps = {
  children: ReactNode;
};

function navIcon(label: string) {
  if (label === 'Dashboard') {
    return DashboardIcon;
  }

  if (label === 'Contacts') {
    return ContactsIcon;
  }

  if (label === 'Events') {
    return EventsIcon;
  }

  if (label === 'Meeting Notes') {
    return MeetingNotesIcon;
  }

  if (label === 'Quotations') {
    return QuotationsIcon;
  }

  if (label === 'Suppliers') {
    return SuppliersIcon;
  }

  if (label === 'Inventory') {
    return InventoryIcon;
  }

  if (label === 'Purchase Orders') {
    return PurchaseOrdersIcon;
  }

  if (label === 'Tasks') {
    return TasksIcon;
  }

  return MarketplaceIcon;
}

function initials(name: string | null, email: string | undefined) {
  if (name?.trim()) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  if (!email) {
    return 'U';
  }

  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const {
    session,
    setSession,
    user,
    organizations,
    activeOrganization,
    loadingMeta,
    metaError,
    isAuthenticated,
    isSessionHydrated,
    logout,
    setOrganizationId,
  } = useAppSession();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState(session.baseUrl);
  const [tokenInput, setTokenInput] = useState(session.token);
  const [organizationInput, setOrganizationInput] = useState(session.organizationId);
  const [savedHint, setSavedHint] = useState('');
  const [demoSignInBusy, setDemoSignInBusy] = useState(false);
  const [demoSignInError, setDemoSignInError] = useState('');

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileOpen(false);
      }

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.target instanceof HTMLElement &&
        event.target.tagName !== 'INPUT' &&
        event.target.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!isProfileOpen || !profileMenuRef.current) {
        return;
      }

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    window.addEventListener('mousedown', onClickOutside);

    return () => {
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [isProfileOpen]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const protectedRoute = useMemo(() => isProtectedAppPath(pathname), [pathname]);
  const developmentAuthBypassEnabled = useMemo(
    () => isDevelopmentAuthBypassEnabled(),
    [],
  );
  const enforceAuth = useMemo(
    () => protectedRoute && !developmentAuthBypassEnabled,
    [developmentAuthBypassEnabled, protectedRoute],
  );

  function isActiveRoute(href: string) {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function onSaveSession() {
    const nextBaseUrl = baseUrlInput.trim() || 'http://localhost:3001';
    const nextToken = tokenInput.trim();
    const nextOrganizationId = organizationInput.trim();

    setSession({
      baseUrl: nextBaseUrl,
      token: nextToken,
      organizationId: nextOrganizationId,
    });

    setSavedHint('Saved');
    window.setTimeout(() => setSavedHint(''), 1200);
  }

  function onOrganizationSelect(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setOrganizationId(value);
    setOrganizationInput(value);
  }

  const shellTitle = routeTitle(pathname);

  function onToggleProfileMenu() {
    if (!isProfileOpen) {
      setBaseUrlInput(session.baseUrl);
      setTokenInput(session.token);
      setOrganizationInput(session.organizationId);
    }

    setProfileOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!isSessionHydrated || !enforceAuth || isAuthenticated) {
      return;
    }

    const search = typeof window === 'undefined' ? '' : window.location.search;
    navigateToLogin(pathname, search);
  }, [enforceAuth, isAuthenticated, isSessionHydrated, pathname]);

  async function onDemoSignInFromShell() {
    setDemoSignInError('');
    setDemoSignInBusy(true);

    try {
      const response = await seedDevelopmentWorkspace(session.baseUrl);

      setSession({
        baseUrl: session.baseUrl,
        token: response.accessToken,
        organizationId: response.organizationId,
      });
    } catch (error) {
      setDemoSignInError(
        error instanceof Error ? error.message : 'Demo sign in failed.',
      );
    } finally {
      setDemoSignInBusy(false);
    }
  }

  const nav = (
    <nav aria-label="Main navigation" className="mt-6 space-y-1">
      {APP_NAV_ROUTES.map((item) => {
        const isActive = isActiveRoute(item.href);
        const Icon = navIcon(item.label);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'md:hidden xl:inline' : ''}>
              {item.label}
              {item.placeholder ? ' (Coming Soon)' : ''}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f4f5f7_38%,_#eceef2_100%)] text-zinc-900">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <aside
          className={`hidden border-r border-zinc-200/80 bg-white/95 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)] backdrop-blur md:flex md:flex-col ${
            isSidebarCollapsed ? 'md:w-20 xl:w-20' : 'md:w-72'
          }`}
          aria-label="Sidebar"
        >
          <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
                EO
              </div>
              <div className={isSidebarCollapsed ? 'hidden' : ''}>
                <p className="text-sm font-semibold">ClientOS</p>
                <p className="text-xs text-zinc-500">EventOS Workspace</p>
              </div>
            </div>

            <button
              type="button"
              className="hidden rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-100 md:inline-flex xl:hidden"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>

          <div className={`border-t border-zinc-200 p-3 text-xs text-zinc-500 ${isSidebarCollapsed ? 'hidden md:block md:text-center xl:block xl:text-left' : ''}`}>
            <p className={isSidebarCollapsed ? 'md:hidden xl:block' : ''}>
              Marketplace launches in a future phase.
            </p>
            {isSidebarCollapsed ? <p className="md:block xl:hidden">Later</p> : null}
          </div>
        </aside>

        {isMobileMenuOpen ? (
          <div
            className="fixed inset-0 z-40 bg-zinc-900/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="h-full w-72 bg-white p-4 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">ClientOS</p>
                  <p className="text-xs text-zinc-500">EventOS Workspace</p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  Close
                </button>
              </div>
              {nav}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-3 md:px-5">
              <button
                type="button"
                className="inline-flex rounded-md border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuIcon className="h-4 w-4" />
              </button>

              <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                <SearchIcon className="h-4 w-4 text-zinc-500" />
                <input
                  ref={searchRef}
                  aria-label="Global search"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none ring-zinc-900/20 placeholder:text-zinc-400 focus-visible:ring-2"
                  placeholder="Search across ClientOS (coming soon)"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 md:hidden"
                aria-label="Global search coming soon"
                title="Global search coming soon"
              >
                <SearchIcon className="h-4 w-4" />
              </button>

              <label className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-600 lg:flex">
                <span className="shrink-0">Organization</span>
                <select
                  aria-label="Select organization"
                  className="min-w-40 bg-transparent text-xs text-zinc-800 outline-none"
                  value={session.organizationId}
                  onChange={onOrganizationSelect}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                  {!organizations.length && session.organizationId ? (
                    <option value={session.organizationId}>
                      Organization {session.organizationId}
                    </option>
                  ) : null}
                </select>
              </label>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                aria-label="Open notifications"
                title="Notifications"
              >
                <NotificationIcon className="h-4 w-4" />
              </button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 hover:bg-zinc-100"
                  onClick={onToggleProfileMenu}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  aria-label="Open user menu"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {initials(user?.name ?? null, user?.email)}
                  </span>
                  <span className="hidden text-left text-xs md:block">
                    <strong className="block max-w-28 truncate text-zinc-900">
                      {user?.name || 'Workspace User'}
                    </strong>
                    <span className="block max-w-28 truncate text-zinc-500">
                      {user?.email || 'Not authenticated'}
                    </span>
                  </span>
                </button>

                {isProfileOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-[20rem] rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Workspace Session
                    </p>

                    <label className="mb-2 block text-xs text-zinc-600">
                      API Base URL
                      <input
                        className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        value={baseUrlInput}
                        onChange={(event) => setBaseUrlInput(event.target.value)}
                        placeholder="http://localhost:3001"
                      />
                    </label>

                    <label className="mb-2 block text-xs text-zinc-600">
                      Bearer Token
                      <input
                        className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        value={tokenInput}
                        onChange={(event) => setTokenInput(event.target.value)}
                        placeholder="eyJhbGciOi..."
                      />
                    </label>

                    {organizations.length > 0 ? (
                      <label className="mb-2 block text-xs text-zinc-600">
                        Organization
                        <select
                          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                          value={session.organizationId}
                          onChange={onOrganizationSelect}
                        >
                          <option value="">Select organization</option>
                          {organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                              {organization.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="mb-2 block text-xs text-zinc-600">
                        Organization ID
                        <input
                          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                          value={organizationInput}
                          onChange={(event) =>
                            setOrganizationInput(event.target.value)
                          }
                          placeholder="organization uuid"
                        />
                      </label>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                        onClick={onSaveSession}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigateToPath('/login');
                        }}
                      >
                        <LogoutIcon className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>

                    {savedHint ? (
                      <p className="mt-2 text-xs text-emerald-600">{savedHint}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-zinc-100 px-3 py-2 md:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="max-w-52 truncate">
                    {loadingMeta
                      ? 'Loading workspace context...'
                      : activeOrganization
                        ? `${activeOrganization.name}`
                        : session.organizationId
                          ? `Organization ${session.organizationId}`
                          : 'No organization selected'}
                  </span>
                </div>
              </div>
              {metaError ? (
                <p className="mt-1 text-xs text-amber-700">{metaError}</p>
              ) : null}
              {!isAuthenticated && !developmentAuthBypassEnabled ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Set a bearer token in the profile menu to access protected routes.
                </p>
              ) : null}

              {!isAuthenticated && developmentAuthBypassEnabled ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={demoSignInBusy}
                    onClick={() => void onDemoSignInFromShell()}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
                  >
                    {demoSignInBusy
                      ? 'Signing in as Demo Administrator...'
                      : 'Sign in as Demo Administrator'}
                  </button>
                  <Link
                    href="/login"
                    className="text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                  >
                    Open sign-in page
                  </Link>
                </div>
              ) : null}

              {demoSignInError ? (
                <p className="mt-1 text-xs text-red-700">{demoSignInError}</p>
              ) : null}
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-clip px-3 py-4 md:px-6 md:py-6">
            <div className="mx-auto w-full max-w-7xl">
              {isSessionHydrated && enforceAuth && !isAuthenticated ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
                  Redirecting to sign in...
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {shellTitle}
      </div>
    </div>
  );
}

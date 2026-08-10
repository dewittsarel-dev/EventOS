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
  OPERATIONS_NAV_ROUTES,
  PRIMARY_NAV_ROUTES,
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
import { WorkspaceSearch } from './workspace-search';

type AppShellProps = {
  children: ReactNode;
};

function navIcon(label: string) {
  if (label === 'Home') {
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

  if (label === 'Activity' || label === 'Tasks') {
    return TasksIcon;
  }

  if (label === 'Documents') {
    return MeetingNotesIcon;
  }

  if (label === 'Settings') {
    return UserIcon;
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
  const [isSearchOpen, setSearchOpen] = useState(false);

  const isPublicMarketplace = pathname === '/marketplace' || pathname.startsWith('/marketplace/');

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileOpen(false);
        setSearchOpen(false);
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
        setSearchOpen(true);
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

  function navLinks(items: typeof APP_NAV_ROUTES) {
    return items.map((item) => {
        const isActive = isActiveRoute(item.href);
        const Icon = navIcon(item.label);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isActive
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
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
      });
  }

  const nav = (
    <nav aria-label="Main navigation" className="mt-4 space-y-1">
      <div className="pb-1">
        <p className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ${isSidebarCollapsed ? 'md:hidden xl:block' : ''}`}>
          Workspace
        </p>
      </div>
      {navLinks(PRIMARY_NAV_ROUTES)}
      <div className="pb-1 pt-5">
        <p className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ${isSidebarCollapsed ? 'md:hidden xl:block' : ''}`}>
          Business operations
        </p>
      </div>
      {navLinks(OPERATIONS_NAV_ROUTES)}
    </nav>
  );

  if (isPublicMarketplace) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f4f5f7_38%,_#eceef2_100%)] text-zinc-900">
      <WorkspaceSearch
        open={isSearchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigateToPath}
      />
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <aside
          className={`hidden border-r border-zinc-200/80 bg-white/95 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)] backdrop-blur md:flex md:flex-col ${
            isSidebarCollapsed ? 'md:w-20 xl:w-20' : 'md:w-72'
          }`}
          aria-label="Sidebar"
        >
          <div className="flex h-[4.5rem] items-center justify-between border-b border-zinc-200 px-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-xs font-semibold text-white shadow-sm">
                EO<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
              </div>
              <div className={isSidebarCollapsed ? 'hidden' : ''}>
                <p className="text-sm font-semibold tracking-tight">ClientOS</p>
                <p className="text-[11px] text-zinc-500">by EventOS</p>
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
              <Link className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-medium text-zinc-700 hover:border-zinc-300 hover:bg-white hover:text-zinc-950" href="/marketplace" target="_blank">
                <span>Open Marketplace</span><span aria-hidden="true">↗</span>
              </Link>
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
              className="h-full w-[min(18rem,calc(100vw-2rem))] overflow-y-auto bg-white p-4 shadow-xl"
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
              <div className="mt-5 border-t border-zinc-200 pt-4">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Customer-facing
                </p>
                <Link
                  href="/marketplace"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-white hover:text-zinc-950"
                >
                  <span>Open Marketplace</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl">
            <div className="flex h-[4.5rem] items-center gap-3 px-3 md:px-5">
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
                <button
                  ref={searchRef}
                  aria-label="Global search"
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 text-left text-sm text-zinc-400 outline-none ring-amber-400/50 hover:bg-white focus-visible:bg-white focus-visible:ring-2"
                  onClick={() => setSearchOpen(true)}
                >
                  <span>Search ClientOS workspaces and actions</span>
                  <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-500">/</span>
                </button>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 md:hidden"
                aria-label="Open ClientOS search"
                title="Search ClientOS"
                onClick={() => setSearchOpen(true)}
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

              <Link
                href="/activity"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                aria-label="Open notifications and activity"
                title="Notifications and activity"
              >
                <NotificationIcon className="h-4 w-4" />
              </Link>

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
                    className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl"
                  >
                    <p className="text-sm font-semibold text-zinc-900">Account</p>
                    <p className="mb-3 text-xs text-zinc-500">{activeOrganization?.name ?? 'Select an organization to begin'}</p>

                    {developmentAuthBypassEnabled ? (
                      <details className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-zinc-700">
                        <summary className="cursor-pointer font-medium">Developer connection</summary>
                        <label className="mt-2 block text-zinc-600">
                          API address
                          <input className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm" value={baseUrlInput} onChange={(event) => setBaseUrlInput(event.target.value)} placeholder="http://localhost:3001" />
                        </label>
                        <label className="mt-2 block text-zinc-600">
                          Development access token
                          <input type="password" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Development token" />
                        </label>
                      </details>
                    ) : null}

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
                    ) : developmentAuthBypassEnabled ? (
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
                    ) : (
                      <p className="mb-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">No organization memberships are available for this account.</p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {developmentAuthBypassEnabled ? <button type="button" className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700" onClick={onSaveSession}>Save connection</button> : <Link href="/settings/organization" onClick={() => setProfileOpen(false)} className="text-xs font-medium text-zinc-700 underline">Organization settings</Link>}

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
                      ? 'Loading organization...'
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

          <main className="min-w-0 flex-1 overflow-x-clip px-3 py-5 md:px-7 md:py-7">
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

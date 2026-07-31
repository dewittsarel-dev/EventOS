import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';
import { AppSessionProvider } from './session-context';

let mockPathname = '/events';
const navigateToLogin = vi.fn();
const navigateToPath = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('./protected-routes', async () => {
  const actual = await vi.importActual<typeof import('./protected-routes')>('./protected-routes');

  return {
    ...actual,
    navigateToLogin: (...args: unknown[]) => navigateToLogin(...args),
    navigateToPath: (...args: unknown[]) => navigateToPath(...args),
  };
});

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigateToLogin.mockReset();
    navigateToPath.mockReset();
    mockPathname = '/events';
    window.history.replaceState({}, '', '/events');
  });

  it('shows primary routes and active state', () => {
    render(
      <AppSessionProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </AppSessionProvider>,
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });

    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Contacts' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Meeting Notes' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Suppliers' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Inventory' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Events' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens the mobile navigation drawer', () => {
    render(
      <AppSessionProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </AppSessionProvider>,
    );

    fireEvent.click(screen.getByLabelText('Open navigation menu'));

    expect(screen.getByLabelText('Close navigation menu')).toBeInTheDocument();
  });

  it('redirects unauthenticated users away from protected routes and hides page content', () => {
    render(
      <AppSessionProvider>
        <AppShell>
          <div>Protected Content</div>
        </AppShell>
      </AppSessionProvider>,
    );

    expect(screen.getByText('Redirecting to sign in...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(navigateToLogin).toHaveBeenCalled();
  });

  it('logs out and redirects to login from a protected route', () => {
    window.localStorage.setItem(
      'eventos.events.session',
      JSON.stringify({
        baseUrl: 'http://localhost:3001',
        token: 'token-1',
        organizationId: 'org-1',
      }),
    );

    render(
      <AppSessionProvider>
        <AppShell>
          <div>Protected Content</div>
        </AppShell>
      </AppSessionProvider>,
    );

    fireEvent.click(screen.getByLabelText('Open user menu'));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(navigateToPath).toHaveBeenCalledWith('/login');
    expect(window.localStorage.getItem('eventos.events.session')).toContain('"token":""');
  });
});

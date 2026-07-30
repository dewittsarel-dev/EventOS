import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';
import { AppSessionProvider } from './session-context';

vi.mock('next/navigation', () => ({
  usePathname: () => '/events',
}));

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
});

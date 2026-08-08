import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const loginWithPassword = vi.fn();
const seedDevelopmentWorkspace = vi.fn();
const routerReplace = vi.fn();
const setSession = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: (...args: unknown[]) => routerReplace(...args),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'next' ? '/tasks/new' : null),
  }),
}));

vi.mock('../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: '',
      baseUrl: 'http://localhost:3001',
      organizationId: '',
    },
    setSession: (...args: unknown[]) => setSession(...args),
  }),
}));

vi.mock('../../lib/auth-api', () => ({
  loginWithPassword: (...args: unknown[]) => loginWithPassword(...args),
  seedDevelopmentWorkspace: (...args: unknown[]) =>
    seedDevelopmentWorkspace(...args),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginWithPassword.mockReset();
    seedDevelopmentWorkspace.mockReset();
    routerReplace.mockReset();
    setSession.mockReset();
    delete process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS;

    loginWithPassword.mockResolvedValue({
      accessToken: 'token-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User One',
        createdAt: '2026-07-31T00:00:00.000Z',
        updatedAt: '2026-07-31T00:00:00.000Z',
      },
    });

    seedDevelopmentWorkspace.mockResolvedValue({
      accessToken: 'demo-token-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 'demo-user-1',
        email: 'demo@eventos.local',
        name: 'Demo Administrator',
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
      },
      organization: {
        id: 'demo-org-1',
        name: 'EventOS Demo Organization',
        slug: 'eventos-demo-organization',
      },
      organizations: [
        {
          id: 'demo-org-1',
          name: 'EventOS Demo Organization',
          slug: 'eventos-demo-organization',
        },
      ],
      organizationId: 'demo-org-1',
      membershipRole: 'administrator',
    });
  });

  it('returns to the requested route after successful login', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secure1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith('http://localhost:3001', {
        email: 'user@example.com',
        password: 'secure1234',
      });
      expect(setSession).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:3001',
        token: 'token-1',
        organizationId: '',
      });
      expect(routerReplace).toHaveBeenCalledWith('/tasks/new');
    });
  });

  it('supports development demo sign-in through seeded backend credentials', async () => {
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS = 'true';

    render(<LoginPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign in as Demo Administrator' }),
    );

    await waitFor(() => {
      expect(seedDevelopmentWorkspace).toHaveBeenCalledWith(
        'http://localhost:3001',
      );
      expect(setSession).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:3001',
        token: 'demo-token-1',
        organizationId: 'demo-org-1',
      });
      expect(routerReplace).toHaveBeenCalledWith('/tasks/new');
    });
  });
});

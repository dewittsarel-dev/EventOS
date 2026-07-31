import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const loginWithPassword = vi.fn();
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
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginWithPassword.mockReset();
    routerReplace.mockReset();
    setSession.mockReset();

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
});

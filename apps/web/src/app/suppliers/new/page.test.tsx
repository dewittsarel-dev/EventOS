import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewSupplierPage from './page';

const createSupplier = vi.fn();
const push = vi.fn();
const sessionState = {
  token: 'token-1',
  baseUrl: 'http://localhost:3001',
  organizationId: '11111111-1111-4111-8111-111111111111',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock('../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: sessionState,
  }),
}));

vi.mock('../../../lib/suppliers-api', () => ({
  createSupplier: (...args: unknown[]) => createSupplier(...args),
}));

describe('NewSupplierPage', () => {
  beforeEach(() => {
    createSupplier.mockReset();
    push.mockReset();
    sessionState.token = 'token-1';
    sessionState.organizationId = '11111111-1111-4111-8111-111111111111';
    createSupplier.mockResolvedValue({ id: 'supplier-1' });
  });

  it('creates a supplier with payload values using canonical session context', async () => {
    render(<NewSupplierPage />);

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Fresh Flowers Co.' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Lighting' },
    });
    fireEvent.change(screen.getByLabelText('Website'), {
      target: { value: 'www.custechonline.com' },
    });
    fireEvent.change(screen.getByLabelText('Internal Rating (1-5)'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    await waitFor(() => {
      expect(createSupplier).toHaveBeenCalledWith(
        {
          token: 'token-1',
          baseUrl: 'http://localhost:3001',
        },
        expect.objectContaining({
          organizationId: '11111111-1111-4111-8111-111111111111',
          companyName: 'Fresh Flowers Co.',
          category: 'Lighting',
          website: 'https://www.custechonline.com',
          internalRating: 4,
        }),
      );
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/suppliers/supplier-1');
    });

    expect(createSupplier).toHaveBeenCalledTimes(1);
  });

  it('keeps existing https website unchanged', async () => {
    render(<NewSupplierPage />);

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'CuStech Online' },
    });
    fireEvent.change(screen.getByLabelText('Website'), {
      target: { value: 'https://www.custechonline.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    await waitFor(() => {
      expect(createSupplier).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          website: 'https://www.custechonline.com',
        }),
      );
    });
  });

  it('shows session unavailable message when not authenticated', async () => {
    sessionState.token = '';

    render(<NewSupplierPage />);

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'No Session Supplier' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(
      await screen.findByText('Your session is unavailable. Please sign in again.'),
    ).toBeInTheDocument();
    expect(createSupplier).not.toHaveBeenCalled();
  });

  it('shows clear validation message for invalid website', async () => {
    render(<NewSupplierPage />);

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Invalid Website Supplier' },
    });
    fireEvent.change(screen.getByLabelText('Website'), {
      target: { value: 'not a url' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(
      await screen.findByText(
        'Website must be a valid URL, for example https://example.com.',
      ),
    ).toBeInTheDocument();
    expect(createSupplier).not.toHaveBeenCalled();
  });
});

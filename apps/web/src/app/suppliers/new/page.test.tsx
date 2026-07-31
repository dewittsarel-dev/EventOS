import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewSupplierPage from './page';

const createSupplier = vi.fn();

vi.mock('../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../../lib/suppliers-api', () => ({
  createSupplier: (...args: unknown[]) => createSupplier(...args),
}));

describe('NewSupplierPage', () => {
  beforeEach(() => {
    createSupplier.mockReset();
    createSupplier.mockResolvedValue({ id: 'supplier-1' });
  });

  it('creates a supplier with payload values', async () => {
    render(<NewSupplierPage />);

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Fresh Flowers Co.' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Florist' },
    });
    fireEvent.change(screen.getByLabelText('Internal Rating (1-5)'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    await waitFor(() => {
      expect(createSupplier).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          organizationId: '11111111-1111-4111-8111-111111111111',
          companyName: 'Fresh Flowers Co.',
          category: 'Florist',
          internalRating: 4,
        }),
      );
    });

    expect(await screen.findByText('Supplier created successfully.')).toBeInTheDocument();
  });
});

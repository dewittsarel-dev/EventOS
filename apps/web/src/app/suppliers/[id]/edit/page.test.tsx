import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditSupplierPage from './page';

const getSupplier = vi.fn();
const updateSupplier = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'supplier-1' }),
}));

vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../../../lib/suppliers-api', () => ({
  getSupplier: (...args: unknown[]) => getSupplier(...args),
  updateSupplier: (...args: unknown[]) => updateSupplier(...args),
}));

describe('EditSupplierPage', () => {
  it('loads supplier and updates changed values', async () => {
    getSupplier.mockResolvedValue({
      id: 'supplier-1',
      organizationId: '11111111-1111-4111-8111-111111111111',
      organizationName: 'EventOS',
      companyName: 'Light Co',
      category: 'AudioVisual',
      primaryContactName: null,
      phone: null,
      mobile: null,
      email: null,
      website: null,
      physicalAddress: null,
      city: null,
      province: null,
      postalCode: null,
      vatNumber: null,
      registrationNumber: null,
      preferredSupplier: false,
      active: true,
      preferredPaymentTerms: null,
      internalRating: null,
      notes: null,
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-07-31T00:00:00.000Z',
    });
    updateSupplier.mockResolvedValue({ id: 'supplier-1' });

    render(<EditSupplierPage />);

    await screen.findByDisplayValue('Light Co');

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Light Company Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateSupplier).toHaveBeenCalledWith(
        expect.anything(),
        'supplier-1',
        expect.objectContaining({ companyName: 'Light Company Updated' }),
      );
    });

    expect(await screen.findByText('Supplier updated successfully.')).toBeInTheDocument();
  });
});

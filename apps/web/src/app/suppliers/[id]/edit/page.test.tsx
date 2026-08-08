import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditSupplierPage from './page';

const getSupplier = vi.fn();
const updateSupplier = vi.fn();
const push = vi.fn();
const sessionState = {
  token: 'token-1',
  baseUrl: 'http://localhost:3001',
  organizationId: '11111111-1111-4111-8111-111111111111',
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'supplier-1' }),
  useRouter: () => ({
    push,
  }),
}));

vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: sessionState,
  }),
}));

vi.mock('../../../../lib/suppliers-api', () => ({
  getSupplier: (...args: unknown[]) => getSupplier(...args),
  updateSupplier: (...args: unknown[]) => updateSupplier(...args),
}));

describe('EditSupplierPage', () => {
  beforeEach(() => {
    push.mockReset();
    getSupplier.mockReset();
    updateSupplier.mockReset();
    sessionState.token = 'token-1';
    sessionState.organizationId = '11111111-1111-4111-8111-111111111111';

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
  });

  it('loads supplier and updates changed values', async () => {
    render(<EditSupplierPage />);

    await screen.findByDisplayValue('Light Co');

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Light Company Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateSupplier).toHaveBeenCalledWith(
        {
          token: 'token-1',
          baseUrl: 'http://localhost:3001',
        },
        'supplier-1',
        expect.objectContaining({ companyName: 'Light Company Updated' }),
      );
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/suppliers/supplier-1');
    });
  });

  it('normalizes website without protocol on save', async () => {
    render(<EditSupplierPage />);

    await screen.findByDisplayValue('Light Co');

    fireEvent.change(screen.getByLabelText('Website'), {
      target: { value: 'custechonline.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateSupplier).toHaveBeenCalledWith(
        expect.anything(),
        'supplier-1',
        expect.objectContaining({ website: 'https://custechonline.com' }),
      );
    });
  });

  it('shows session unavailable message when not authenticated', async () => {
    render(<EditSupplierPage />);

    await screen.findByDisplayValue('Light Co');
    sessionState.token = '';

    fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

    expect(
      await screen.findByText('Your session is unavailable. Please sign in again.'),
    ).toBeInTheDocument();
    expect(updateSupplier).not.toHaveBeenCalled();
  });
});

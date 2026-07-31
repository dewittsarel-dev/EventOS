import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuppliersPage from './page';

const listSuppliers = vi.fn();
const deleteSupplier = vi.fn();
const sessionState = {
  token: 'token-1',
  baseUrl: 'http://localhost:3001',
  organizationId: '11111111-1111-4111-8111-111111111111',
};

vi.mock('../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: sessionState,
  }),
}));

vi.mock('../../lib/suppliers-api', () => ({
  listSuppliers: (...args: unknown[]) => listSuppliers(...args),
  deleteSupplier: (...args: unknown[]) => deleteSupplier(...args),
}));

describe('SuppliersPage', () => {
  beforeEach(() => {
    listSuppliers.mockReset();
    deleteSupplier.mockReset();
    sessionState.token = 'token-1';
    sessionState.organizationId = '11111111-1111-4111-8111-111111111111';
    vi.stubGlobal('confirm', vi.fn(() => true));

    listSuppliers.mockResolvedValue({
      data: [
        {
          id: 'supplier-1',
          organizationId: '11111111-1111-4111-8111-111111111111',
          organizationName: 'EventOS',
          companyName: 'Blue Ribbon Catering',
          category: 'Catering',
          primaryContactName: 'Alicia Stone',
          phone: '0210000000',
          mobile: null,
          email: 'hello@blueribbon.co.za',
          website: null,
          physicalAddress: null,
          city: 'Cape Town',
          province: null,
          postalCode: null,
          vatNumber: null,
          registrationNumber: null,
          preferredSupplier: true,
          active: true,
          preferredPaymentTerms: null,
          internalRating: 5,
          notes: null,
          createdAt: '2026-07-31T00:00:00.000Z',
          updatedAt: '2026-07-31T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    });

    deleteSupplier.mockResolvedValue(undefined);
  });

  it('renders supplier table and applies filters', async () => {
    render(<SuppliersPage />);

    expect(await screen.findByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Blue Ribbon Catering')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText('Search name, contact, email, phone or city'),
      { target: { value: 'Blue' } },
    );
    fireEvent.change(screen.getByDisplayValue('All categories'), {
      target: { value: 'Catering' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(listSuppliers).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          search: 'Blue',
          category: 'Catering',
        }),
      );
    });
  });

  it('deletes a supplier', async () => {
    render(<SuppliersPage />);

    await screen.findByText('Blue Ribbon Catering');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteSupplier).toHaveBeenCalledWith(expect.anything(), 'supplier-1');
    });
  });

  it('shows organization guidance and skips data load when organization is missing', async () => {
    sessionState.organizationId = '';

    render(<SuppliersPage />);

    expect(
      await screen.findByText('Select an organization in the header to manage suppliers.'),
    ).toBeInTheDocument();
    expect(listSuppliers).not.toHaveBeenCalled();
  });
});

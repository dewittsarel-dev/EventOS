import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SupplierDetailsPage from './page';

const getSupplier = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'supplier-1' }),
}));

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
  getSupplier: (...args: unknown[]) => getSupplier(...args),
}));

describe('SupplierDetailsPage', () => {
  it('renders supplier details including organization name', async () => {
    getSupplier.mockResolvedValue({
      id: 'supplier-1',
      organizationId: '11111111-1111-4111-8111-111111111111',
      organizationName: 'EventOS',
      companyName: 'Sound Stage AV',
      category: 'AudioVisual',
      primaryContactName: 'Jamie Lee',
      phone: '0219999999',
      mobile: null,
      email: 'info@soundstage.co.za',
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
      notes: 'Great service',
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-07-31T00:00:00.000Z',
    });

    render(<SupplierDetailsPage />);

    expect(await screen.findByText('Sound Stage AV')).toBeInTheDocument();
    expect(screen.getByText('EventOS')).toBeInTheDocument();
    expect(screen.getByText('Great service')).toBeInTheDocument();
  });
});

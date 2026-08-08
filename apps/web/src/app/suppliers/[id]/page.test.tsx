import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SupplierDetailsPage from './page';

const getSupplier = vi.fn();
const getSupplierPurchaseHistory = vi.fn();
const listSupplierProducts = vi.fn();
const archiveSupplier = vi.fn();
const updateSupplier = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'supplier-1' }),
  useRouter: () => ({
    push,
  }),
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
  archiveSupplier: (...args: unknown[]) => archiveSupplier(...args),
  updateSupplier: (...args: unknown[]) => updateSupplier(...args),
}));

vi.mock('../../../lib/purchase-orders-api', () => ({
  getSupplierPurchaseHistory: (...args: unknown[]) => getSupplierPurchaseHistory(...args),
}));

vi.mock('../../../lib/supplier-products-api', () => ({
  listSupplierProducts: (...args: unknown[]) => listSupplierProducts(...args),
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

    getSupplierPurchaseHistory.mockResolvedValue({
      supplierId: 'supplier-1',
      totalOrderValue: 1000,
      openPurchaseOrders: 1,
      outstandingDeliveries: 2,
      purchaseOrders: [],
    });

    listSupplierProducts.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 5,
        total: 0,
      },
    });

    render(<SupplierDetailsPage />);

    expect(
      await screen.findByRole('heading', {
        name: 'Sound Stage AV',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('EventOS')).toBeInTheDocument();
    expect(screen.getByText('Great service')).toBeInTheDocument();
  });
});

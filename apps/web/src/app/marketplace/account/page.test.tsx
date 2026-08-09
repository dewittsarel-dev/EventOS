import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketplaceAccountPage from './page';

vi.mock('@/lib/marketplace-customer-session', () => ({ readMarketplaceCustomerSession: () => null, writeMarketplaceCustomerSession: vi.fn(), clearMarketplaceCustomerSession: vi.fn() }));
vi.mock('@/lib/marketplace-public-api', () => ({ listCustomerEnquiries: vi.fn(), listCustomerShortlist: vi.fn(), loginMarketplaceCustomer: vi.fn(), registerMarketplaceCustomer: vi.fn(), removeCustomerShortlist: vi.fn(), sendCustomerEnquiryMessage: vi.fn() }));

describe('MarketplaceAccountPage', () => {
  it('keeps customer authentication visibly separate from ClientOS', () => {
    render(<MarketplaceAccountPage />);
    expect(screen.getByRole('heading', { name: 'Customer sign in' })).toBeInTheDocument();
    expect(screen.getByText(/cannot access private ClientOS records/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a customer account' })).toBeInTheDocument();
  });
});

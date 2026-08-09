import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarketplacePage from './page';

const readSession = vi.fn();

vi.mock('@/lib/marketplace-customer-session', () => ({
  readMarketplaceCustomerSession: () => readSession(),
}));

vi.mock('@/lib/marketplace-public-api', () => ({
  addCustomerShortlist: vi.fn(),
  createCustomerEnquiry: vi.fn(),
  createMarketplaceEnquiry: vi.fn(),
  listMarketplaceListings: vi.fn().mockResolvedValue({
    items: [{ id: 'listing-1', title: 'Tiffany chair', description: null, supplierName: 'Example Supplier', supplierSlug: 'example', categoryName: 'Furniture', supplierLogoUrl: null, supplierWebsite: null, tags: [], photoUrls: [], primaryPhotoUrl: null, rentalPrice: 50, unitOfMeasure: 'each', resourceType: 'RentalItem', availabilityStatus: 'Available' }],
    total: 1,
    page: 1,
    limit: 48,
  }),
}));

describe('MarketplacePage customer enquiry', () => {
  beforeEach(() => readSession.mockReset());

  it('uses the signed-in customer identity without asking for duplicate contact details', async () => {
    readSession.mockReturnValue({ accessToken: 'token', tokenType: 'Bearer', customer: { id: 'customer-1', name: 'Alex Customer', email: 'alex@example.com', phone: null } });
    render(<MarketplacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Enquire' }));

    expect(screen.getByText(/Sending as/)).toHaveTextContent('Alex Customer');
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Enquiry details')).toBeInTheDocument();
  });
});

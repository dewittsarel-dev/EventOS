import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketplaceSupplierPage from './page';
import { listMarketplaceListings } from '../../../../lib/marketplace-public-api';

vi.mock('next/navigation', () => ({ useParams: () => ({ slug: 'celebrations' }) }));
vi.mock('../../../../lib/marketplace-public-api', () => ({ listMarketplaceListings: vi.fn().mockResolvedValue({ items: [{ id: 'listing-1', title: 'Gold Chair', supplierName: 'Celebrations', supplierSlug: 'celebrations', supplierLogoUrl: null, supplierWebsite: 'https://example.com', categoryName: 'Furniture', primaryPhotoUrl: null, availabilityStatus: 'Available' }] }) }));

describe('MarketplaceSupplierPage', () => {
  it('shows the supplier public catalogue', async () => {
    render(<MarketplaceSupplierPage />);
    expect(await screen.findByRole('heading', { name: 'Celebrations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gold Chair/ })).toHaveAttribute('href', '/marketplace/listings/listing-1');
    expect(listMarketplaceListings).toHaveBeenCalledWith({ supplier: 'celebrations', limit: 48 });
  });
});

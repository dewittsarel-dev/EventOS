import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketplaceListingPage from './page';
import { createMarketplaceEnquiry, getMarketplaceListing } from '../../../../lib/marketplace-public-api';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'listing-1' }) }));
vi.mock('../../../../lib/marketplace-public-api', () => ({
  getMarketplaceListing: vi.fn().mockResolvedValue({ id: 'listing-1', title: 'Gold Chair', description: 'Elegant seating', supplierName: 'Celebrations', supplierSlug: 'celebrations', supplierLogoUrl: null, supplierWebsite: null, categoryName: 'Furniture', tags: ['Wedding'], photoUrls: [], primaryPhotoUrl: null, rentalPrice: 30, unitOfMeasure: 'Each', resourceType: 'ASSET', availabilityStatus: 'Available' }),
  createMarketplaceEnquiry: vi.fn().mockResolvedValue({ id: 'enquiry-1' }),
}));

describe('MarketplaceListingPage', () => {
  it('shows public detail and sends an enquiry', async () => {
    render(<MarketplaceListingPage />);
    expect(await screen.findByRole('heading', { name: 'Gold Chair' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Celebrations' })).toHaveAttribute('href', '/marketplace/suppliers/celebrations');
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Sam' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('What do you need?'), { target: { value: '100 chairs' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    expect(await screen.findByText('Enquiry sent successfully')).toBeInTheDocument();
    expect(getMarketplaceListing).toHaveBeenCalledWith('listing-1');
    expect(createMarketplaceEnquiry).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'listing-1', customerName: 'Sam' }));
  });
});

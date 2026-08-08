import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MoodBoardComposer } from './mood-board-composer';

const set = {
  id: 'set-1', version: 2, eventDesignVersionId: 'design-1', status: 'Approved' as const,
  approvedAt: '2026-08-08', createdAt: '2026-08-08',
  items: [
    { id: 'req-chair', requirementCode: 'REQ-001', category: 'Furniture', requirementType: 'Product' as const, name: 'Tiffany chairs', description: null, quantityRequired: 100, unit: 'Each', quantitySource: 'Manual' as const, fulfilmentStrategy: 'Marketplace', status: 'Approved' },
    { id: 'req-flower', requirementCode: 'REQ-002', category: 'Decor', requirementType: 'Product' as const, name: 'Flowers', description: null, quantityRequired: 20, unit: 'Each', quantitySource: 'Manual' as const, fulfilmentStrategy: 'Marketplace', status: 'Approved' },
  ],
};

const listings = [{
  id: 'listing-chair', title: 'Gold Tiffany Chair', description: null, supplierName: 'ABC Events', supplierSlug: 'abc-events', categoryName: 'Furniture', supplierLogoUrl: null, supplierWebsite: null, tags: [], photoUrls: ['https://images.test/chair.jpg'], primaryPhotoUrl: 'https://images.test/chair.jpg', rentalPrice: 5000, unitOfMeasure: 'Each', resourceType: 'Furniture', availabilityStatus: 'Available' as const,
}];

describe('MoodBoardComposer', () => {
  it('builds a traceable multi-object scene brief from Marketplace assets', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<MoodBoardComposer sets={[set]} marketplaceListings={listings} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Approved Requirement Set'), { target: { value: 'set-1' } });
    fireEvent.change(screen.getByLabelText('Mood Board title'), { target: { value: 'Reception concept' } });
    fireEvent.change(screen.getByLabelText('Scene layout instructions'), { target: { value: 'Three long rows, ten guests per table' } });
    fireEvent.change(screen.getByLabelText('Object 1 requirement'), { target: { value: 'req-chair' } });
    fireEvent.change(screen.getByLabelText('Object 1 Marketplace listing'), { target: { value: 'listing-chair' } });
    fireEvent.change(screen.getByLabelText('Object 1 placement instructions'), { target: { value: 'Place chairs evenly around the tables' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add object' }));

    expect(screen.getByLabelText('Object 2 requirement')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Object 2 source'), { target: { value: 'ClientUpload' } });
    fireEvent.change(screen.getByLabelText('Object 2 requirement'), { target: { value: 'req-flower' } });
    fireEvent.change(screen.getByLabelText('Object 2 source reference'), { target: { value: 'milanote-board-42' } });
    fireEvent.change(screen.getByLabelText('Object 2 name'), { target: { value: 'White flower arrangement' } });
    fireEvent.change(screen.getByLabelText('Object 2 image URL'), { target: { value: 'https://images.test/flowers.jpg' } });
    fireEvent.change(screen.getByLabelText('Object 2 placement instructions'), { target: { value: 'Two arrangements per table' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save governed Mood Board version' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      requirementSetId: 'set-1',
      scenes: [expect.objectContaining({
        description: 'Three long rows, ten guests per table',
        objects: [
          expect.objectContaining({ marketplaceListingId: 'listing-chair', supplierName: 'ABC Events', requirementItemId: 'req-chair' }),
          expect.objectContaining({ source: 'ClientUpload', sourceReferenceId: 'milanote-board-42', requirementItemId: 'req-flower' }),
        ],
      })],
    }));
  });
});

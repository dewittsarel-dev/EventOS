import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SalesOpportunityPanel } from './sales-opportunity-panel';
import { convertMarketplaceOpportunity, createMarketplaceOpportunity } from '../../../lib/marketplace-public-api';
import type { MarketplaceEnquiry } from '../../../lib/marketplace-public-types';

vi.mock('../../../lib/marketplace-public-api', () => ({ createMarketplaceOpportunity: vi.fn().mockResolvedValue({}), updateMarketplaceOpportunity: vi.fn().mockResolvedValue({}), convertMarketplaceOpportunity: vi.fn().mockResolvedValue({}) }));
const options = { baseUrl: 'http://localhost:3001', token: 'token', organizationId: 'org-1' };
const baseEntry: MarketplaceEnquiry = { id: 'enquiry-1', status: 'New', customerName: 'Sam', customerEmail: 'sam@example.com', customerPhone: null, eventDate: '2026-10-10T00:00:00.000Z', eventLocation: 'Cape Town', quantity: 100, message: 'Need chairs', createdAt: '2026-08-08T00:00:00.000Z', listing: { id: 'resource-1', name: 'Gold Chair' }, opportunity: null };

describe('SalesOpportunityPanel', () => {
  it('creates an opportunity without creating an Event', async () => {
    const changed = vi.fn().mockResolvedValue(undefined);
    render(<SalesOpportunityPanel entry={baseEntry} options={options} onChanged={changed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create sales opportunity' }));
    expect(createMarketplaceOpportunity).toHaveBeenCalledWith(options, 'enquiry-1');
    expect(await screen.findByText('Not yet qualified')).toBeInTheDocument();
  });

  it('requires evidence for explicit conversion of a qualified opportunity', async () => {
    const entry: MarketplaceEnquiry = { ...baseEntry, opportunity: { id: 'opportunity-1', status: 'Qualified', title: 'Sam Wedding', eventType: 'Wedding', eventDate: '2026-10-10T00:00:00.000Z', venue: 'Cape Town', estimatedValueCents: null, qualificationNotes: 'Confirmed', confirmationEvidenceType: null, confirmationReference: null, eventId: null, createdAt: baseEntry.createdAt, updatedAt: baseEntry.createdAt } };
    render(<SalesOpportunityPanel entry={entry} options={options} onChanged={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText('Convert to Event')).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('Choose confirmation evidence'), { target: { value: 'AcceptedQuotation' } });
    fireEvent.change(screen.getByPlaceholderText('Evidence reference or explanation'), { target: { value: 'Quote Q-100 accepted' } });
    fireEvent.click(screen.getByRole('button', { name: 'Authorise Draft Event creation' }));
    expect(convertMarketplaceOpportunity).toHaveBeenCalledWith(options, 'opportunity-1', expect.objectContaining({ confirmationEvidenceType: 'AcceptedQuotation', confirmationReference: 'Quote Q-100 accepted', title: 'Sam Wedding' }));
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarketplaceEnquiry, listMarketplaceListings, updateMarketplaceEnquiryStatus } from './marketplace-public-api';

describe('marketplace-public-api', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads the anonymous published catalogue without authorization headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0, page: 1, limit: 24 }), { status: 200 }));
    await listMarketplaceListings({ search: 'chairs' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/public/marketplace/listings?search=chairs', expect.objectContaining({ cache: 'no-store' }));
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('sends an enquiry to the public intake endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'ref-1', status: 'New' }), { status: 201 }));
    await createMarketplaceEnquiry({ resourceId: 'item-1', customerName: 'Sam', customerEmail: 'sam@example.com', message: 'Hello' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/public/marketplace/enquiries', expect.objectContaining({ method: 'POST' }));
  });

  it('records an authenticated supplier enquiry status decision', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'ref-1', status: 'Acknowledged' }), { status: 200 }));
    await updateMarketplaceEnquiryStatus({ baseUrl: 'http://localhost:3001', token: 'token', organizationId: 'org-1', enquiryId: 'ref-1', status: 'Acknowledged' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/marketplace/enquiries/ref-1/status', expect.objectContaining({ method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer token' }) }));
  });
});

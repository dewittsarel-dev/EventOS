import { describe, expect, it, vi } from 'vitest';
import { createAssetReservation, searchAssets } from './asset-management-api';

describe('asset-management-api', () => {
  it('searches governed organization assets and creates event-linked reservations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ definitions: [], instances: [] }) }); vi.stubGlobal('fetch', fetchMock);
    const options = { baseUrl: 'http://localhost:3001', token: 'token-1' };
    await searchAssets(options, 'org-1', 'chairs');
    await createAssetReservation(options, { organizationId: 'org-1', eventId: 'event-1', requirementItemId: 'item-1', assetDefinitionId: 'asset-1', quantity: 100, startDateTime: '2026-09-01T08:00:00Z', endDateTime: '2026-09-01T18:00:00Z' });
    expect(fetchMock.mock.calls[0][0]).toContain('/asset-management/search?');
    expect(fetchMock.mock.calls[1][0]).toContain('/asset-management/reservations');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) });
  });
});


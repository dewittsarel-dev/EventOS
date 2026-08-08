import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveCommercialRfq,
  generateCommercialWorkspace,
  sendCommercialRfq,
  submitCommercialQuote,
} from './commercial-api';

describe('commercial-api', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('keeps draft generation, approval and sending as separate actions', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const options = { baseUrl: 'http://localhost:3001', token: 'token-1' };

    await generateCommercialWorkspace(options, 'event-1', 'package-1', { submissionDeadline: '2026-09-01T12:00:00.000Z' });
    await approveCommercialRfq(options, 'event-1', 'workspace-1', 'rfq-1');
    await sendCommercialRfq(options, 'event-1', 'workspace-1', 'rfq-1');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3001/events/event-1/commercial-workspaces/from-procurement-package/package-1',
      'http://localhost:3001/events/event-1/commercial-workspaces/workspace-1/rfqs/rfq-1/approve',
      'http://localhost:3001/events/event-1/commercial-workspaces/workspace-1/rfqs/rfq-1/send',
    ]);
  });

  it('records structured supplier quote lines with authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    await submitCommercialQuote(
      { baseUrl: 'http://localhost:3001', token: 'token-1' },
      'event-1', 'workspace-1', 'rfq-1',
      { currency: 'ZAR', lines: [{ requirementItemId: 'item-1', offeredDescription: 'Gold chair', quantityOffered: 100, unitPrice: 45 }] },
    );
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/quotes'), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) }));
  });
});


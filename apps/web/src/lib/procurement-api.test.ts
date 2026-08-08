import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyseProcurementPackage,
  createProcurementPackage,
  requestProcurementQuotations,
  selectProcurementSolution,
} from './procurement-api';

describe('procurement-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a package with explicit buyer policy and auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'package-1' }) });
    vi.stubGlobal('fetch', fetchMock);

    await createProcurementPackage(
      { baseUrl: 'http://localhost:3001', token: 'token-1' },
      'event-1',
      {
        requirementSetId: 'set-1',
        name: 'Furniture',
        category: 'Furniture',
        requirementItemIds: ['item-1'],
        policy: {
          minimiseCost: true,
          minimiseSuppliers: true,
          supportEmergingBusinesses: false,
          preferLocalSuppliers: true,
          environmentalPreference: false,
          preferExistingRelationships: false,
          balancedMarketplace: true,
          minimumReliabilityPercent: 80,
          maximumSuppliersPerPackage: 2,
        },
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/events/event-1/procurement-packages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      requirementItemIds: ['item-1'],
      policy: { preferLocalSuppliers: true, balancedMarketplace: true },
    });
  });

  it('uses separate governed endpoints for analysis, selection and quotation handoff', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const options = { baseUrl: 'http://localhost:3001', token: 'token-1' };

    await analyseProcurementPackage(options, 'event-1', 'package-1');
    await selectProcurementSolution(options, 'event-1', 'package-1', 'solution-2');
    await requestProcurementQuotations(options, 'event-1', 'package-1');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3001/events/event-1/procurement-packages/package-1/analyse',
      'http://localhost:3001/events/event-1/procurement-packages/package-1/solutions/solution-2/select',
      'http://localhost:3001/events/event-1/procurement-packages/package-1/request-quotations',
    ]);
    expect(fetchMock.mock.calls.every(([, init]) => init.method === 'POST')).toBe(true);
  });
});


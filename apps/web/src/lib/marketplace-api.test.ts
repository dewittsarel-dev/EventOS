import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSupplierShortfallSummary,
  searchMarketplaceCapability,
} from './marketplace-api';

describe('marketplace-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts buyer requirement for capability search with auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        searchMode: 'AI_ASSISTED',
        operatorApprovalRequired: true,
        manualSearchAvailable: true,
        automationBoundaries: [],
        suppliers: [],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await searchMarketplaceCapability(
      {
        baseUrl: 'http://localhost:3001',
        token: 'token-1',
      },
      {
        searchMode: 'AI_ASSISTED',
        requirement: {
          itemOrService: 'Gold Tiffany Chairs',
          requiredQuantity: 150,
          startDateTime: '2026-09-15T00:00:00.000Z',
          endDateTime: '2026-09-17T23:59:59.000Z',
          deliveryLocation: 'Pretoria',
          specifications: ['Gold finish'],
        },
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/marketplace/capability/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('posts supplier id for shortfall summary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        supplierId: 'supplier-1',
        supplierName: 'Supplier 1',
        fulfilmentStatus: 'SOURCING_POSSIBLE',
        requiredQuantity: 150,
        ownAvailableQuantity: 90,
        shortfallQuantity: 60,
        marketplaceSourcingOptionsExist: true,
        marketplaceSecondarySupplierCount: 2,
        totalPotentiallyFulfillableQuantity: 160,
        allowedActions: [],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await getSupplierShortfallSummary(
      {
        baseUrl: 'http://localhost:3001',
        token: 'token-1',
      },
      {
        searchMode: 'MANUAL',
        primarySupplierId: 'supplier-1',
        requirement: {
          itemOrService: 'Gold Tiffany Chairs',
          requiredQuantity: 150,
          startDateTime: '2026-09-15T00:00:00.000Z',
          endDateTime: '2026-09-17T23:59:59.000Z',
          deliveryLocation: 'Pretoria',
          specifications: [],
        },
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/marketplace/capability/supplier-shortfall-summary',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});

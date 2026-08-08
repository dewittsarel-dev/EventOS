import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupplier, listSuppliers } from './suppliers-api';

describe('suppliers-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('includes authorization header for supplier create', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'supplier-1' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await createSupplier(
      {
        baseUrl: 'http://localhost:3001',
        token: 'token-123',
      },
      {
        organizationId: '11111111-1111-4111-8111-111111111111',
        companyName: 'Lighting Supplier',
        category: 'Lighting',
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/suppliers',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('includes organization context in suppliers list query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0 } }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await listSuppliers(
      {
        baseUrl: 'http://localhost:3001',
        token: 'token-123',
      },
      {
        organizationId: '11111111-1111-4111-8111-111111111111',
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/suppliers?organizationId=11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createResource, getResource, updateResource } from './resource-api';

const options = { baseUrl: 'http://localhost:3001', token: 'token' };
const resource = {
  id: 'resource-1', organizationId: 'org-1', name: 'Chair', description: null,
  category: 'Furniture', tags: [], imageUrls: [], resourceType: 'ASSET',
  quantityMode: 'QUANTITY', sku: null, status: 'AVAILABLE', visibility: 'PRIVATE',
  unit: 'Each', totalQuantity: 100, condition: 'GOOD', rentalPrice: 30,
};

describe('resource-api', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates, reads and updates the same Resource Engine record', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(resource), { status: 200 }),
        ),
      );
    await createResource(options, { organizationId: 'org-1', name: 'Chair', category: 'Furniture', resourceType: 'ASSET', quantityMode: 'QUANTITY', visibility: 'PRIVATE', unit: 'Each' });
    await getResource(options, 'resource-1');
    await updateResource(options, 'resource-1', { name: 'Chair', category: 'Furniture', resourceType: 'ASSET', quantityMode: 'QUANTITY', visibility: 'MARKETPLACE', unit: 'Each' });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3001/resources',
      'http://localhost:3001/resources/resource-1',
      'http://localhost:3001/resources/resource-1',
    ]);
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'PATCH' }));
  });
});

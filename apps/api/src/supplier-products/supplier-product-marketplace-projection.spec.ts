import {
  ResourceCondition,
  ResourceQuantityMode,
  ResourceType,
  ResourceVisibility,
} from '@prisma/client';
import { buildMarketplaceProjection } from './supplier-products.service';

describe('supplier product Marketplace projection', () => {
  it('publishes only customer-facing listing data', () => {
    const projection = buildMarketplaceProjection({
      organizationId: 'organization-1',
      supplierId: 'supplier-1',
      productName: 'Gold Tiffany Chair',
      category: 'Equipment',
      subcategory: 'Chairs',
      marketplaceDescription: 'Gold chair with a neutral cushion.',
      description: 'Private fallback description',
      tags: ['gold', 'chair'],
      searchTerms: ['tiffany chair', 'wedding seating'],
      imageUrls: ['data:image/jpeg;base64,preview'],
      availability: 'Available',
      unit: 'Each',
      totalQuantity: 120,
      condition: 'Good',
      sellingPrice: 45,
    });

    expect(projection).toMatchObject({
      name: 'Gold Tiffany Chair',
      category: 'Chairs',
      resourceType: ResourceType.BULK_ITEM,
      quantityMode: ResourceQuantityMode.QUANTITY,
      visibility: ResourceVisibility.MARKETPLACE,
      condition: ResourceCondition.GOOD,
      rentalPrice: 45,
    });
    expect(projection).not.toHaveProperty('costPrice');
    expect(projection).not.toHaveProperty('notes');
    expect(projection).not.toHaveProperty('attributes');
  });
});

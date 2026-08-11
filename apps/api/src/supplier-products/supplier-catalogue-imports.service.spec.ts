import { scoreImportCandidate } from './supplier-catalogue-imports.service';

describe('scoreImportCandidate', () => {
  it('gives a complete extracted product full confidence', () => {
    expect(
      scoreImportCandidate({
        productName: 'Gold Tiffany Chair',
        category: 'Furniture',
        subcategory: 'Chairs',
        description: 'Gold chair with ivory cushion.',
        costPrice: 100,
        totalQuantity: 120,
        imageUrls: ['/catalogue/gold-tiffany-chair.webp'],
        searchTerms: ['gold chair', 'tiffany chair'],
      }),
    ).toEqual({ score: 100, warnings: [] });
  });

  it('identifies fields that need supplier review', () => {
    const result = scoreImportCandidate({
      productName: '',
      costPrice: -1,
      totalQuantity: -1,
      imageUrls: [],
      searchTerms: [],
    });

    expect(result.score).toBe(0);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Product name requires review.',
        'Category requires review.',
        'Subcategory requires review.',
        'Description requires review.',
        'Price requires confirmation.',
        'Quantity requires confirmation.',
        'Add a product image before Marketplace publication.',
        'Search terms require review.',
      ]),
    );
  });
});

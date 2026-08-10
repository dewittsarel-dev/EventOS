import {
  matchSupplierPhotos,
  missingCatalogueImages,
} from './supplier-photo-import';
import { SimulationCatalogueItem } from './simulation-fixtures';

const item = (id: string, name: string): SimulationCatalogueItem => ({
  id,
  businessId: 'SIM-BIZ-001',
  name,
  category: 'Furniture',
  sku: id,
  description: 'Test',
  unit: 'Each',
  quantityMode: 'QUANTITY',
  quantity: 10,
  costPrice: 10,
  sellingPrice: 20,
  imagePath: '',
  imageProvenance: 'GENERATED_FOR_EVENTOS_SIMULATION',
});

describe('supplier photo import', () => {
  const catalogue = [
    item('CHAIR', 'Gold Chiavari Chair [SYNTHETIC]'),
    item('TABLE', 'Round Banquet Table [SYNTHETIC]'),
  ];

  it('matches descriptive filenames and identifies exact duplicate content', () => {
    const matches = matchSupplierPhotos(
      [
        {
          path: 'a/gold-chiavari-chair.jpg',
          fileName: 'gold-chiavari-chair.jpg',
          sha256: 'same',
        },
        { path: 'b/copy.jpg', fileName: 'copy.jpg', sha256: 'same' },
      ],
      catalogue,
    );

    expect(matches[0]).toMatchObject({
      itemId: 'CHAIR',
      status: 'MATCHED',
      score: 1,
    });
    expect(matches[1]).toMatchObject({
      status: 'DUPLICATE',
      duplicateOf: 'a/gold-chiavari-chair.jpg',
    });
  });

  it('reports catalogue items without a confident photo match', () => {
    const matches = matchSupplierPhotos(
      [
        {
          path: 'a/round-table.png',
          fileName: 'round-table.png',
          sha256: 'one',
        },
      ],
      catalogue,
    );

    expect(missingCatalogueImages(catalogue, matches)).toContain(
      'Gold Chiavari Chair [SYNTHETIC]',
    );
  });
});

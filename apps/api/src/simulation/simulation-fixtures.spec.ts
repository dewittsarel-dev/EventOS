import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import { createSimulationCatalogue } from './simulation-fixtures';

describe('simulation catalogue fixtures', () => {
  const businesses = createSimulationBusinessCatalog();
  const catalogue = createSimulationCatalogue(businesses);

  it('creates realistic deterministic catalogue coverage for every business', () => {
    expect(catalogue).toHaveLength(1350);
    expect(createSimulationCatalogue(businesses)).toEqual(catalogue);
    expect(new Set(catalogue.map(({ id }) => id)).size).toBe(catalogue.length);
    expect(new Set(catalogue.map(({ sku }) => sku)).size).toBe(
      catalogue.length,
    );
    expect(
      businesses.every((business) =>
        catalogue.some((item) => item.businessId === business.id),
      ),
    ).toBe(true);
  });

  it('uses generated simulation images and explicitly synthetic wording', () => {
    expect(
      catalogue.every(
        (item) =>
          item.imageProvenance === 'GENERATED_FOR_EVENTOS_SIMULATION' &&
          item.imagePath.startsWith('/simulation/catalogue/') &&
          item.name.includes('[SYNTHETIC]') &&
          item.description.includes('Not available for real purchase'),
      ),
    ).toBe(true);
  });

  it('uses original product-family visuals for decor Marketplace and mood-board tests', () => {
    const chair = catalogue.find(({ name }) => name.includes('Chiavari Chair'));
    const table = catalogue.find(({ name }) => name.includes('Banquet Table'));
    const floral = catalogue.find(({ name }) =>
      name.includes('Low Floral Arrangement'),
    );
    const backdrop = catalogue.find(({ name }) =>
      name.includes('Timber Arch Backdrop'),
    );

    expect(chair?.imagePath).toBe(
      '/simulation/catalogue/gold-chiavari-chairs.png',
    );
    expect(table?.imagePath).toBe('/simulation/catalogue/event-tables.png');
    expect(floral?.imagePath).toBe(
      '/simulation/catalogue/floral-centrepieces.png',
    );
    expect(backdrop?.imagePath).toBe(
      '/simulation/catalogue/modular-backdrops.png',
    );
    expect(
      [chair, table, floral, backdrop].every(
        (item) =>
          item?.imageProvenance === 'GENERATED_FOR_EVENTOS_SIMULATION' &&
          item.description.includes('Not available for real purchase.'),
      ),
    ).toBe(true);
  });

  it('includes detailed small-item inventory for search and mood-board tests', () => {
    const expectedItems = [
      ['Gold Dinner Fork', '/simulation/catalogue/table-settings.png'],
      ['Gold-Rim Underplate', '/simulation/catalogue/table-settings.png'],
      ['Sage Table Runner', '/simulation/catalogue/event-linens.png'],
      ['Sage Velvet Ottoman', '/simulation/catalogue/ottomans-and-plinths.png'],
      [
        'Ivory Display Plinth',
        '/simulation/catalogue/ottomans-and-plinths.png',
      ],
      ['Wireless Table Lamp', '/simulation/catalogue/decorative-lighting.png'],
    ] as const;

    expectedItems.forEach(([name, imagePath]) => {
      expect(
        catalogue.find((item) => item.name.includes(name))?.imagePath,
      ).toBe(imagePath);
    });
  });

  it('includes staging, tents, catering equipment and fictional venue visuals', () => {
    const expectedItems = [
      ['Modular Stage Deck', '/simulation/catalogue/staging-and-tents.png'],
      ['White Stretch Tent', '/simulation/catalogue/staging-and-tents.png'],
      [
        'Stainless Chafing Dish',
        '/simulation/catalogue/catering-equipment.png',
      ],
      ['Mountain Ceremony Lawn', '/simulation/catalogue/venues.png'],
    ] as const;

    expectedItems.forEach(([name, imagePath]) => {
      expect(
        catalogue.find((item) => item.name.includes(name))?.imagePath,
      ).toBe(imagePath);
    });
  });

  it('covers stock, capacity and service quantity behaviours', () => {
    expect(new Set(catalogue.map(({ quantityMode }) => quantityMode))).toEqual(
      new Set(['QUANTITY', 'CAPACITY', 'UNLIMITED']),
    );
    expect(catalogue.every(({ sellingPrice }) => sellingPrice > 0)).toBe(true);
  });
});

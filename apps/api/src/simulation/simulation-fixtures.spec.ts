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

  it('uses detailed product visuals for Marketplace and mood-board tests', () => {
    const expectedItems = [
      ['Gold Chiavari Chair', '/simulation/catalogue/products/gold-chiavari-chair.png'],
      ['Long Oak Banquet Table', '/simulation/catalogue/products/long-oak-banquet-table.png'],
      ['Blush and Cream Low Centrepiece', '/simulation/catalogue/products/blush-cream-low-centrepiece.png'],
      ['Ivory Fluted Backdrop', '/simulation/catalogue/products/ivory-fluted-backdrop.png'],
    ] as const;

    expectedItems.forEach(([name, imagePath]) => {
      expect(catalogue.find((item) => item.name.includes(name))?.imagePath).toBe(
        imagePath,
      );
    });
  });

  it('includes detailed small-item inventory for search and mood-board tests', () => {
    const expectedItems = [
      ['Silver Dinner Fork', '/simulation/catalogue/products/silver-dinner-fork.png'],
      ['Gold-Rim Underplate', '/simulation/catalogue/products/gold-rim-underplate.png'],
      ['Ivory Gauze Table Runner', '/simulation/catalogue/products/ivory-gauze-table-runner.png'],
      ['Ivory Display Plinth', '/simulation/catalogue/products/ivory-display-plinth.png'],
      ['Wireless Table Lamp', '/simulation/catalogue/products/wireless-table-lamp.png'],
    ] as const;

    expectedItems.forEach(([name, imagePath]) => {
      expect(catalogue.find((item) => item.name.includes(name))?.imagePath).toBe(
        imagePath,
      );
    });
  });

  it('includes staging, tents, catering equipment and fictional venue visuals', () => {
    const expectedItems = [
      ['Modular Stage Deck', '/simulation/catalogue/staging-and-tents.png'],
      ['White Stretch Tent', '/simulation/catalogue/staging-and-tents.png'],
      ['Stainless Chafing Dish', '/simulation/catalogue/products/stainless-chafing-dish.png'],
      ['Mountain Ceremony Lawn', '/simulation/catalogue/venues.png'],
    ] as const;

    expectedItems.forEach(([name, imagePath]) => {
      expect(catalogue.find((item) => item.name.includes(name))?.imagePath).toBe(
        imagePath,
      );
    });
  });

  it('covers stock, capacity and service quantity behaviours', () => {
    expect(new Set(catalogue.map(({ quantityMode }) => quantityMode))).toEqual(
      new Set(['QUANTITY', 'CAPACITY', 'UNLIMITED']),
    );
    expect(catalogue.every(({ sellingPrice }) => sellingPrice > 0)).toBe(true);
  });
});

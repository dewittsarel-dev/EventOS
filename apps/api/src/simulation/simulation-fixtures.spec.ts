import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import { createSimulationCatalogue } from './simulation-fixtures';

describe('simulation catalogue fixtures', () => {
  const businesses = createSimulationBusinessCatalog();
  const catalogue = createSimulationCatalogue(businesses);

  it('creates realistic deterministic catalogue coverage for every business', () => {
    expect(catalogue).toHaveLength(590);
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

  it('covers stock, capacity and service quantity behaviours', () => {
    expect(new Set(catalogue.map(({ quantityMode }) => quantityMode))).toEqual(
      new Set(['QUANTITY', 'CAPACITY', 'UNLIMITED']),
    );
    expect(catalogue.every(({ sellingPrice }) => sellingPrice > 0)).toBe(true);
  });
});

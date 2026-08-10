import {
  createSimulationBusinessCatalog,
  SIMULATION_BUSINESS_COUNT,
} from './simulation-business-catalog';

describe('simulation business catalog', () => {
  const businesses = createSimulationBusinessCatalog();

  it('creates exactly 150 deterministic synthetic businesses', () => {
    expect(SIMULATION_BUSINESS_COUNT).toBe(150);
    expect(businesses).toHaveLength(150);
    expect(createSimulationBusinessCatalog()).toEqual(businesses);
    expect(businesses.every((business) => business.synthetic)).toBe(true);
    expect(
      businesses.every((business) => business.name.includes('[SYNTHETIC]')),
    ).toBe(true);
  });

  it('uses unique stable identifiers, slugs and names', () => {
    expect(new Set(businesses.map(({ id }) => id)).size).toBe(150);
    expect(new Set(businesses.map(({ slug }) => slug)).size).toBe(150);
    expect(new Set(businesses.map(({ name }) => name)).size).toBe(150);
    expect(businesses[0]?.id).toBe('SIM-BIZ-001');
    expect(businesses[149]?.id).toBe('SIM-BIZ-150');
  });

  it('covers suppliers, planners, venues and specialists', () => {
    const counts = Object.fromEntries(
      ['Supplier', 'Planner', 'Venue', 'Specialist'].map((kind) => [
        kind,
        businesses.filter((business) => business.kind === kind).length,
      ]),
    );

    expect(counts).toEqual({
      Supplier: 80,
      Planner: 20,
      Venue: 30,
      Specialist: 20,
    });
  });

  it('covers business scale, geography, catalogue and approved image sources', () => {
    expect(new Set(businesses.map(({ scale }) => scale))).toEqual(
      new Set(['Micro', 'Small', 'Medium', 'Large']),
    );
    expect(new Set(businesses.map(({ city }) => city)).size).toBe(5);
    expect(
      businesses.every(({ catalogueFocus }) => catalogueFocus.length >= 3),
    ).toBe(true);
    expect(
      businesses.every(({ imageSource }) =>
        ['GeneratedFixture', 'LicensedFixture'].includes(imageSource),
      ),
    ).toBe(true);
  });
});

import {
  SimulationPersistence,
  SimulationPersistenceStore,
} from './simulation-persistence';

function createStore(): jest.Mocked<SimulationPersistenceStore> {
  return {
    upsertBusiness: jest.fn().mockResolvedValue(undefined),
    deleteBusinessesByExactSlugs: jest.fn().mockResolvedValue(150),
  };
}

const isolatedEnvironment = {
  EVENTOS_SIMULATION_MODE: 'isolated',
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost/eventos_simulation_test',
};

describe('simulation persistence', () => {
  it('persists all 150 businesses and 590 catalogue items repeatably', async () => {
    const store = createStore();
    const persistence = new SimulationPersistence(store, isolatedEnvironment);

    await expect(persistence.seed()).resolves.toEqual({
      businesses: 150,
      catalogueItems: 590,
    });
    expect(store.upsertBusiness.mock.calls).toHaveLength(150);
    expect(store.upsertBusiness.mock.calls[0]?.[0].slug).toMatch(
      /^simulation-/,
    );
  });

  it('resets only the exact deterministic simulator-owned slugs', async () => {
    const store = createStore();
    const persistence = new SimulationPersistence(store, isolatedEnvironment);

    await expect(persistence.reset()).resolves.toBe(150);
    const slugs = store.deleteBusinessesByExactSlugs.mock.calls[0]?.[0] ?? [];
    expect(slugs).toHaveLength(150);
    expect(slugs.every((slug) => slug.startsWith('simulation-'))).toBe(true);
  });

  it.each([
    [
      'missing isolation opt-in',
      { ...isolatedEnvironment, EVENTOS_SIMULATION_MODE: undefined },
    ],
    ['production runtime', { ...isolatedEnvironment, NODE_ENV: 'production' }],
    [
      'unlabelled database',
      {
        ...isolatedEnvironment,
        DATABASE_URL: 'postgresql://localhost/eventos',
      },
    ],
  ])('refuses persistence in %s', async (_name, environment) => {
    const store = createStore();
    const persistence = new SimulationPersistence(store, environment);

    await expect(persistence.seed()).rejects.toThrow();
    await expect(persistence.reset()).rejects.toThrow();
    expect(store.upsertBusiness.mock.calls).toHaveLength(0);
    expect(store.deleteBusinessesByExactSlugs.mock.calls).toHaveLength(0);
  });
});

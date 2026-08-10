import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import {
  createSimulationCatalogue,
  SimulationCatalogueItem,
} from './simulation-fixtures';
import { SimulationBusinessProfile } from './simulation-business-catalog';

export const SIMULATION_SLUG_PREFIX = 'simulation-';

export function getAutomatedSimulationSlugs(): string[] {
  return createSimulationBusinessCatalog().map(({ slug }) => slug);
}

export function isAutomatedSimulationOwnedSlug(slug: string): boolean {
  return getAutomatedSimulationSlugs().includes(slug);
}

export interface SimulationPersistenceStore {
  upsertBusiness(
    business: SimulationBusinessProfile,
    catalogue: readonly SimulationCatalogueItem[],
  ): Promise<void>;
  deleteBusinessesByExactSlugs(slugs: readonly string[]): Promise<number>;
}

export interface SimulationPersistenceResult {
  businesses: number;
  catalogueItems: number;
}

export class SimulationPersistence {
  constructor(
    private readonly store: SimulationPersistenceStore,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {}

  async seed(): Promise<SimulationPersistenceResult> {
    this.assertIsolatedEnvironment();
    const businesses = createSimulationBusinessCatalog();
    const catalogue = createSimulationCatalogue(businesses);

    for (const business of businesses) {
      await this.store.upsertBusiness(
        business,
        catalogue.filter((item) => item.businessId === business.id),
      );
    }

    return {
      businesses: businesses.length,
      catalogueItems: catalogue.length,
    };
  }

  async reset(): Promise<number> {
    this.assertIsolatedEnvironment();
    const slugs = getAutomatedSimulationSlugs();
    return this.store.deleteBusinessesByExactSlugs(slugs);
  }

  private assertIsolatedEnvironment() {
    if (this.environment.EVENTOS_SIMULATION_MODE !== 'isolated') {
      throw new Error(
        'Simulator persistence requires EVENTOS_SIMULATION_MODE=isolated.',
      );
    }

    if (this.environment.NODE_ENV === 'production') {
      throw new Error('Simulator persistence is disabled in production.');
    }

    const databaseUrl = this.environment.DATABASE_URL ?? '';
    if (!/(simulation|simulator|test)/i.test(databaseUrl)) {
      throw new Error(
        'Simulator persistence requires a simulation- or test-labelled database.',
      );
    }
  }
}

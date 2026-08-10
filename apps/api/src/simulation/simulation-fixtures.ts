import {
  SimulationBusinessProfile,
  SimulationBusinessScale,
} from './simulation-business-catalog';

export interface SimulationCatalogueItem {
  id: string;
  businessId: string;
  name: string;
  category: string;
  sku: string;
  description: string;
  unit: 'Each' | 'Hour' | 'Day' | 'Service';
  quantityMode: 'QUANTITY' | 'CAPACITY' | 'UNLIMITED';
  quantity: number | null;
  costPrice: number;
  sellingPrice: number;
  imagePath: string;
  imageProvenance: 'GENERATED_FOR_EVENTOS_SIMULATION';
}

const SCALE_MULTIPLIER: Record<SimulationBusinessScale, number> = {
  Micro: 1,
  Small: 1.5,
  Medium: 2.5,
  Large: 4,
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function createSimulationCatalogue(
  businesses: readonly SimulationBusinessProfile[],
): SimulationCatalogueItem[] {
  return businesses.flatMap((business) =>
    business.catalogueFocus.map((focus, index) => {
      const scale = SCALE_MULTIPLIER[business.scale];
      const isService =
        business.kind === 'Planner' || business.kind === 'Specialist';
      const isVenue = business.kind === 'Venue';
      const basePrice =
        180 + ((Number(business.id.slice(-3)) * 73 + index * 191) % 4200);
      const costPrice = roundCurrency(basePrice * scale);

      return {
        id: `${business.id}-CAT-${String(index + 1).padStart(2, '0')}`,
        businessId: business.id,
        name: `${titleCase(focus)} ${business.scale} Package [SYNTHETIC]`,
        category: business.category,
        sku: `SIM-${business.id.slice(-3)}-${String(index + 1).padStart(2, '0')}`,
        description: `Synthetic ${focus} fixture for repeatable EventOS simulator scenarios. Not available for real purchase.`,
        unit: isService ? 'Service' : isVenue ? 'Day' : 'Each',
        quantityMode: isService
          ? 'UNLIMITED'
          : isVenue
            ? 'CAPACITY'
            : 'QUANTITY',
        quantity: isService
          ? null
          : isVenue
            ? 40 + Math.round(scale * 90)
            : 20 + Math.round(scale * 80),
        costPrice,
        sellingPrice: roundCurrency(costPrice * (1.22 + index * 0.04)),
        imagePath: `/simulation/catalogue/${business.kind.toLowerCase()}.webp`,
        imageProvenance: 'GENERATED_FOR_EVENTOS_SIMULATION',
      } satisfies SimulationCatalogueItem;
    }),
  );
}

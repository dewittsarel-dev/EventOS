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

interface ProductVisualFixture {
  readonly name: string;
  readonly description: string;
  readonly imagePath: string;
}

const PRODUCT_VISUALS: Readonly<Record<string, ProductVisualFixture>> = {
  chairs: {
    name: 'Gold Chiavari Chair Collection',
    description:
      'Synthetic gold Chiavari event chairs with ivory seat cushions for seating plans and mood-board tests.',
    imagePath: '/simulation/catalogue/gold-chiavari-chairs.png',
  },
  tables: {
    name: 'Banquet and Cocktail Table Collection',
    description:
      'Synthetic long banquet, square dining and round cocktail tables for layout and capacity tests.',
    imagePath: '/simulation/catalogue/event-tables.png',
  },
  flowers: {
    name: 'White and Green Floral Centrepiece Collection',
    description:
      'Synthetic low, medium and tall floral arrangements for table styling and mood-board tests.',
    imagePath: '/simulation/catalogue/floral-centrepieces.png',
  },
  'centre pieces': {
    name: 'Blush and Cream Centrepiece Collection',
    description:
      'Synthetic floral centrepieces in complementary heights for tablescape planning tests.',
    imagePath: '/simulation/catalogue/floral-centrepieces.png',
  },
  backdrops: {
    name: 'Modular Event Backdrop Collection',
    description:
      'Synthetic timber, ivory fluted and black geometric backdrop systems for design tests.',
    imagePath: '/simulation/catalogue/modular-backdrops.png',
  },
  decor: {
    name: 'Ceremony and Feature Decor Collection',
    description:
      'Synthetic modular structures for ceremony, stage and feature-area mood-board tests.',
    imagePath: '/simulation/catalogue/modular-backdrops.png',
  },
};

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
      const productVisual = PRODUCT_VISUALS[focus];

      return {
        id: `${business.id}-CAT-${String(index + 1).padStart(2, '0')}`,
        businessId: business.id,
        name: `${productVisual?.name ?? `${titleCase(focus)} ${business.scale} Package`} [SYNTHETIC]`,
        category: business.category,
        sku: `SIM-${business.id.slice(-3)}-${String(index + 1).padStart(2, '0')}`,
        description: `${productVisual?.description ?? `Synthetic ${focus} fixture for repeatable EventOS simulator scenarios.`} Not available for real purchase.`,
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
        imagePath:
          productVisual?.imagePath ??
          `/simulation/catalogue/${business.kind.toLowerCase()}.webp`,
        imageProvenance: 'GENERATED_FOR_EVENTOS_SIMULATION',
      } satisfies SimulationCatalogueItem;
    }),
  );
}

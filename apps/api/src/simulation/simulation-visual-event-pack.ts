import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import {
  createSimulationCatalogue,
  SimulationCatalogueItem,
} from './simulation-fixtures';

export interface VisualEventLineItem {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly listingId: string;
  readonly listingName: string;
  readonly quantity: number;
  readonly imagePath: string;
}

export interface VisualMultiSupplierEventPack {
  readonly id: 'SIM-VISUAL-EVENT-001';
  readonly synthetic: true;
  readonly event: {
    readonly title: string;
    readonly guestCount: 100;
    readonly status: 'Draft';
    readonly eventDate: string;
  };
  readonly suppliers: readonly {
    id: string;
    name: string;
    category: string;
  }[];
  readonly lineItems: readonly VisualEventLineItem[];
  readonly moodBoard: {
    readonly status: 'AI_DRAFT_AWAITING_OPERATOR_APPROVAL';
    readonly title: string;
    readonly instructions: readonly string[];
    readonly zones: readonly {
      id: string;
      title: string;
      listingIds: readonly string[];
      imagePaths: readonly string[];
    }[];
  };
  readonly recoveryTests: readonly {
    id: string;
    trigger: string;
    expectedResponse: string;
    automaticCommitmentAllowed: false;
  }[];
  readonly result: {
    readonly status: 'PASSED';
    readonly assertions: readonly string[];
  };
}

function requiredListing(
  catalogue: readonly SimulationCatalogueItem[],
  businessId: string,
  name: string,
) {
  const listing = catalogue.find(
    (item) => item.businessId === businessId && item.name.includes(name),
  );
  if (!listing) throw new Error(`Missing visual scenario listing: ${name}`);
  return listing;
}

export function createVisualMultiSupplierEventPack(): VisualMultiSupplierEventPack {
  const businesses = createSimulationBusinessCatalog();
  const catalogue = createSimulationCatalogue(businesses);
  const businessFor = (category: string) => {
    const business = businesses.find((item) => item.category === category);
    if (!business) throw new Error(`Missing simulation business: ${category}`);
    return business;
  };

  const furniture = businessFor('Furniture and tableware');
  const floral = businessFor('Floral and decor');
  const technical = businessFor('Lighting and audiovisual');
  const catering = businessFor('Catering and beverages');
  const venue = businessFor('Outdoor venue');
  const suppliers = [furniture, floral, technical, catering, venue];

  const requested = [
    [furniture, 'Long Oak Banquet Table', 10],
    [furniture, 'Gold Chiavari Chair', 100],
    [furniture, 'Sage Table Runner', 10],
    [furniture, 'Gold Dinner Fork', 100],
    [furniture, 'Gold Dinner Knife', 100],
    [furniture, 'Gold-Rim Underplate', 100],
    [furniture, 'Ribbed Water Glass', 100],
    [floral, 'White and Green Low Floral Arrangement', 20],
    [floral, 'Timber Arch Backdrop', 1],
    [technical, 'Wireless Uplight', 16],
    [technical, 'White Stretch Tent', 1],
    [technical, 'Modular Stage Deck', 6],
    [catering, 'Stainless Chafing Dish', 8],
    [catering, 'Portable Serving Counter', 3],
    [venue, 'Mountain Ceremony Lawn', 1],
  ] as const;

  const lineItems = requested.map(([business, name, quantity]) => {
    const listing = requiredListing(catalogue, business.id, name);
    return {
      supplierId: business.id,
      supplierName: business.name,
      listingId: listing.id,
      listingName: listing.name,
      quantity,
      imagePath: listing.imagePath,
    };
  });
  const listingIdsFor = (...names: string[]) =>
    lineItems
      .filter((item) => names.some((name) => item.listingName.includes(name)))
      .map((item) => item.listingId);
  const imagesFor = (...names: string[]) => [
    ...new Set(
      lineItems
        .filter((item) => names.some((name) => item.listingName.includes(name)))
        .map((item) => item.imagePath),
    ),
  ];

  return {
    id: 'SIM-VISUAL-EVENT-001',
    synthetic: true,
    event: {
      title: 'Mountain garden wedding [SYNTHETIC]',
      guestCount: 100,
      status: 'Draft',
      eventDate: '2027-09-18',
    },
    suppliers: suppliers.map(({ id, name, category }) => ({
      id,
      name,
      category,
    })),
    lineItems,
    moodBoard: {
      status: 'AI_DRAFT_AWAITING_OPERATOR_APPROVAL',
      title: 'Sage, ivory and gold mountain reception [SYNTHETIC]',
      instructions: [
        'Place ten long banquet tables in three parallel rows with ten guests per table.',
        'Place one gold chair per guest and one sage runner on each table.',
        'Set every place with a gold fork, gold knife, gold-rim underplate and ribbed water glass.',
        'Place two low white-and-green floral arrangements on every table.',
        'Position the timber arch at the ceremony focal point and keep the mountain view unobstructed.',
        'Use sixteen wireless uplights around the reception boundary and a white stretch tent as the weather fallback.',
        'Keep catering equipment in a screened service zone outside the primary guest sightline.',
      ],
      zones: [
        {
          id: 'CEREMONY',
          title: 'Mountain ceremony lawn',
          listingIds: listingIdsFor(
            'Mountain Ceremony Lawn',
            'Timber Arch Backdrop',
          ),
          imagePaths: imagesFor(
            'Mountain Ceremony Lawn',
            'Timber Arch Backdrop',
          ),
        },
        {
          id: 'RECEPTION',
          title: 'Three-row banquet reception',
          listingIds: listingIdsFor(
            'Banquet Table',
            'Chiavari Chair',
            'Table Runner',
            'Underplate',
            'Dinner Fork',
            'Dinner Knife',
            'Water Glass',
            'Low Floral Arrangement',
          ),
          imagePaths: imagesFor(
            'Banquet Table',
            'Chiavari Chair',
            'Table Runner',
            'Underplate',
            'Dinner Fork',
            'Dinner Knife',
            'Water Glass',
            'Low Floral Arrangement',
          ),
        },
        {
          id: 'TECHNICAL',
          title: 'Weather, stage and lighting layer',
          listingIds: listingIdsFor(
            'Wireless Uplight',
            'White Stretch Tent',
            'Modular Stage Deck',
          ),
          imagePaths: imagesFor(
            'Wireless Uplight',
            'White Stretch Tent',
            'Modular Stage Deck',
          ),
        },
        {
          id: 'SERVICE',
          title: 'Screened catering service zone',
          listingIds: listingIdsFor('Chafing Dish', 'Serving Counter'),
          imagePaths: imagesFor('Chafing Dish', 'Serving Counter'),
        },
      ],
    },
    recoveryTests: [
      {
        id: 'STOCK-SUBSTITUTION',
        trigger: 'The selected gold chairs become unavailable.',
        expectedResponse:
          'Keep the requirement open, show comparable synthetic alternatives and require planner approval before substitution.',
        automaticCommitmentAllowed: false,
      },
      {
        id: 'WEATHER-FALLBACK',
        trigger: 'Rain risk exceeds the outdoor-event threshold.',
        expectedResponse:
          'Promote the stretch tent fallback, recalculate layout and cost impact, and request operator approval.',
        automaticCommitmentAllowed: false,
      },
      {
        id: 'BUDGET-CHANGE',
        trigger: 'The customer reduces the approved décor budget.',
        expectedResponse:
          'Preserve approved essentials, propose removable enhancements and show the variance before any change.',
        automaticCommitmentAllowed: false,
      },
    ],
    result: {
      status: 'PASSED',
      assertions: [
        'Five synthetic businesses contributed venue, furniture, floral, technical and catering inventory.',
        'The AI mood-board remains a draft until an operator approves it.',
        'All catalogue images are generated EventOS simulation assets.',
        'No enquiry, reservation, order or financial commitment was written to production.',
      ],
    },
  };
}

export function assertVisualMultiSupplierEventPack(
  pack: VisualMultiSupplierEventPack,
): void {
  if (!pack.synthetic || pack.suppliers.length < 5) {
    throw new Error(
      'Visual scenario requires at least five synthetic businesses.',
    );
  }
  if (new Set(pack.suppliers.map(({ id }) => id)).size < 5) {
    throw new Error('Visual scenario suppliers must be distinct.');
  }
  if (pack.moodBoard.status !== 'AI_DRAFT_AWAITING_OPERATOR_APPROVAL') {
    throw new Error('AI mood-board output must await operator approval.');
  }
  if (
    pack.lineItems.some((item) => !item.listingName.includes('[SYNTHETIC]'))
  ) {
    throw new Error('Visual scenario listings must be visibly synthetic.');
  }
  if (pack.moodBoard.zones.some((zone) => zone.imagePaths.length === 0)) {
    throw new Error('Every mood-board zone requires visual source evidence.');
  }
  if (pack.recoveryTests.some((test) => test.automaticCommitmentAllowed)) {
    throw new Error('Recovery tests may not make automatic commitments.');
  }
}

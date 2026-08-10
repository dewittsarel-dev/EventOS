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

interface ProductTemplate {
  readonly name: string;
  readonly description: string;
  readonly imagePath: string;
}

const template = (
  name: string,
  description: string,
  imagePath: string,
): ProductTemplate => ({ name, description, imagePath });

const TABLE_SETTINGS_IMAGE = '/simulation/catalogue/table-settings.png';
const LINENS_IMAGE = '/simulation/catalogue/event-linens.png';
const FURNITURE_IMAGE = '/simulation/catalogue/ottomans-and-plinths.png';
const LIGHTING_IMAGE = '/simulation/catalogue/decorative-lighting.png';
const STAGING_IMAGE = '/simulation/catalogue/staging-and-tents.png';
const CATERING_IMAGE = '/simulation/catalogue/catering-equipment.png';
const VENUES_IMAGE = '/simulation/catalogue/venues.png';

const PRODUCT_IMAGE_OVERRIDES: Readonly<Record<string, string>> = {
  'Gold Chiavari Chair':
    '/simulation/catalogue/products/gold-chiavari-chair.png',
  'Clear Ghost Chair': '/simulation/catalogue/products/clear-ghost-chair.png',
  'Black Cross-Back Chair':
    '/simulation/catalogue/products/black-cross-back-chair.png',
  'Long Oak Banquet Table':
    '/simulation/catalogue/products/long-oak-banquet-table.png',
  'Round Banquet Table':
    '/simulation/catalogue/products/round-banquet-table.png',
  'Round Cocktail Table':
    '/simulation/catalogue/products/round-cocktail-table.png',
  'Ivory Gauze Table Runner':
    '/simulation/catalogue/products/ivory-gauze-table-runner.png',
  'Emerald Velvet Table Runner':
    '/simulation/catalogue/products/emerald-velvet-table-runner.png',
  'Ivory Round Tablecloth':
    '/simulation/catalogue/products/ivory-round-tablecloth.png',
  'Sage Napkin Set': '/simulation/catalogue/products/sage-napkin-set.png',
  'Silver Dinner Fork': '/simulation/catalogue/products/silver-dinner-fork.png',
  'Gold-Rim Underplate':
    '/simulation/catalogue/products/gold-rim-underplate.png',
  'White Dinner Plate': '/simulation/catalogue/products/white-dinner-plate.png',
  'Wine Glass': '/simulation/catalogue/products/wine-glass.png',
  'White and Green Tall Floral Arrangement':
    '/simulation/catalogue/products/white-green-tall-floral-arrangement.png',
  'Blush and Cream Low Centrepiece':
    '/simulation/catalogue/products/blush-cream-low-centrepiece.png',
  'Ivory Fluted Backdrop':
    '/simulation/catalogue/products/ivory-fluted-backdrop.png',
  'Ivory Display Plinth':
    '/simulation/catalogue/products/ivory-display-plinth.png',
  'Wireless Uplight': '/simulation/catalogue/products/wireless-uplight.png',
  'Wireless Table Lamp':
    '/simulation/catalogue/products/wireless-table-lamp.png',
  'Stainless Chafing Dish':
    '/simulation/catalogue/products/stainless-chafing-dish.png',
};

const PRODUCT_TEMPLATES: Readonly<Record<string, readonly ProductTemplate[]>> =
  {
    chairs: [
      template(
        'Gold Chiavari Chair',
        'Gold event chair with an ivory seat cushion for formal dining layouts.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
      template(
        'Clear Ghost Chair',
        'Transparent dining chair for modern ceremony and reception layouts.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
      template(
        'Black Cross-Back Chair',
        'Black cross-back dining chair for contemporary table settings.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
      template(
        'Ivory Dining Chair',
        'Upholstered ivory dining chair for premium guest seating.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
      template(
        'White Folding Ceremony Chair',
        'White folding chair for ceremony and outdoor seating plans.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
      template(
        "Children's Event Chair",
        'Compact event chair for children-specific table layouts.',
        '/simulation/catalogue/gold-chiavari-chairs.png',
      ),
    ],
    tables: [
      template(
        'Long Oak Banquet Table',
        'Long timber banquet table for continuous-row dining layouts.',
        '/simulation/catalogue/event-tables.png',
      ),
      template(
        'Round Banquet Table',
        'Round banquet table for eight-to-ten guest seating plans.',
        '/simulation/catalogue/event-tables.png',
      ),
      template(
        'Square Black Dining Table',
        'Square black dining table for modular guest layouts.',
        '/simulation/catalogue/event-tables.png',
      ),
      template(
        'Round Cocktail Table',
        'Standing-height cocktail table for arrival and networking areas.',
        '/simulation/catalogue/event-tables.png',
      ),
      template(
        'Serpentine Feature Table',
        'Curved modular table for buffets, displays and feature layouts.',
        '/simulation/catalogue/event-tables.png',
      ),
      template(
        "Children's Event Table",
        'Low event table for children-specific seating plans.',
        '/simulation/catalogue/event-tables.png',
      ),
    ],
    linen: [
      ...[
        'Ivory Gauze',
        'Sage',
        'Dusty Rose',
        'Charcoal',
        'Natural Linen',
        'Emerald Velvet',
      ].map((style) =>
        template(
          `${style} Table Runner`,
          `${style} table runner for detailed tablescape and mood-board tests.`,
          LINENS_IMAGE,
        ),
      ),
      template(
        'Ivory Round Tablecloth',
        'Floor-length ivory cloth for round banquet tables.',
        LINENS_IMAGE,
      ),
      template(
        'Natural Rectangular Tablecloth',
        'Natural-texture cloth for long and rectangular tables.',
        LINENS_IMAGE,
      ),
      ...['Ivory', 'Sage', 'Blush', 'Charcoal'].map((colour) =>
        template(
          `${colour} Napkin Set`,
          `${colour} fabric napkins for place-setting and colour-combination tests.`,
          LINENS_IMAGE,
        ),
      ),
    ],
    tableware: [
      ...[
        'Gold Dinner Fork',
        'Gold Dinner Knife',
        'Gold Dinner Spoon',
        'Silver Dinner Fork',
        'Silver Dinner Knife',
        'Silver Dinner Spoon',
      ].map((name) =>
        template(
          name,
          `${name} for detailed place-setting search and mood-board tests.`,
          TABLE_SETTINGS_IMAGE,
        ),
      ),
      template(
        'Clear Glass Underplate',
        'Clear charger underplate for layered place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Gold-Rim Underplate',
        'Gold-rimmed charger underplate for formal place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'White Dinner Plate',
        'Plain white dinner plate for neutral place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'White Side Plate',
        'Plain white side plate for complete table settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Ribbed Water Glass',
        'Clear ribbed water glass for guest place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Champagne Flute',
        'Clear champagne flute for reception and toast layouts.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Wine Glass',
        'Clear wine glass for detailed beverage place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Gold Napkin Ring',
        'Gold napkin ring for styled individual place settings.',
        TABLE_SETTINGS_IMAGE,
      ),
      template(
        'Clear Glass Candle Holder',
        'Compact clear candle holder for table-level ambience.',
        TABLE_SETTINGS_IMAGE,
      ),
    ],
    flowers: [
      template(
        'White and Green Low Floral Arrangement',
        'Low floral arrangement for guest sightline and table styling tests.',
        '/simulation/catalogue/floral-centrepieces.png',
      ),
      template(
        'White and Green Tall Floral Arrangement',
        'Tall floral arrangement for layered reception design tests.',
        '/simulation/catalogue/floral-centrepieces.png',
      ),
      template(
        'Loose Bud Vase Set',
        'Small coordinated bud-vase flowers for detailed table layouts.',
        '/simulation/catalogue/floral-centrepieces.png',
      ),
    ],
    'centre pieces': [
      template(
        'Blush and Cream Low Centrepiece',
        'Low blush and cream centrepiece for guest tables.',
        '/simulation/catalogue/floral-centrepieces.png',
      ),
      template(
        'Blush and Cream Tall Centrepiece',
        'Tall blush and cream centrepiece for focal tables.',
        '/simulation/catalogue/floral-centrepieces.png',
      ),
      template(
        'Mixed Candle Centrepiece Set',
        'Mixed-height candle arrangement for detailed tablescapes.',
        TABLE_SETTINGS_IMAGE,
      ),
    ],
    backdrops: [
      template(
        'Timber Arch Backdrop',
        'Modular timber arch for ceremonies and photo areas.',
        '/simulation/catalogue/modular-backdrops.png',
      ),
      template(
        'Ivory Fluted Backdrop',
        'Ivory fluted panel system for stages and feature areas.',
        '/simulation/catalogue/modular-backdrops.png',
      ),
      template(
        'Black Geometric Backdrop',
        'Black geometric panel system for contemporary events.',
        '/simulation/catalogue/modular-backdrops.png',
      ),
    ],
    decor: [
      ...['Ivory', 'Black', 'Natural Timber'].map((finish) =>
        template(
          `${finish} Display Plinth`,
          `${finish} display plinth for cakes, flowers, products and feature objects.`,
          FURNITURE_IMAGE,
        ),
      ),
      ...['Sage Velvet', 'Blush Velvet', 'Ivory Channelled'].map((style) =>
        template(
          `${style} Ottoman`,
          `${style} ottoman for lounge layouts and guest seating tests.`,
          FURNITURE_IMAGE,
        ),
      ),
      template(
        'Gold Nesting Side Table Set',
        'Gold-framed nesting tables for lounge and display layouts.',
        FURNITURE_IMAGE,
      ),
      template(
        'Ivory Lounge Bench',
        'Ivory upholstered bench for reception and lounge layouts.',
        FURNITURE_IMAGE,
      ),
      template(
        'Cocktail Side Table',
        'Compact side table for lounge and cocktail settings.',
        FURNITURE_IMAGE,
      ),
      template(
        'Ceremony Aisle Stand',
        'Slim display stand for aisle flowers and candles.',
        FURNITURE_IMAGE,
      ),
      template(
        'Welcome Sign Stand',
        'Freestanding frame for directional and welcome signage.',
        FURNITURE_IMAGE,
      ),
    ],
    lighting: [
      template(
        'Battery Pillar Candle Set',
        'Flameless pillar candle set for tables, aisles and feature areas.',
        LIGHTING_IMAGE,
      ),
      template(
        'Dinner Candle and Holder Set',
        'Mixed-height dinner candles and holders for detailed tablescapes.',
        LIGHTING_IMAGE,
      ),
      template(
        'Wireless Uplight',
        'Battery-powered uplight for walls, draping and feature zones.',
        LIGHTING_IMAGE,
      ),
      template(
        'Compact Pinspot',
        'Compact focused light for flowers, cakes and centrepieces.',
        LIGHTING_IMAGE,
      ),
      template(
        'Illuminated Cube Seat',
        'Wireless illuminated cube for lounge and feature layouts.',
        LIGHTING_IMAGE,
      ),
      template(
        'Illuminated Cylinder Plinth',
        'Lit cylinder plinth for product and floral displays.',
        LIGHTING_IMAGE,
      ),
      template(
        'Ambient Sphere Light',
        'Portable glowing sphere for floor and lounge ambience.',
        LIGHTING_IMAGE,
      ),
      template(
        'Compact Crystal Chandelier',
        'Small decorative chandelier for suspended lighting tests.',
        LIGHTING_IMAGE,
      ),
      template(
        'Wireless Table Lamp',
        'Rechargeable table lamp for dining and cocktail settings.',
        LIGHTING_IMAGE,
      ),
      template(
        'Stanchion Light',
        'Compact light fitting for queue and arrival stanchions.',
        LIGHTING_IMAGE,
      ),
    ],
    staging: [
      template(
        'Modular Stage Deck',
        'Low modular stage deck for configurable event platforms.',
        STAGING_IMAGE,
      ),
      template(
        'Stage Step Unit',
        'Matching step unit for safe stage access.',
        STAGING_IMAGE,
      ),
      template(
        'Stage Safety Rail',
        'Modular safety rail for exposed stage edges.',
        STAGING_IMAGE,
      ),
      template(
        'Compact Truss Arch',
        'Freestanding truss arch for lighting, branding and technical tests.',
        STAGING_IMAGE,
      ),
      template(
        'Crowd-Control Barrier',
        'Interlocking barrier for queues, stages and controlled access areas.',
        STAGING_IMAGE,
      ),
    ],
    tents: [
      template(
        'White Stretch Tent',
        'Flexible white stretch tent for outdoor guest and dining zones.',
        STAGING_IMAGE,
      ),
      template(
        'White Frame Marquee',
        'Weather-protected frame marquee for formal outdoor events.',
        STAGING_IMAGE,
      ),
      template(
        'Compact Event Gazebo',
        'Compact gazebo for service, registration or supplier stations.',
        STAGING_IMAGE,
      ),
      template(
        'Weighted Tent Base',
        'Weighted base for safe temporary tent and gazebo installation.',
        STAGING_IMAGE,
      ),
    ],
    equipment: [
      template(
        'Stainless Chafing Dish',
        'Stainless buffet chafing dish for hot-service planning.',
        CATERING_IMAGE,
      ),
      template(
        'Commercial Soup Kettle',
        'Countertop soup kettle for controlled hot service.',
        CATERING_IMAGE,
      ),
      template(
        'Beverage Urn',
        'Insulated hot-water and beverage urn for guest service.',
        CATERING_IMAGE,
      ),
      template(
        'Insulated Food Carrier',
        'Portable insulated carrier for event food logistics.',
        CATERING_IMAGE,
      ),
      template(
        'Portable Serving Counter',
        'Modular serving counter for buffet and service layouts.',
        CATERING_IMAGE,
      ),
      template(
        'Mobile Bar Counter',
        'Portable bar counter for beverage service zones.',
        CATERING_IMAGE,
      ),
      template(
        'Plate Transport Rack',
        'Mobile rack for organised plate storage and service.',
        CATERING_IMAGE,
      ),
      template(
        'Glass Transport Rack',
        'Compartment rack for safe glassware handling.',
        CATERING_IMAGE,
      ),
      template(
        'Compact Refrigerated Display',
        'Mobile chilled display for controlled cold service.',
        CATERING_IMAGE,
      ),
    ],
    'private dining': [
      template(
        'Intimate Glass Garden Venue',
        'Fictional modern garden venue for intimate private dining.',
        VENUES_IMAGE,
      ),
    ],
    'small weddings': [
      template(
        'Boutique Garden Wedding Venue',
        'Fictional garden venue for small wedding simulations.',
        VENUES_IMAGE,
      ),
    ],
    workshops: [
      template(
        'Boutique Workshop Venue',
        'Fictional flexible venue for workshops and small sessions.',
        VENUES_IMAGE,
      ),
    ],
    conferences: [
      template(
        'Grand Ballroom Conference Venue',
        'Fictional ballroom configured for large conferences.',
        VENUES_IMAGE,
      ),
    ],
    exhibitions: [
      template(
        'Large Exhibition Hall',
        'Fictional large-format hall for exhibition simulations.',
        VENUES_IMAGE,
      ),
    ],
    concerts: [
      template(
        'Indoor Concert Hall',
        'Fictional indoor venue for staged concert simulations.',
        VENUES_IMAGE,
      ),
    ],
    galas: [
      template(
        'Grand Ballroom Gala Venue',
        'Fictional elegant ballroom for gala event simulations.',
        VENUES_IMAGE,
      ),
    ],
    festivals: [
      template(
        'Mountain Lawn Festival Venue',
        'Fictional outdoor lawn for festival simulations.',
        VENUES_IMAGE,
      ),
    ],
    markets: [
      template(
        'Outdoor Market Lawn',
        'Fictional open lawn for market-layout simulations.',
        VENUES_IMAGE,
      ),
    ],
    weddings: [
      template(
        'Mountain Ceremony Lawn',
        'Fictional outdoor ceremony venue with mountain views.',
        VENUES_IMAGE,
      ),
    ],
    'sporting events': [
      template(
        'Open-Air Sporting Event Grounds',
        'Fictional open grounds for sporting-event simulations.',
        VENUES_IMAGE,
      ),
    ],
  };

function templatesFor(focus: string): readonly ProductTemplate[] {
  return (
    PRODUCT_TEMPLATES[focus] ?? [
      template(
        `${titleCase(focus)} Package`,
        `Synthetic ${focus} fixture for repeatable EventOS simulator scenarios.`,
        '',
      ),
    ]
  );
}

export function createSimulationCatalogue(
  businesses: readonly SimulationBusinessProfile[],
): SimulationCatalogueItem[] {
  return businesses.flatMap((business) => {
    let productIndex = 0;

    return business.catalogueFocus.flatMap((focus, focusIndex) =>
      templatesFor(focus).map((productVisual, templateIndex) => {
        productIndex += 1;
        const scale = SCALE_MULTIPLIER[business.scale];
        const isService =
          business.kind === 'Planner' || business.kind === 'Specialist';
        const isVenue = business.kind === 'Venue';
        const basePrice =
          35 +
          ((Number(business.id.slice(-3)) * 73 +
            focusIndex * 191 +
            templateIndex * 47) %
            4200);
        const costPrice = roundCurrency(basePrice * scale);
        const sequence = String(productIndex).padStart(3, '0');

        return {
          id: `${business.id}-CAT-${sequence}`,
          businessId: business.id,
          name: `${productVisual.name} [SYNTHETIC]`,
          category: business.category,
          sku: `SIM-${business.id.slice(-3)}-${sequence}`,
          description: `${productVisual.description} Not available for real purchase.`,
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
          sellingPrice: roundCurrency(costPrice * (1.22 + focusIndex * 0.04)),
          imagePath:
            PRODUCT_IMAGE_OVERRIDES[productVisual.name] ||
            productVisual.imagePath ||
            `/simulation/catalogue/${business.kind.toLowerCase()}.webp`,
          imageProvenance: 'GENERATED_FOR_EVENTOS_SIMULATION',
        } satisfies SimulationCatalogueItem;
      }),
    );
  });
}

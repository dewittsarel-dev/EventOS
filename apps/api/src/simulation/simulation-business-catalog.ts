export type SimulationBusinessKind =
  'Supplier' | 'Planner' | 'Venue' | 'Specialist';

export type SimulationBusinessScale = 'Micro' | 'Small' | 'Medium' | 'Large';

export type SimulationImageSource = 'LicensedFixture' | 'GeneratedFixture';

export interface SimulationBusinessProfile {
  id: string;
  synthetic: true;
  name: string;
  slug: string;
  kind: SimulationBusinessKind;
  category: string;
  scale: SimulationBusinessScale;
  city: string;
  catalogueFocus: readonly string[];
  imageSource: SimulationImageSource;
}

interface SimulationBusinessArchetype {
  kind: SimulationBusinessKind;
  category: string;
  nameStem: string;
  catalogueFocus: readonly string[];
}

const ARCHETYPES: readonly SimulationBusinessArchetype[] = [
  {
    kind: 'Supplier',
    category: 'Furniture and tableware',
    nameStem: 'Table & Chair Test Co',
    catalogueFocus: ['chairs', 'tables', 'linen', 'tableware'],
  },
  {
    kind: 'Supplier',
    category: 'Floral and decor',
    nameStem: 'Floral & Decor Test Co',
    catalogueFocus: ['flowers', 'centre pieces', 'backdrops', 'decor'],
  },
  {
    kind: 'Supplier',
    category: 'Lighting and audiovisual',
    nameStem: 'Lighting & AV Test Co',
    catalogueFocus: ['lighting', 'audio', 'screens', 'staging'],
  },
  {
    kind: 'Supplier',
    category: 'Catering and beverages',
    nameStem: 'Catering Test Co',
    catalogueFocus: ['menus', 'beverages', 'service staff', 'equipment'],
  },
  {
    kind: 'Supplier',
    category: 'Entertainment',
    nameStem: 'Entertainment Test Co',
    catalogueFocus: ['DJs', 'musicians', 'performers', 'sound support'],
  },
  {
    kind: 'Supplier',
    category: 'Photography and video',
    nameStem: 'Media Test Co',
    catalogueFocus: ['photography', 'video', 'photo booths', 'editing'],
  },
  {
    kind: 'Supplier',
    category: 'Transport and logistics',
    nameStem: 'Event Logistics Test Co',
    catalogueFocus: ['transport', 'delivery', 'rigging', 'crew logistics'],
  },
  {
    kind: 'Supplier',
    category: 'Staffing and security',
    nameStem: 'Event Staffing Test Co',
    catalogueFocus: ['event staff', 'security', 'hosts', 'cleaning'],
  },
  {
    kind: 'Planner',
    category: 'Private event planning',
    nameStem: 'Private Events Test Planner',
    catalogueFocus: ['birthdays', 'weddings', 'celebrations', 'private dining'],
  },
  {
    kind: 'Planner',
    category: 'Corporate event planning',
    nameStem: 'Corporate Events Test Planner',
    catalogueFocus: ['conferences', 'launches', 'galas', 'roadshows'],
  },
  {
    kind: 'Venue',
    category: 'Intimate venue',
    nameStem: 'Intimate Test Venue',
    catalogueFocus: ['private dining', 'small weddings', 'workshops'],
  },
  {
    kind: 'Venue',
    category: 'Large event venue',
    nameStem: 'Large Test Venue',
    catalogueFocus: ['conferences', 'exhibitions', 'concerts', 'galas'],
  },
  {
    kind: 'Venue',
    category: 'Outdoor venue',
    nameStem: 'Outdoor Test Venue',
    catalogueFocus: ['festivals', 'markets', 'weddings', 'sporting events'],
  },
  {
    kind: 'Specialist',
    category: 'Technical production',
    nameStem: 'Technical Production Test Co',
    catalogueFocus: ['production management', 'power', 'rigging', 'broadcast'],
  },
  {
    kind: 'Specialist',
    category: 'Event safety and compliance',
    nameStem: 'Event Safety Test Co',
    catalogueFocus: ['safety plans', 'permits', 'medical', 'compliance'],
  },
] as const;

const CITIES = [
  'Cape Town',
  'Johannesburg',
  'Pretoria',
  'Durban',
  'Gqeberha',
] as const;

const SCALES: readonly SimulationBusinessScale[] = [
  'Micro',
  'Small',
  'Medium',
  'Large',
] as const;

const BUSINESSES_PER_ARCHETYPE = 10;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createSimulationBusinessCatalog(): SimulationBusinessProfile[] {
  return ARCHETYPES.flatMap((archetype, archetypeIndex) =>
    Array.from({ length: BUSINESSES_PER_ARCHETYPE }, (_, offset) => {
      const sequence = archetypeIndex * BUSINESSES_PER_ARCHETYPE + offset + 1;
      const suffix = String(offset + 1).padStart(2, '0');
      const name = `${archetype.nameStem} ${suffix} [SYNTHETIC]`;

      return {
        id: `SIM-BIZ-${String(sequence).padStart(3, '0')}`,
        synthetic: true,
        name,
        slug: `simulation-${slugify(name)}`,
        kind: archetype.kind,
        category: archetype.category,
        scale: SCALES[offset % SCALES.length],
        city: CITIES[(archetypeIndex + offset) % CITIES.length],
        catalogueFocus: archetype.catalogueFocus,
        imageSource: offset % 2 === 0 ? 'GeneratedFixture' : 'LicensedFixture',
      } satisfies SimulationBusinessProfile;
    }),
  );
}

export const SIMULATION_BUSINESS_COUNT =
  ARCHETYPES.length * BUSINESSES_PER_ARCHETYPE;

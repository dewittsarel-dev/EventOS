export const RESOURCE_CATALOGUE = {
  'Furniture & seating': [
    'Chairs', 'Tables', 'Benches', 'Sofas & couches', 'Lounge chairs', 'Ottomans & poufs',
    'Bar stools', "Children's furniture", 'Outdoor furniture', 'Bars & counters',
    'Shelving & display units', 'Plinths & pedestals', 'Furniture accessories',
  ],
  'Linen & soft furnishings': [
    'Tablecloths', 'Table runners', 'Napkins', 'Chair covers & sashes', 'Draping',
    'Cushions', 'Rugs & carpets', 'Throws', 'Other linen',
  ],
  'Tableware & serving': [
    'Cutlery', 'Crockery', 'Glassware', 'Underplates & chargers', 'Serving ware',
    'Beverage dispensers', 'Trays', 'Table numbers & holders', 'Tabletop accessories',
  ],
  'Decor & styling': [
    'Centrepieces', 'Vases & vessels', 'Candle holders & lanterns', 'Candles', 'Backdrops',
    'Arches & structures', 'Props', 'Signage', 'Easels', 'Frames & mirrors', 'Ceiling decor',
    'Hanging decor', 'Theme decor', 'Seasonal decor', 'Balloons',
  ],
  'Floral & plants': [
    'Fresh flowers', 'Artificial flowers', 'Dried flowers', 'Bouquets', 'Table arrangements',
    'Ceremony arrangements', 'Floral installations', 'Greenery', 'Potted plants & trees',
    'Floral stands & mechanics',
  ],
  Lighting: [
    'Chandeliers', 'Pendant lights', 'Fairy & festoon lights', 'LED & uplights',
    'Neon & illuminated signs', 'Moving lights', 'Spotlights', 'Control & dimming',
    'Lighting rigging',
  ],
  'Audio, visual & event technology': [
    'Speakers & PA', 'Microphones', 'Mixing desks', 'DJ equipment', 'Screens & projectors',
    'LED walls', 'TVs & monitors', 'Cameras & streaming', 'Interpretation & conferencing',
    'Presentation equipment', 'Cabling & distribution', 'Event Wi-Fi',
    'Registration & check-in technology',
  ],
  'Staging, rigging & structures': [
    'Stages', 'Dance floors', 'Trussing', 'Rigging', 'Podiums & lecterns',
    'Barriers & crowd control', 'Tents & marquees', 'Gazebos & canopies',
    'Flooring & carpeting', 'Steps & ramps', 'Temporary walls', 'Grandstands & bleachers',
  ],
  'Catering & kitchen equipment': [
    'Cooking equipment', 'Refrigeration', 'Food warming', 'Buffet & chafing',
    'Coffee & beverage equipment', 'Bars & cocktail equipment', 'Work tables & preparation',
    'Sinks & sanitation', 'Catering utensils', 'Transport & storage', 'Serving stations',
    'Waste handling',
  ],
  'Food & beverage services': [
    'Full-service catering', 'Plated dining', 'Buffet catering', 'Canapes & finger food',
    'Mobile catering & food trucks', 'Cakes & desserts', 'Bar service', 'Coffee service',
    'Beverage supply', 'Catering staff', 'Dietary & speciality catering',
  ],
  'Entertainment & performers': [
    'DJs', 'Live bands', 'Solo musicians', 'Vocalists', 'MCs', 'Dancers',
    'Cultural performers', "Children's entertainment", 'Magicians & variety acts',
    'Comedians', 'Interactive entertainment', 'Photo booths', 'Games & activities',
    'Fireworks & special effects',
  ],
  'Planning, design & creative services': [
    'Full event planning', 'On-the-day coordination', 'Event design & styling',
    'Wedding planning', 'Corporate event production', 'Technical production',
    'Decor setup & strike', 'Floral design', 'Invitations & stationery design',
    'Graphic design & branding', 'Content production', 'Guest management',
    'RSVP & ticketing',
  ],
  'Photography, video & content': [
    'Photography', 'Videography', 'Drone services', 'Live streaming', 'Photo booths',
    'Content creators', 'Editing & post-production', 'Albums & prints',
  ],
  'Staffing, safety & operational services': [
    'Event crew', 'Waiters & bartenders', 'Hosts & ushers', 'Registration staff',
    'Setup & strike crew', 'Security', 'Medical & first aid', 'Fire safety', 'Cleaning',
    'Waste management', 'Childcare', 'Cloakroom', 'Technical operators', 'Stage management',
  ],
  'Transport & logistics': [
    'Delivery & collection', 'Furniture & equipment transport', 'Refrigerated transport',
    'Guest shuttles', 'VIP & chauffeur services', 'Coaches & buses',
    'Limousines & classic cars', 'Freight & courier', 'Warehousing & storage',
    'Loading & offloading', 'Forklifts & material handling', 'Route & load planning',
    'Last-mile delivery', 'Returns & reverse logistics', 'Parking & traffic management',
  ],
  'Power, climate & site utilities': [
    'Generators', 'Distribution boards', 'Power cabling', 'UPS & battery power', 'Heating',
    'Air conditioning', 'Fans', 'Portable toilets', 'Water supply',
    'Hand-wash & sanitation', 'Site lighting', 'Fuel supply',
  ],
  'Venues & accommodation': [
    'Wedding venues', 'Conference centres', 'Hotels', 'Restaurants', 'Function halls',
    'Outdoor & garden venues', 'Farms & wine estates', 'Beach & waterfront venues',
    'Rooftops', 'Private homes', 'Museums & galleries', 'Sports venues',
    'Nightclubs & bars', 'Religious venues', 'Accommodation', 'Temporary venues',
  ],
  'Invitations, gifting & personalised items': [
    'Invitations & stationery', 'Guest favours', 'Corporate gifts', 'Welcome packs',
    'Personalised signage', 'Menus & programmes', 'Place cards', 'Awards & trophies',
    'Branded merchandise',
  ],
  'Consumables & event supplies': [
    'Disposable tableware', 'Cleaning supplies', 'Fuel & gas', 'Ice', 'Packaging',
    'Tape & fasteners', 'Batteries', 'Protective equipment', 'Toiletries',
    'Confetti & petals', 'Party supplies',
  ],
  'Specialist & regulated services': [
    'Permits & licensing', 'Event insurance', 'Legal & contracts', 'Accessibility services',
    'Translation & interpreting', 'Sustainability consulting', 'Pyrotechnics',
    'Structural certification', 'Specialist engineering', 'Animal services',
  ],
  'Travel & guest services': [
    'Travel planning', 'Accommodation booking', 'Airport transfers', 'Tours & activities',
    'Concierge services', 'Guest welcome services',
  ],
  'Other event product or service': ['Other product', 'Other rental item', 'Other service'],
} as const;

export type CatalogueCategory = keyof typeof RESOURCE_CATALOGUE;

export const COLOURS = [
  'Black', 'White', 'Ivory', 'Cream', 'Beige', 'Natural', 'Brown', 'Gold', 'Rose gold',
  'Silver', 'Clear', 'Grey', 'Green', 'Blue', 'Pink', 'Red', 'Burgundy', 'Purple',
  'Orange', 'Yellow', 'Multi-colour',
];
export const MATERIALS = [
  'Wood', 'Metal', 'Glass', 'Crystal', 'Acrylic', 'Plastic', 'Fabric', 'Velvet', 'Leather',
  'Linen', 'Cotton', 'Ceramic', 'Porcelain', 'Stone', 'Concrete', 'Rattan', 'Wicker',
  'Paper', 'Fresh botanical', 'Artificial botanical',
];
export const STYLES = [
  'Classic', 'Modern', 'Contemporary', 'Minimalist', 'Luxury', 'Elegant', 'Rustic',
  'Vintage', 'Industrial', 'Bohemian', 'Romantic', 'Tropical', 'Garden', 'Glamour',
  'Traditional', 'African', 'Corporate', 'Children', 'Festive', 'Themed',
];

const SERVICE_CATEGORIES = new Set([
  'Food & beverage services',
  'Entertainment & performers',
  'Planning, design & creative services',
  'Photography, video & content',
  'Staffing, safety & operational services',
  'Transport & logistics',
  'Specialist & regulated services',
  'Travel & guest services',
  'Services',
]);

type SuggestionInput = {
  name: string;
  category: string;
  subcategory: string;
  colour?: string;
  material?: string;
  style?: string;
  delivery?: string;
};

export function buildResourceSuggestions(input: SuggestionInput) {
  const attributes = [input.colour, input.material, input.style].filter(Boolean) as string[];
  const subject = [input.colour, input.material, input.style, input.subcategory].filter(Boolean).join(' ');
  const description = input.name
    ? `${input.name}${subject ? ` - ${subject}` : ''}.${input.delivery ? ` Delivery: ${input.delivery}.` : ''}`
    : '';
  const keywords = Array.from(new Set([
    input.name,
    input.category,
    input.subcategory,
    ...attributes,
  ].flatMap((value) => value ? [value.toLowerCase(), ...value.toLowerCase().split(/\s+/)] : []))).filter(Boolean);
  const searchPhrases = Array.from(new Set([
    input.name,
    [input.colour, input.subcategory].filter(Boolean).join(' '),
    [input.style, input.subcategory].filter(Boolean).join(' '),
    [input.material, input.subcategory].filter(Boolean).join(' '),
  ].map((value) => value.trim().toLowerCase()).filter(Boolean)));
  return { description, keywords: keywords.slice(0, 40), searchPhrases: searchPhrases.slice(0, 40) };
}

export function inferResourceDefaults(category: string) {
  if (SERVICE_CATEGORIES.has(category)) {
    return { resourceType: 'SERVICE' as const, quantityMode: 'UNLIMITED' as const, unit: 'Service' };
  }
  if (category === 'Venues & accommodation' || category === 'Venues') {
    return { resourceType: 'VENUE' as const, quantityMode: 'CAPACITY' as const, unit: 'Booking' };
  }
  if (category === 'Consumables & event supplies') {
    return { resourceType: 'CONSUMABLE' as const, quantityMode: 'QUANTITY' as const, unit: 'Each' };
  }
  return { resourceType: 'BULK_ITEM' as const, quantityMode: 'QUANTITY' as const, unit: 'Each' };
}

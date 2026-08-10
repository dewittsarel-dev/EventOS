export type MarketplaceDiscoveryMode = 'assistant' | 'guided' | 'catalogue';

export interface EventDiscoveryBrief {
  eventType: string;
  guests: number | null;
  city: string;
  style: string[];
  colours: string[];
  budget: number | null;
  categories: string[];
  searchTerms: string[];
  followUpQuestions: string[];
}

const EVENT_TYPES = ['wedding', 'birthday', 'party', 'corporate', 'conference', 'product launch', 'funeral', 'graduation', 'baby shower', 'festival', 'gala'];
const STYLES = ['elegant', 'modern', 'classic', 'rustic', 'vintage', 'old fashioned', 'bohemian', 'minimalist', 'luxury', 'industrial', 'romantic', 'tropical'];
const COLOURS = ['white', 'black', 'gold', 'silver', 'neutral', 'beige', 'green', 'blue', 'pink', 'red', 'orange', 'purple', 'pastel'];
const CITY_ALIASES: Record<string, string> = {
  'cape town': 'Cape Town', johannesburg: 'Johannesburg', pretoria: 'Pretoria', durban: 'Durban',
  gqeberha: 'Gqeberha', 'port elizabeth': 'Gqeberha', bloemfontein: 'Bloemfontein',
};

const EVENT_CATEGORY_DEFAULTS: Record<string, string[]> = {
  wedding: ['Furniture and tableware', 'Floral and decor', 'Lighting and audiovisual', 'Photography and video'],
  birthday: ['Furniture and tableware', 'Floral and decor', 'Catering and beverages', 'Entertainment'],
  party: ['Furniture and tableware', 'Lighting and audiovisual', 'Catering and beverages', 'Entertainment'],
  corporate: ['Corporate event planning', 'Lighting and audiovisual', 'Technical production', 'Catering and beverages'],
  conference: ['Corporate event planning', 'Lighting and audiovisual', 'Technical production', 'Staffing and security'],
  'product launch': ['Corporate event planning', 'Lighting and audiovisual', 'Technical production', 'Photography and video'],
  funeral: ['Furniture and tableware', 'Floral and decor', 'Catering and beverages', 'Transport and logistics'],
};

const STYLE_SEARCH_TERMS: Record<string, string[]> = {
  elegant: ['gold', 'crystal', 'champagne', 'velvet'],
  vintage: ['wood', 'brass', 'classic', 'rustic'],
  'old fashioned': ['vintage', 'classic', 'wood', 'brass'],
  rustic: ['wood', 'linen', 'neutral'],
  modern: ['black', 'white', 'minimalist'],
  romantic: ['floral', 'candle', 'pastel'],
};

export function interpretEventRequest(input: string): EventDiscoveryBrief {
  const normalized = input.toLowerCase().replace(/,/g, ' ');
  const eventType = EVENT_TYPES.find((value) => normalized.includes(value)) ?? '';
  const guestMatch = normalized.match(/(\d{1,5})\s*(?:guests?|people|persons?|pax)/);
  const budgetMatch = normalized.match(/budget(?:\s+of)?[\s:]*(?:r|zar)?\s*(\d[\d\s,.]*)/)
    ?? normalized.match(/\b(?:r|zar)\s*(\d[\d\s,.]*)/);
  const city = Object.entries(CITY_ALIASES).find(([alias]) => normalized.includes(alias))?.[1] ?? '';
  const style = STYLES.filter((value) => normalized.includes(value));
  const colours = COLOURS.filter((value) => normalized.includes(value));
  const categories = EVENT_CATEGORY_DEFAULTS[eventType] ?? [];
  const searchTerms = [...new Set([
    ...style.flatMap((value) => STYLE_SEARCH_TERMS[value] ?? [value]),
    ...colours,
  ])];
  const followUpQuestions = [];
  if (!eventType) followUpQuestions.push('What type of event are you planning?');
  if (!guestMatch) followUpQuestions.push('Approximately how many guests will attend?');
  if (!city) followUpQuestions.push('In which city or area will the event take place?');
  if (!budgetMatch) followUpQuestions.push('Do you have a target budget?');

  return {
    eventType,
    guests: guestMatch ? Number(guestMatch[1]) : null,
    city,
    style,
    colours,
    budget: budgetMatch ? Number(budgetMatch[1].replace(/[\s,]/g, '')) : null,
    categories,
    searchTerms,
    followUpQuestions,
  };
}

export function guidedEventSearchTerms(eventType: string, style: string, colours: string[]) {
  return [...new Set([
    ...(STYLE_SEARCH_TERMS[style.toLowerCase()] ?? (style ? [style.toLowerCase()] : [])),
    ...colours.map((value) => value.toLowerCase()),
  ])];
}

export function eventCategories(eventType: string) {
  return EVENT_CATEGORY_DEFAULTS[eventType.toLowerCase()] ?? [];
}

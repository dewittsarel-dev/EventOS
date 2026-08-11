export interface ProductIntelligenceInput {
  productName: string;
  category: string;
  subcategory: string;
  colour?: string;
  material?: string;
  style?: string;
  condition?: string;
  description?: string;
  searchTerms?: string[];
}

export interface SearchableProduct {
  title: string;
  sku: string;
  supplierName: string;
  category: string;
  description: string;
  searchTerms?: string[];
}

interface ProductConcept {
  id: string;
  aliases: string[];
  accessories?: string[];
  operationalSupport?: string[];
  related?: string[];
}

const PRODUCT_CONCEPTS: ProductConcept[] = [
  { id: 'table', aliases: ['table', 'tables'], accessories: ['runner', 'cloth', 'linen', 'lamp', 'number', 'centre', 'centerpiece'], operationalSupport: ['rack', 'transport', 'trolley'] },
  { id: 'table-runner', aliases: ['table runner', 'table runners', 'runner'], related: ['linen', 'tablescape'] },
  { id: 'chair', aliases: ['chair', 'chairs', 'seating'], accessories: ['cover', 'cushion', 'tie', 'sash'], operationalSupport: ['rack', 'transport', 'trolley'] },
  { id: 'fork', aliases: ['fork', 'forks'], related: ['cutlery', 'flatware'] },
  { id: 'knife', aliases: ['knife', 'knives'], related: ['cutlery', 'flatware'] },
  { id: 'spoon', aliases: ['spoon', 'spoons'], related: ['cutlery', 'flatware'] },
  { id: 'glass', aliases: ['glass', 'glasses', 'drinking glass'], accessories: ['holder', 'underplate'], operationalSupport: ['rack', 'transport', 'crate'], related: ['glassware', 'goblet', 'flute'] },
  { id: 'underplate', aliases: ['underplate', 'underplates', 'charger', 'charger plate'] },
  { id: 'ottoman', aliases: ['ottoman', 'ottomans'] },
  { id: 'plinth', aliases: ['plinth', 'plinths', 'pedestal', 'pedestals'] },
  { id: 'sofa', aliases: ['sofa', 'sofas', 'couch', 'couches', 'lounge seating'] },
  { id: 'flower', aliases: ['flower', 'flowers', 'floral'], related: ['arrangement', 'bouquet'] },
  { id: 'crockery', aliases: ['crockery'], related: ['plate', 'bowl', 'cup', 'saucer'] },
  { id: 'cutlery', aliases: ['cutlery'], related: ['fork', 'knife', 'spoon', 'flatware'] },
  { id: 'glassware', aliases: ['glassware'], related: ['glass', 'goblet', 'flute'] },
  { id: 'vintage', aliases: ['vintage', 'old fashioned', 'old-fashioned'], related: ['classic', 'rustic', 'wood', 'brass'] },
];

function singularize(word: string) {
  if (word.endsWith('sses') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ves') && word.length > 4) return `${word.slice(0, -3)}fe`;
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  return word;
}

export function normalizeProductLanguage(value: string) {
  return value
    .toLowerCase()
    .replace(/\[synthetic\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .join(' ');
}

function normalizedTerms(values: Array<string | undefined>) {
  return [...new Set(values.flatMap((value) => normalizeProductLanguage(value ?? '').split(' ')).filter(Boolean))];
}

function conceptForQuery(query: string) {
  const normalizedQuery = normalizeProductLanguage(query);
  return PRODUCT_CONCEPTS.find((concept) => concept.aliases.some((alias) => normalizeProductLanguage(alias) === normalizedQuery));
}

function relationshipPenalty(title: string, concept?: ProductConcept) {
  if (!concept) return 0;
  const words = new Set(normalizeProductLanguage(title).split(' '));
  if (concept.operationalSupport?.some((term) => words.has(normalizeProductLanguage(term)))) return 650;
  if (concept.accessories?.some((term) => words.has(normalizeProductLanguage(term)))) return 450;
  return 0;
}

export function productSearchScore(product: SearchableProduct, query: string) {
  const normalizedQuery = normalizeProductLanguage(query);
  if (!normalizedQuery) return 1;
  const title = normalizeProductLanguage(product.title);
  const queryWords = normalizedQuery.split(' ');
  const containsAllWords = queryWords.every((word) => title.split(' ').includes(word));
  const concept = conceptForQuery(normalizedQuery);
  const penalty = relationshipPenalty(title, concept);

  if (title === normalizedQuery) return 1400;
  if (title.endsWith(` ${normalizedQuery}`)) return 1200 - penalty;
  if (title.startsWith(`${normalizedQuery} `)) return 1000 - penalty;
  if (title.includes(normalizedQuery)) return 850 - penalty;
  if (containsAllWords) return 700 - penalty;

  const searchableTerms = normalizeProductLanguage(product.searchTerms?.join(' ') ?? '');
  if (concept?.related?.some((term) => title.includes(normalizeProductLanguage(term)))) return 350;
  if (normalizeProductLanguage(`${product.sku} ${product.supplierName}`).includes(normalizedQuery)) return 300;
  if (normalizeProductLanguage(product.category).includes(normalizedQuery)) return 200;
  if (searchableTerms.includes(normalizedQuery)) return 180;
  if (normalizeProductLanguage(product.description).includes(normalizedQuery)) return 100;
  return 0;
}

export function enrichProductDiscovery(input: ProductIntelligenceInput) {
  const suppliedValues = [input.productName, input.category, input.subcategory, input.colour, input.material, input.style, input.condition];
  const normalizedName = normalizeProductLanguage(input.productName);
  const matchingConcepts = PRODUCT_CONCEPTS.filter((concept) =>
    concept.aliases.some((alias) => normalizedName.includes(normalizeProductLanguage(alias))),
  );
  const conceptTerms = matchingConcepts.flatMap((concept) => [...concept.aliases, ...(concept.related ?? [])]);
  const searchTerms = [...new Set([...normalizedTerms(suppliedValues), ...normalizedTerms(input.searchTerms ?? []), ...normalizedTerms(conceptTerms)])];
  const details = [input.colour, input.material, input.style, input.condition].filter(Boolean).join(' / ');

  return {
    description: input.description?.trim() || `${input.productName} in ${input.subcategory}${details ? ` / ${details}` : ''}.`,
    tags: searchTerms.slice(0, 14),
    searchTerms,
    concepts: matchingConcepts.map((concept) => concept.id),
  };
}

type SearchableListing = {
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  keywords: string[];
  searchPhrases: string[];
  aiSummary: string | null;
};

export type MarketplaceMatchTier =
  'Exact match' | 'Strong match' | 'Related option';

export type MarketplaceListingRank = {
  score: number;
  tier: MarketplaceMatchTier;
  reasons: string[];
  matchedTerms: string[];
};

const ACCESSORY_WORDS = new Set([
  'runner',
  'cover',
  'cloth',
  'linen',
  'rack',
  'stand',
  'case',
  'holder',
  'cushion',
  'ribbon',
  'skirt',
]);

const SEARCH_CONCEPTS: string[][] = [
  ['glass', 'glassware', 'tumbler', 'goblet', 'drinkware'],
  ['fork', 'cutlery', 'flatware'],
  ['plate', 'crockery', 'dinnerware'],
  ['chair', 'seat', 'seating'],
  ['sofa', 'couch', 'lounge'],
  ['table', 'trestle'],
  ['flower', 'floral', 'floristry', 'arrangement'],
  ['light', 'lighting', 'lamp', 'illumination'],
  ['tent', 'marquee'],
  ['stage', 'staging', 'platform'],
  ['sound', 'audio', 'pa'],
  ['screen', 'display', 'projection'],
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function singularize(value: string) {
  if (value.endsWith('ies') && value.length > 4)
    return `${value.slice(0, -3)}y`;
  if (value.endsWith('ses') && value.length > 4) return value.slice(0, -2);
  if (value.endsWith('s') && !value.endsWith('ss') && value.length > 3)
    return value.slice(0, -1);
  return value;
}

function words(value: string) {
  return normalize(value).split(' ').filter(Boolean).map(singularize);
}

function conceptTerms(queryWords: string[]) {
  const terms = new Set(queryWords);
  for (const queryWord of queryWords) {
    const concept = SEARCH_CONCEPTS.find((group) => group.includes(queryWord));
    concept?.forEach((term) => terms.add(term));
  }
  return [...terms];
}

export function rankMarketplaceListing(
  listing: SearchableListing,
  rawQuery: string,
): MarketplaceListingRank {
  const queryWords = words(rawQuery);
  if (!queryWords.length)
    return { score: 0, tier: 'Related option', reasons: [], matchedTerms: [] };

  const query = queryWords.join(' ');
  const titleWords = words(listing.name);
  const title = titleWords.join(' ');
  const categoryWords = words(listing.category);
  const metadataWords = words(
    [
      listing.description,
      listing.aiSummary,
      ...listing.tags,
      ...listing.keywords,
      ...listing.searchPhrases,
    ]
      .filter(Boolean)
      .join(' '),
  );
  const expandedTerms = conceptTerms(queryWords);
  const matchedTerms = expandedTerms.filter(
    (term) =>
      titleWords.includes(term) ||
      categoryWords.includes(term) ||
      metadataWords.includes(term),
  );
  const reasons: string[] = [];

  let score = 0;
  if (title === query) {
    score += 1600;
    reasons.push('Exact product name');
  } else if (title.startsWith(`${query} `)) {
    score += 1300;
    reasons.push('Product name starts with your search');
  } else if (queryWords.every((word) => titleWords.includes(word))) {
    score += 1150;
    reasons.push('All search words appear in the product name');
  } else if (queryWords.some((word) => titleWords.includes(word))) {
    score += 850;
    reasons.push('Product name matches your search');
  }

  const synonymMatches = expandedTerms.filter(
    (term) => !queryWords.includes(term) && titleWords.includes(term),
  );
  if (synonymMatches.length) {
    score += 620;
    reasons.push(`Recognised related term: ${synonymMatches[0]}`);
  }
  if (queryWords.every((word) => categoryWords.includes(word))) {
    score += 350;
    reasons.push('Matching category');
  }
  if (queryWords.every((word) => metadataWords.includes(word))) {
    score += 240;
    reasons.push('Matching description or attributes');
  } else if (expandedTerms.some((word) => metadataWords.includes(word))) {
    score += 100;
    reasons.push('Related description or attributes');
  }

  const exactProductWord = queryWords.some((word) => titleWords.includes(word));
  const accessory = titleWords.some((word) => ACCESSORY_WORDS.has(word));
  if (exactProductWord && accessory && title !== query) {
    score -= 600;
    reasons.push('Related accessory');
  }

  score = Math.max(score, 0);
  const tier: MarketplaceMatchTier =
    score >= 1100
      ? 'Exact match'
      : score >= 600
        ? 'Strong match'
        : 'Related option';

  return {
    score,
    tier,
    reasons: [...new Set(reasons)].slice(0, 3),
    matchedTerms: [...new Set(matchedTerms)].slice(0, 8),
  };
}

export function scoreMarketplaceListing(
  listing: SearchableListing,
  rawQuery: string,
) {
  return rankMarketplaceListing(listing, rawQuery).score;
}

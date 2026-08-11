type SearchableListing = {
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  keywords: string[];
  searchPhrases: string[];
  aiSummary: string | null;
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
]);

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

export function scoreMarketplaceListing(
  listing: SearchableListing,
  rawQuery: string,
) {
  const queryWords = words(rawQuery);
  if (!queryWords.length) return 0;

  const query = queryWords.join(' ');
  const titleWords = words(listing.name);
  const title = titleWords.join(' ');
  const category = words(listing.category).join(' ');
  const metadata = words(
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

  let score = 0;
  if (title === query) score += 1400;
  else if (title.startsWith(`${query} `)) score += 1100;
  else if (titleWords.includes(query)) score += 1000;
  else if (title.includes(query)) score += 800;

  if (queryWords.every((word) => titleWords.includes(word))) score += 650;
  if (category.includes(query)) score += 350;
  if (queryWords.every((word) => metadata.includes(word))) score += 220;
  else if (queryWords.some((word) => metadata.includes(word))) score += 80;

  const exactProductWord = queryWords.some((word) => titleWords.includes(word));
  const accessoryOnly = titleWords.some((word) => ACCESSORY_WORDS.has(word));
  if (exactProductWord && accessoryOnly && title !== query) score -= 450;

  return Math.max(score, 0);
}

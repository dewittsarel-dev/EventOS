export interface SearchableSimulationListing {
  title: string;
  sku: string;
  supplierName: string;
  category: string;
  description: string;
}

export function normalizeSimulationSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/\[synthetic\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
      if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
      return word;
    })
    .join(' ');
}

function containsPhrase(value: string, query: string) {
  return ` ${value} `.includes(` ${query} `);
}

const productIntentDemotions: Record<string, string[]> = {
  glass: ['rack', 'transport', 'holder', 'underplate'],
};

export function simulationSearchScore(listing: SearchableSimulationListing, query: string) {
  if (!query) return 1;
  const title = normalizeSimulationSearch(listing.title);
  const words = query.split(' ');
  const containsAll = (value: string) => words.every((word) => value.includes(word));

  const intentDemotion = (productIntentDemotions[query] ?? []).some((word) =>
    title.split(' ').includes(word),
  ) ? 400 : 0;

  if (title === query) return 1200 - intentDemotion;
  // A searched product noun normally appears at the end: "Banquet Table" or "Dinner Fork".
  // Those direct products must precede accessories such as "Table Runner" or "Table Lamp".
  if (title.endsWith(` ${query}`)) return 1000 - intentDemotion;
  if (title.startsWith(`${query} `)) return 850 - intentDemotion;
  if (containsPhrase(title, query)) return 700 - intentDemotion;
  if (containsAll(title)) return 600 - intentDemotion;
  if (containsAll(normalizeSimulationSearch(listing.sku)) || containsAll(normalizeSimulationSearch(listing.supplierName))) return 300;
  if (containsAll(normalizeSimulationSearch(listing.category))) return 200;
  if (containsAll(normalizeSimulationSearch(listing.description))) return 100;
  return 0;
}

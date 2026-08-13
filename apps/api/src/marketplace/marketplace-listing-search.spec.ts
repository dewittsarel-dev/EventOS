import {
  rankMarketplaceListing,
  scoreMarketplaceListing,
} from './marketplace-listing-search';

const listing = (name: string, description = '') => ({
  name,
  description,
  category: 'Event hire',
  tags: [],
  keywords: [],
  searchPhrases: [],
  aiSummary: null,
});

describe('Marketplace listing relevance', () => {
  it('ranks a table ahead of table accessories', () => {
    expect(
      scoreMarketplaceListing(listing('Round Event Table'), 'table'),
    ).toBeGreaterThan(
      scoreMarketplaceListing(listing('Charcoal Table Runner'), 'table'),
    );
  });

  it('normalizes simple plurals', () => {
    expect(
      scoreMarketplaceListing(listing('Stainless Steel Fork'), 'forks'),
    ).toBeGreaterThan(0);
  });

  it('ranks drinking glassware ahead of transport equipment', () => {
    expect(
      scoreMarketplaceListing(listing('Crystal Drinking Glass'), 'glass'),
    ).toBeGreaterThan(
      scoreMarketplaceListing(listing('Glass Transport Rack'), 'glass'),
    );
  });

  it('recognizes common customer synonyms', () => {
    const result = rankMarketplaceListing(
      listing('Crystal Tumbler', 'Clear drinking glass for table settings'),
      'glassware',
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Recognised related term: tumbler');
  });

  it('returns customer-facing match explanations', () => {
    const result = rankMarketplaceListing(
      {
        ...listing('Gold Tiffany Chair'),
        category: 'Furniture and seating',
        tags: ['gold', 'classic'],
      },
      'gold chair',
    );
    expect(result.tier).toBe('Exact match');
    expect(result.reasons).toContain(
      'All search words appear in the product name',
    );
    expect(result.matchedTerms).toEqual(
      expect.arrayContaining(['gold', 'chair']),
    );
  });
});

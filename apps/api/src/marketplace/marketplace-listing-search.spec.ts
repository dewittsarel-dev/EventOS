import { scoreMarketplaceListing } from './marketplace-listing-search';

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
});

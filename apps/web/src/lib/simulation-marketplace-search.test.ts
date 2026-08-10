import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  matchesSimulationCategories,
  normalizeSimulationSearch,
  simulationSearchScore,
  type SearchableSimulationListing,
} from './simulation-marketplace-search';

describe('simulation marketplace category recommendations', () => {
  it('includes every category selected by the guided builder', () => {
    const recommendations = ['Venues', 'Furniture and tableware', 'Florals and styling'];

    expect(matchesSimulationCategories('Venues', '', recommendations)).toBe(true);
    expect(matchesSimulationCategories('Florals and styling', '', recommendations)).toBe(true);
    expect(matchesSimulationCategories('Photography', '', recommendations)).toBe(false);
  });

  it('allows a manual category to override combined recommendations', () => {
    const recommendations = ['Venues', 'Florals and styling'];

    expect(matchesSimulationCategories('Venues', 'Florals and styling', recommendations)).toBe(false);
    expect(matchesSimulationCategories('Florals and styling', 'Florals and styling', recommendations)).toBe(true);
  });
});

interface CatalogueListing extends SearchableSimulationListing {
  id: string;
}

const catalogue = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/simulation/eventos-marketplace-catalogue.json'), 'utf8'),
) as CatalogueListing[];

function results(query: string) {
  const normalized = normalizeSimulationSearch(query);
  return catalogue
    .map((listing) => ({ listing, score: simulationSearchScore(listing, normalized) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.listing.title.localeCompare(right.listing.title));
}

describe('simulation marketplace search quality', () => {
  it.each([
    ['fork', 'forks'],
    ['table', 'tables'],
    ['chair', 'chairs'],
    ['underplate', 'underplates'],
  ])('returns the same ordering for %s and %s', (singular, plural) => {
    expect(results(plural).map(({ listing }) => listing.id)).toEqual(
      results(singular).map(({ listing }) => listing.id),
    );
  });

  it('ranks actual tables before table accessories', () => {
    const topResults = results('table').slice(0, 20).map(({ listing }) =>
      normalizeSimulationSearch(listing.title),
    );

    expect(topResults.length).toBe(20);
    expect(topResults.every((title) => title.endsWith(' table'))).toBe(true);
    expect(topResults.some((title) => title.includes('table runner'))).toBe(false);
  });

  it.each(['chair', 'fork', 'underplate', 'ottoman', 'plinth'])
  ('puts direct product matches first for %s', (query) => {
    const topResults = results(query).slice(0, 10).map(({ listing }) =>
      normalizeSimulationSearch(listing.title),
    );

    expect(topResults.length).toBe(10);
    expect(topResults.every((title) => title.endsWith(` ${query}`))).toBe(true);
  });

  it('still ranks a specifically requested accessory as the direct result', () => {
    expect(normalizeSimulationSearch(results('table runner')[0].listing.title)).toContain('table runner');
  });

  it('ranks drinking glasses before glass transport and decor accessories', () => {
    const topResults = results('glass').slice(0, 20).map(({ listing }) =>
      normalizeSimulationSearch(listing.title),
    );

    expect(topResults.length).toBe(20);
    expect(topResults.every((title) => title.endsWith(' glass'))).toBe(true);
    expect(topResults.some((title) => title.includes('transport rack'))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  EVENT_INDUSTRY_TAXONOMY,
  suggestProductDiscovery,
} from './event-industry-taxonomy';

describe('event industry supplier taxonomy', () => {
  it('covers every supported product category with guided subcategories', () => {
    expect(Object.keys(EVENT_INDUSTRY_TAXONOMY)).toHaveLength(12);
    expect(EVENT_INDUSTRY_TAXONOMY.Catering).toContain('Glassware');
    expect(EVENT_INDUSTRY_TAXONOMY.Transport).toContain('Logistics coordination');
    expect(EVENT_INDUSTRY_TAXONOMY.Service).toContain('Event planning');
  });

  it('creates reviewable Marketplace language and discovery terms', () => {
    const suggestion = suggestProductDiscovery({
      productName: 'Gold Tiffany Chair',
      category: 'Equipment',
      subcategory: 'Chairs',
      colour: 'Gold',
      material: 'Metal',
      style: 'Classic wedding',
    });

    expect(suggestion.description).toContain('Gold Tiffany Chair');
    expect(suggestion.tags).toContain('chair');
    expect(suggestion.searchTerms).toContain('classic');
  });
});

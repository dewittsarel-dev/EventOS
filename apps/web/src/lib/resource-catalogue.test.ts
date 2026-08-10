import { describe, expect, it } from 'vitest';
import { RESOURCE_CATALOGUE, buildResourceSuggestions, inferResourceDefaults } from './resource-catalogue';

describe('resource catalogue guidance', () => {
  it('creates customer wording and searchable terms from simple supplier input', () => {
    const result = buildResourceSuggestions({ name: 'Gold Tiffany Chair', category: 'Furniture & seating', subcategory: 'Chairs', colour: 'Gold', material: 'Metal', style: 'Classic', delivery: 'Supplier delivery' });
    expect(result.description).toContain('Gold Tiffany Chair');
    expect(result.keywords).toEqual(expect.arrayContaining(['chair', 'chairs', 'gold', 'classic']));
    expect(result.searchPhrases).toContain('gold chairs');
  });

  it('maps services and venues to operational resource defaults', () => {
    expect(inferResourceDefaults('Transport & logistics')).toMatchObject({ resourceType: 'SERVICE', quantityMode: 'UNLIMITED' });
    expect(inferResourceDefaults('Venues & accommodation')).toMatchObject({ resourceType: 'VENUE', quantityMode: 'CAPACITY' });
    expect(inferResourceDefaults('Consumables & event supplies')).toMatchObject({ resourceType: 'CONSUMABLE', quantityMode: 'QUANTITY' });
  });

  it('covers event stock, production, venues, services and logistics', () => {
    expect(Object.keys(RESOURCE_CATALOGUE).length).toBeGreaterThanOrEqual(20);
    expect(RESOURCE_CATALOGUE['Furniture & seating']).toContain('Tables');
    expect(RESOURCE_CATALOGUE['Audio, visual & event technology']).toContain('LED walls');
    expect(RESOURCE_CATALOGUE['Transport & logistics']).toEqual(expect.arrayContaining([
      'Delivery & collection',
      'Warehousing & storage',
      'Loading & offloading',
    ]));
  });
});

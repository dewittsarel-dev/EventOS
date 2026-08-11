import { describe, expect, it } from 'vitest';
import {
  enrichProductDiscovery,
  normalizeProductLanguage,
  productSearchScore,
  type SearchableProduct,
} from './event-product-intelligence';

const product = (title: string, description = ''): SearchableProduct => ({
  title,
  sku: `TEST-${title}`,
  supplierName: 'Synthetic Supplier',
  category: 'Furniture and tableware',
  description,
});

describe('event product intelligence', () => {
  it('normalizes common singular and plural customer language', () => {
    expect(normalizeProductLanguage('tables')).toBe('table');
    expect(normalizeProductLanguage('forks')).toBe('fork');
    expect(normalizeProductLanguage('glasses')).toBe('glass');
    expect(normalizeProductLanguage('knives')).toBe('knife');
  });

  it('enriches supplier input with the same concepts Marketplace uses', () => {
    const result = enrichProductDiscovery({
      productName: 'Gold Tiffany Chair',
      category: 'Equipment',
      subcategory: 'Chairs',
      colour: 'Gold',
      material: 'Metal',
      style: 'Classic',
    });

    expect(result.concepts).toContain('chair');
    expect(result.tags).toContain('chair');
    expect(result.searchTerms).toContain('seating');
    expect(result.searchTerms).toContain('classic');
    expect(result.description).toContain('Gold Tiffany Chair');
  });

  it('ranks direct tables before accessories and operational equipment', () => {
    const direct = productSearchScore(product('Oak Banquet Table'), 'table');
    const accessory = productSearchScore(product('Charcoal Table Runner'), 'table');
    const support = productSearchScore(product('Table Transport Rack'), 'table');
    expect(direct).toBeGreaterThan(accessory);
    expect(accessory).toBeGreaterThan(support);
  });

  it('still treats a specifically requested table runner as a direct result', () => {
    expect(productSearchScore(product('Charcoal Table Runner'), 'table runner')).toBeGreaterThan(
      productSearchScore(product('Oak Banquet Table'), 'table runner'),
    );
  });

  it('ranks drinking glasses before glass transport racks', () => {
    expect(productSearchScore(product('Crystal Wine Glass'), 'glass')).toBeGreaterThan(
      productSearchScore(product('Glass Transport Rack'), 'glass'),
    );
  });
});

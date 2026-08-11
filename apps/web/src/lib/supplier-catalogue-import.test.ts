import { describe, expect, it } from 'vitest';
import { candidateToPayload, extractCsvCatalogue, parseCsv } from './supplier-catalogue-import';

describe('supplier catalogue import', () => {
  it('parses quoted CSV values', () => {
    expect(parseCsv('name,description\n"Gold Chair","Elegant, stackable"')).toEqual([
      ['name', 'description'],
      ['Gold Chair', 'Elegant, stackable'],
    ]);
  });

  it('proposes categories and synonyms while identifying missing confirmations', () => {
    const [candidate] = extractCsvCatalogue(
      'Product Name,Description,Colour,Price\nGold Tiffany Chair,Wedding chair,Gold,"1 250,50"',
      'catalogue.csv',
    );
    expect(candidate.category).toBe('Decor');
    expect(candidate.searchTerms).toEqual(expect.arrayContaining(['chairs', 'seating', 'gold']));
    expect(candidate.sellingPrice).toBe(1250.5);
    expect(candidate.issues).toContain('Cost price requires confirmation.');
    expect(candidate.issues).toContain('Quantity requires confirmation.');
  });

  it('converts approved candidates into the existing guided product contract', () => {
    const [candidate] = extractCsvCatalogue(
      'name,cost,quantity,material\nOak Table,500,12,Oak',
      'catalogue.csv',
    );
    expect(candidateToPayload(candidate, 'org-1')).toMatchObject({
      organizationId: 'org-1',
      productName: 'Oak Table',
      category: 'Decor',
      costPrice: 500,
      totalQuantity: 12,
      attributes: { material: 'Oak' },
    });
  });
});

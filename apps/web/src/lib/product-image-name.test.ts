import { describe, expect, it } from 'vitest';
import { suggestProductNameFromVisibleText } from './product-image-name';

describe('suggestProductNameFromVisibleText', () => {
  it('selects a product-like name from an image label', () => {
    expect(suggestProductNameFromVisibleText('EVENT HIRE\nGold Tiffany Chair\nR 100 each\nwww.example.test')).toBe('Gold Tiffany Chair');
  });

  it('ignores prices and contact details', () => {
    expect(suggestProductNameFromVisibleText('R 250.00\ninfo@example.test\nTel 012 345 6789')).toBe('');
  });

  it('returns an empty suggestion for an image without readable text', () => {
    expect(suggestProductNameFromVisibleText('   \n')).toBe('');
  });
});

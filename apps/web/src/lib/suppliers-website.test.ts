import { describe, expect, it } from 'vitest';
import {
  normalizeSupplierWebsite,
  validateSupplierWebsite,
} from './suppliers-website';

describe('suppliers-website', () => {
  it('normalizes website without protocol to https', () => {
    expect(normalizeSupplierWebsite('www.custechonline.com')).toBe(
      'https://www.custechonline.com',
    );
    expect(normalizeSupplierWebsite('custechonline.com')).toBe(
      'https://custechonline.com',
    );
  });

  it('keeps existing https website unchanged', () => {
    expect(normalizeSupplierWebsite('https://www.custechonline.com')).toBe(
      'https://www.custechonline.com',
    );
  });

  it('returns clear validation message for invalid website', () => {
    const result = validateSupplierWebsite('not a url');

    expect(result.error).toBe(
      'Website must be a valid URL, for example https://example.com.',
    );
  });
});

import {
  normalizeProductLanguage,
  productSearchScore,
  type SearchableProduct,
} from './event-product-intelligence';

export type SearchableSimulationListing = SearchableProduct;

export function matchesSimulationCategories(
  listingCategory: string,
  selectedCategory: string,
  recommendedCategories: string[],
) {
  if (selectedCategory) return listingCategory === selectedCategory;
  return recommendedCategories.length === 0 || recommendedCategories.includes(listingCategory);
}

export function normalizeSimulationSearch(value: string) {
  return normalizeProductLanguage(value);
}

export function simulationSearchScore(listing: SearchableSimulationListing, query: string) {
  return productSearchScore(listing, query);
}

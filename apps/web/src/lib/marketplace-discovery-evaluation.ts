import { productSearchScore, type SearchableProduct } from './event-product-intelligence';

export type DiscoveryRelationship = 'DIRECT' | 'RELATED_ACCESSORY' | 'OPERATIONAL_EQUIPMENT';

export interface DiscoveryEvaluationListing extends SearchableProduct {
  id: string;
  productType: string;
  relationship: DiscoveryRelationship;
}

export interface DiscoveryRankingTarget {
  productType: string;
  maximumRank: number;
  relationship: DiscoveryRelationship;
}

export interface DiscoveryEvaluationCase {
  id: string;
  kind: 'SIMPLE_ITEM' | 'AMBIGUOUS' | 'THEME' | 'COLOUR' | 'STYLE' | 'MULTI_REQUIREMENT';
  query: string;
  topN: number;
  expectedProductTypes: string[];
  excludedProductTypes: string[];
  rankingTargets: DiscoveryRankingTarget[];
}

export interface DiscoveryEvaluationFailure {
  caseId: string;
  message: string;
}

export const MARKETPLACE_DISCOVERY_EVALUATION_V1 = {
  version: '1.0.0',
  listings: [
    { id: 'table', productType: 'EVENT_TABLE', relationship: 'DIRECT', title: 'Round Event Table', sku: 'TABLE-001', supplierName: 'Event Furniture Co', category: 'Furniture and tableware', description: 'Round dining table for event seating.', searchTerms: ['table', 'dining', 'round'] },
    { id: 'table-rectangular', productType: 'EVENT_TABLE', relationship: 'DIRECT', title: 'Rectangular Banquet Table', sku: 'TABLE-002', supplierName: 'Event Furniture Co', category: 'Furniture and tableware', description: 'Rectangular banquet table for event seating.', searchTerms: ['table', 'banquet', 'rectangular'] },
    { id: 'table-cocktail', productType: 'EVENT_TABLE', relationship: 'DIRECT', title: 'Tall Cocktail Table', sku: 'TABLE-003', supplierName: 'Event Furniture Co', category: 'Furniture and tableware', description: 'Tall cocktail table for standing receptions.', searchTerms: ['table', 'cocktail', 'standing'] },
    { id: 'runner', productType: 'TABLE_RUNNER', relationship: 'RELATED_ACCESSORY', title: 'Charcoal Table Runner', sku: 'LINEN-001', supplierName: 'Event Linen Co', category: 'Linen', description: 'Textile runner for a styled tablescape.', searchTerms: ['table runner', 'linen', 'tablescape'] },
    { id: 'rack', productType: 'TABLE_TRANSPORT_RACK', relationship: 'OPERATIONAL_EQUIPMENT', title: 'Table Transport Rack', sku: 'OPS-001', supplierName: 'Event Logistics Co', category: 'Operational equipment', description: 'Rack used to transport tables.', searchTerms: ['table rack', 'transport', 'storage'] },
    { id: 'fork', productType: 'DINNER_FORK', relationship: 'DIRECT', title: 'Polished Dinner Fork', sku: 'CUT-001', supplierName: 'Tableware Co', category: 'Cutlery', description: 'Polished fork for formal place settings.', searchTerms: ['fork', 'forks', 'cutlery', 'flatware'] },
    { id: 'glass', productType: 'DRINKING_GLASS', relationship: 'DIRECT', title: 'Crystal Drinking Glass', sku: 'GLASS-001', supplierName: 'Glassware Co', category: 'Glassware', description: 'Clear drinking glass for guest place settings.', searchTerms: ['glass', 'glasses', 'drinkware', 'tumbler'] },
    { id: 'glass-wine', productType: 'DRINKING_GLASS', relationship: 'DIRECT', title: 'Stemmed Wine Glass', sku: 'GLASS-002', supplierName: 'Glassware Co', category: 'Glassware', description: 'Wine glass for guest place settings.', searchTerms: ['glass', 'glasses', 'wine', 'drinkware'] },
    { id: 'glass-rack', productType: 'GLASS_TRANSPORT_RACK', relationship: 'OPERATIONAL_EQUIPMENT', title: 'Glass Transport Rack', sku: 'OPS-002', supplierName: 'Event Logistics Co', category: 'Operational equipment', description: 'Compartment rack for transporting glassware.', searchTerms: ['glass rack', 'transport', 'storage'] },
    { id: 'vintage', productType: 'VINTAGE_LOUNGE', relationship: 'DIRECT', title: 'Vintage Lounge Setting', sku: 'STYLE-001', supplierName: 'Heritage Decor Co', category: 'Decor and lounge furniture', description: 'Classic old fashioned lounge setting with warm wood and brass details.', searchTerms: ['old fashioned function', 'vintage', 'classic', 'heritage', 'warm'] },
    { id: 'modern-chair', productType: 'MODERN_ACRYLIC_CHAIR', relationship: 'DIRECT', title: 'Modern Clear Acrylic Chair', sku: 'CHAIR-001', supplierName: 'Contemporary Hire Co', category: 'Furniture', description: 'Contemporary transparent chair for modern events.', searchTerms: ['modern', 'clear', 'contemporary'] },
    { id: 'sage-linen', productType: 'SAGE_GREEN_LINEN', relationship: 'DIRECT', title: 'Sage Green Wedding Linen', sku: 'LINEN-002', supplierName: 'Event Linen Co', category: 'Linen', description: 'Soft sage green linen for romantic wedding tables.', searchTerms: ['sage green', 'wedding', 'romantic', 'natural colour'] },
    { id: 'black-plinth', productType: 'BLACK_MINIMALIST_PLINTH', relationship: 'DIRECT', title: 'Black Minimalist Display Plinth', sku: 'PLINTH-001', supplierName: 'Modern Decor Co', category: 'Decor', description: 'Minimal black plinth for product launches and modern displays.', searchTerms: ['black', 'minimalist', 'modern', 'product launch'] },
    { id: 'neutral-package', productType: 'NEUTRAL_OUTDOOR_WEDDING_PACKAGE', relationship: 'DIRECT', title: 'Elegant Neutral Outdoor Wedding Package', sku: 'PACKAGE-001', supplierName: 'Complete Events Co', category: 'Event packages', description: 'Neutral outdoor wedding direction for 120 guests with an elegant tented reception.', searchTerms: ['elegant', 'outdoor', 'wedding', 'neutral', '120 guests', 'tent'] },
    { id: 'industrial-package', productType: 'INDUSTRIAL_EVENT_PACKAGE', relationship: 'DIRECT', title: 'Industrial Corporate Event Package', sku: 'PACKAGE-002', supplierName: 'Urban Events Co', category: 'Event packages', description: 'Dark industrial corporate event direction.', searchTerms: ['industrial', 'corporate', 'dark', 'urban'] },
  ] satisfies DiscoveryEvaluationListing[],
  cases: [
    { id: 'simple-table', kind: 'SIMPLE_ITEM', query: 'table', topN: 3, expectedProductTypes: ['EVENT_TABLE'], excludedProductTypes: ['TABLE_RUNNER', 'TABLE_TRANSPORT_RACK'], rankingTargets: [{ productType: 'EVENT_TABLE', maximumRank: 1, relationship: 'DIRECT' }, { productType: 'TABLE_RUNNER', maximumRank: 5, relationship: 'RELATED_ACCESSORY' }, { productType: 'TABLE_TRANSPORT_RACK', maximumRank: 8, relationship: 'OPERATIONAL_EQUIPMENT' }] },
    { id: 'plural-forks', kind: 'SIMPLE_ITEM', query: 'forks', topN: 1, expectedProductTypes: ['DINNER_FORK'], excludedProductTypes: ['TABLE_TRANSPORT_RACK'], rankingTargets: [{ productType: 'DINNER_FORK', maximumRank: 1, relationship: 'DIRECT' }] },
    { id: 'specific-runner', kind: 'SIMPLE_ITEM', query: 'table runner', topN: 1, expectedProductTypes: ['TABLE_RUNNER'], excludedProductTypes: ['EVENT_TABLE'], rankingTargets: [{ productType: 'TABLE_RUNNER', maximumRank: 1, relationship: 'DIRECT' }] },
    { id: 'ambiguous-glass', kind: 'AMBIGUOUS', query: 'glass', topN: 2, expectedProductTypes: ['DRINKING_GLASS'], excludedProductTypes: ['GLASS_TRANSPORT_RACK'], rankingTargets: [{ productType: 'DRINKING_GLASS', maximumRank: 1, relationship: 'DIRECT' }, { productType: 'GLASS_TRANSPORT_RACK', maximumRank: 5, relationship: 'OPERATIONAL_EQUIPMENT' }] },
    { id: 'theme-old-fashioned', kind: 'THEME', query: 'old fashioned function', topN: 2, expectedProductTypes: ['VINTAGE_LOUNGE'], excludedProductTypes: ['MODERN_ACRYLIC_CHAIR'], rankingTargets: [{ productType: 'VINTAGE_LOUNGE', maximumRank: 1, relationship: 'DIRECT' }] },
    { id: 'colour-sage-green', kind: 'COLOUR', query: 'sage green wedding decor', topN: 2, expectedProductTypes: ['SAGE_GREEN_LINEN'], excludedProductTypes: ['INDUSTRIAL_EVENT_PACKAGE'], rankingTargets: [{ productType: 'SAGE_GREEN_LINEN', maximumRank: 1, relationship: 'DIRECT' }] },
    { id: 'style-minimalist', kind: 'STYLE', query: 'black minimalist product launch', topN: 2, expectedProductTypes: ['BLACK_MINIMALIST_PLINTH'], excludedProductTypes: ['VINTAGE_LOUNGE'], rankingTargets: [{ productType: 'BLACK_MINIMALIST_PLINTH', maximumRank: 1, relationship: 'DIRECT' }] },
    { id: 'multi-outdoor-wedding', kind: 'MULTI_REQUIREMENT', query: 'elegant outdoor wedding neutral 120 guests', topN: 2, expectedProductTypes: ['NEUTRAL_OUTDOOR_WEDDING_PACKAGE'], excludedProductTypes: ['INDUSTRIAL_EVENT_PACKAGE'], rankingTargets: [{ productType: 'NEUTRAL_OUTDOOR_WEDDING_PACKAGE', maximumRank: 1, relationship: 'DIRECT' }] },
  ] satisfies DiscoveryEvaluationCase[],
};

export function rankDiscoveryListings(listings: DiscoveryEvaluationListing[], query: string) {
  return listings
    .map((listing) => ({ listing, score: productSearchScore(listing, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.listing.title.localeCompare(right.listing.title));
}

export function evaluateMarketplaceDiscovery(
  evaluation = MARKETPLACE_DISCOVERY_EVALUATION_V1,
): DiscoveryEvaluationFailure[] {
  return evaluation.cases.flatMap((testCase) => {
    const ranked = rankDiscoveryListings(evaluation.listings, testCase.query);
    const topTypes = ranked.slice(0, testCase.topN).map(({ listing }) => listing.productType);
    const failures: DiscoveryEvaluationFailure[] = [];

    for (const expected of testCase.expectedProductTypes) {
      if (!topTypes.includes(expected)) failures.push({ caseId: testCase.id, message: `${expected} was not present in the top ${testCase.topN}.` });
    }
    for (const excluded of testCase.excludedProductTypes) {
      if (topTypes.includes(excluded)) failures.push({ caseId: testCase.id, message: `${excluded} was incorrectly present in the top ${testCase.topN}.` });
    }
    for (const target of testCase.rankingTargets) {
      const rank = ranked.findIndex(({ listing }) => listing.productType === target.productType) + 1;
      if (rank === 0 || rank > target.maximumRank) failures.push({ caseId: testCase.id, message: `${target.relationship} ${target.productType} ranked ${rank || 'outside results'}; target is <= ${target.maximumRank}.` });
    }
    return failures;
  });
}

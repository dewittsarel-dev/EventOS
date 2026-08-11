import { describe, expect, it } from 'vitest';
import {
  evaluateMarketplaceDiscovery,
  MARKETPLACE_DISCOVERY_EVALUATION_V1,
  rankDiscoveryListings,
} from './marketplace-discovery-evaluation';

describe(`Marketplace discovery evaluation ${MARKETPLACE_DISCOVERY_EVALUATION_V1.version}`, () => {
  it('declares expected types, exclusions and ranking targets for every case', () => {
    for (const testCase of MARKETPLACE_DISCOVERY_EVALUATION_V1.cases) {
      expect(testCase.expectedProductTypes.length, testCase.id).toBeGreaterThan(0);
      expect(testCase.excludedProductTypes.length, testCase.id).toBeGreaterThan(0);
      expect(testCase.rankingTargets.length, testCase.id).toBeGreaterThan(0);
    }
  });

  it('covers every required discovery-evaluation kind', () => {
    expect(new Set(MARKETPLACE_DISCOVERY_EVALUATION_V1.cases.map((testCase) => testCase.kind))).toEqual(
      new Set(['SIMPLE_ITEM', 'AMBIGUOUS', 'THEME', 'COLOUR', 'STYLE', 'MULTI_REQUIREMENT']),
    );
  });

  it('measures direct, accessory and operational ranking relationships', () => {
    const relationships = MARKETPLACE_DISCOVERY_EVALUATION_V1.cases.flatMap((testCase) =>
      testCase.rankingTargets.map((target) => target.relationship),
    );
    expect(new Set(relationships)).toEqual(
      new Set(['DIRECT', 'RELATED_ACCESSORY', 'OPERATIONAL_EQUIPMENT']),
    );
  });

  it('passes the complete gold-standard evaluation set', () => {
    expect(evaluateMarketplaceDiscovery()).toEqual([]);
  });

  it('produces inspectable ranked evidence for every case', () => {
    for (const testCase of MARKETPLACE_DISCOVERY_EVALUATION_V1.cases) {
      const ranked = rankDiscoveryListings(MARKETPLACE_DISCOVERY_EVALUATION_V1.listings, testCase.query);
      expect(ranked.length, testCase.id).toBeGreaterThan(0);
      expect(ranked[0].score, testCase.id).toBeGreaterThan(0);
    }
  });
});

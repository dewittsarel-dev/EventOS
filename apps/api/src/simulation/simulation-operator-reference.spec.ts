import {
  assertOperatorReferenceCompanyIsProtected,
  OPERATOR_REFERENCE_COMPANY,
  OPERATOR_REFERENCE_LIFECYCLE,
} from './simulation-operator-reference';
import { isAutomatedSimulationOwnedSlug } from './simulation-persistence';

describe('operator reference simulation company', () => {
  it('is preserved by automated simulator reset', () => {
    expect(
      isAutomatedSimulationOwnedSlug(OPERATOR_REFERENCE_COMPANY.suggestedSlug),
    ).toBe(false);
    expect(assertOperatorReferenceCompanyIsProtected).not.toThrow();
    expect(OPERATOR_REFERENCE_COMPANY.resetPolicy).toBe('Preserve');
  });

  it('covers supplier and planner work through closeout', () => {
    expect(OPERATOR_REFERENCE_COMPANY.roles).toEqual([
      'Supplier',
      'EventPlanner',
    ]);
    expect(OPERATOR_REFERENCE_LIFECYCLE).toContain('MarketplacePublication');
    expect(OPERATOR_REFERENCE_LIFECYCLE).toContain('EventPlanning');
    expect(OPERATOR_REFERENCE_LIFECYCLE.at(-1)).toBe('EventCloseout');
  });
});

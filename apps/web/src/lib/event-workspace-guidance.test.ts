import { describe, expect, it } from 'vitest';
import { commercialGuidance, executionGuidance, financeGuidance, procurementGuidance } from './event-workspace-guidance';

describe('event workspace guidance', () => {
  it('directs draft procurement packages to transparent analysis', () => {
    expect(procurementGuidance([{ status: 'Draft' } as never]).nextAction).toMatch(/Analyse draft/);
  });

  it('prioritises commercial substitutions before awards', () => {
    const workspace = { rfqs: [], awards: [], purchaseOrderDrafts: [], quotes: [{ lines: [{ substitutionImpact: { status: 'PendingReview' } }] }] } as never;
    expect(commercialGuidance([workspace], 0).stage).toBe('Substitution review');
  });

  it('prioritises live execution incidents', () => {
    const workspace = { status: 'Live', incidents: [{ status: 'Open' }], gates: [], tasks: [] } as never;
    expect(executionGuidance(workspace).nextAction).toMatch(/incidents/);
  });

  it('requires an approved budget baseline first', () => {
    const workspace = { status: 'Active', budgetVersions: [], changes: [], reconciliations: [], closeItems: [] } as never;
    expect(financeGuidance(workspace).stage).toBe('Budget baseline');
  });
});

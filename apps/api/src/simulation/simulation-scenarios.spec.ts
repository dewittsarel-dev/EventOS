import { createSimulationScenarios } from './simulation-scenarios';

describe('simulation scenarios', () => {
  const scenarios = createSimulationScenarios();

  it('covers the complete complexity ladder deterministically', () => {
    expect(scenarios).toHaveLength(5);
    expect(createSimulationScenarios()).toEqual(scenarios);
    expect(scenarios.map(({ attendeeCount }) => attendeeCount)).toEqual([
      12, 45, 180, 850, 12000,
    ]);
  });

  it('drives the complete Marketplace to finance lifecycle', () => {
    expect(
      scenarios.every(
        ({ lifecycle }) =>
          lifecycle[0] === 'MarketplaceDiscovery' &&
          lifecycle.includes('EventExecution') &&
          lifecycle.includes('FinanceReconciliation') &&
          lifecycle.at(-1) === 'EventCloseout',
      ),
    ).toBe(true);
  });

  it('covers every required failure mode', () => {
    const failures = new Set(scenarios.flatMap(({ failures }) => failures));
    expect(failures).toEqual(
      new Set([
        'UnavailableStock',
        'SupplierRejection',
        'SubstitutionRequired',
        'LateDelivery',
        'CustomerCancellation',
        'BudgetChange',
        'PaymentFailure',
      ]),
    );
  });
});

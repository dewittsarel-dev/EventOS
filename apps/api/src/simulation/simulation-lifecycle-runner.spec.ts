import { SimulationLifecycleRunner } from './simulation-lifecycle-runner';
import { createSimulationScenarios } from './simulation-scenarios';

describe('simulation lifecycle runner', () => {
  it('exercises every scenario through the complete lifecycle', () => {
    const report = new SimulationLifecycleRunner().run();

    expect(report.synthetic).toBe(true);
    expect(report.totals.scenarios).toBe(5);
    expect(report.totals.lifecycleSteps).toBe(
      createSimulationScenarios().reduce(
        (total, scenario) => total + scenario.lifecycle.length,
        0,
      ),
    );
    expect(
      report.scenarioResults.every((result) => result.status === 'passed'),
    ).toBe(true);
  });

  it('recovers each requested failure at its owning workflow stage', () => {
    const report = new SimulationLifecycleRunner().run();
    const exercised = report.scenarioResults
      .flatMap((result) => result.steps)
      .flatMap((step) => step.failuresExercised);

    expect(new Set(exercised)).toEqual(
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
    expect(report.totals.recoveries).toBeGreaterThan(0);
  });
});

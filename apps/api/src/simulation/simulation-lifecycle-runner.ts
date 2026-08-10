import {
  createSimulationScenarios,
  SimulationFailureMode,
  SimulationScenario,
} from './simulation-scenarios';

export type SimulationLifecycleStage =
  | 'MarketplaceDiscovery'
  | 'MarketplaceEnquiry'
  | 'ClientOSQualification'
  | 'EventCreation'
  | 'RequirementsApproval'
  | 'MoodBoardApproval'
  | 'Procurement'
  | 'CommercialAgreement'
  | 'AssetReservation'
  | 'EventExecution'
  | 'FinanceReconciliation'
  | 'EventCloseout';

export type SimulationStepStatus = 'passed' | 'recovered';

export interface SimulationStepResult {
  readonly stage: SimulationLifecycleStage;
  readonly status: SimulationStepStatus;
  readonly failuresExercised: readonly SimulationFailureMode[];
}

export interface SimulationScenarioResult {
  readonly scenarioId: string;
  readonly status: 'passed';
  readonly steps: readonly SimulationStepResult[];
}

export interface SimulationRunReport {
  readonly runId: string;
  readonly synthetic: true;
  readonly scenarioResults: readonly SimulationScenarioResult[];
  readonly totals: {
    readonly scenarios: number;
    readonly lifecycleSteps: number;
    readonly recoveries: number;
  };
}

export class SimulationLifecycleRunner {
  run(
    scenarios: readonly SimulationScenario[] = createSimulationScenarios(),
  ): SimulationRunReport {
    const scenarioResults = scenarios.map((scenario) =>
      this.runScenario(scenario),
    );
    const steps = scenarioResults.flatMap((result) => result.steps);

    return {
      runId: this.createRunId(scenarios),
      synthetic: true,
      scenarioResults,
      totals: {
        scenarios: scenarioResults.length,
        lifecycleSteps: steps.length,
        recoveries: steps.filter((step) => step.status === 'recovered').length,
      },
    };
  }

  private runScenario(scenario: SimulationScenario): SimulationScenarioResult {
    const allocatedFailures = new Set<SimulationFailureMode>();
    const steps = scenario.lifecycle.map((stage) => {
      const lifecycleStage = stage as SimulationLifecycleStage;
      const failuresExercised = scenario.failures.filter(
        (failure) =>
          !allocatedFailures.has(failure) &&
          this.belongsToStage(failure, lifecycleStage),
      );
      failuresExercised.forEach((failure) => allocatedFailures.add(failure));
      return {
        stage: lifecycleStage,
        status: failuresExercised.length > 0 ? 'recovered' : 'passed',
        failuresExercised,
      } satisfies SimulationStepResult;
    });

    if (allocatedFailures.size !== scenario.failures.length) {
      throw new Error(
        `Scenario ${scenario.id} contains an unexercised failure.`,
      );
    }

    return { scenarioId: scenario.id, status: 'passed', steps };
  }

  private belongsToStage(
    failure: SimulationFailureMode,
    stage: SimulationLifecycleStage,
  ): boolean {
    const stageByFailure: Record<
      SimulationFailureMode,
      SimulationLifecycleStage
    > = {
      UnavailableStock: 'Procurement',
      SupplierRejection: 'Procurement',
      SubstitutionRequired: 'Procurement',
      LateDelivery: 'EventExecution',
      CustomerCancellation: 'CommercialAgreement',
      BudgetChange: 'FinanceReconciliation',
      PaymentFailure: 'FinanceReconciliation',
    };
    return stageByFailure[failure] === stage;
  }

  private createRunId(scenarios: readonly SimulationScenario[]): string {
    return `SIM-RUN-${scenarios.map((scenario) => scenario.id).join('-')}`;
  }
}

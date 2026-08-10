export type SimulationGateCategory =
  'performance' | 'security' | 'accessibility' | 'recovery' | 'upgrade';

export interface SimulationLaunchGate {
  readonly id: string;
  readonly category: SimulationGateCategory;
  readonly requiredEvidence: string;
  readonly blocking: true;
}

export const SIMULATION_LAUNCH_GATES: readonly SimulationLaunchGate[] = [
  {
    id: 'PERF-001',
    category: 'performance',
    requiredEvidence:
      'Marketplace catalogue and ClientOS workspace meet agreed latency thresholds at 50 and 150 concurrent-business profiles.',
    blocking: true,
  },
  {
    id: 'SEC-001',
    category: 'security',
    requiredEvidence:
      'Marketplace authorization tests prove that no private ClientOS fields or cross-organization records are exposed.',
    blocking: true,
  },
  {
    id: 'A11Y-001',
    category: 'accessibility',
    requiredEvidence:
      'Critical customer and operator journeys pass automated checks and keyboard-only review against WCAG 2.2 AA.',
    blocking: true,
  },
  {
    id: 'REC-001',
    category: 'recovery',
    requiredEvidence:
      'A backup is restored into an isolated rehearsal database and deterministic scenario records reconcile successfully.',
    blocking: true,
  },
  {
    id: 'UPG-001',
    category: 'upgrade',
    requiredEvidence:
      'A backward-compatible migration, staged deployment, health verification and rollback complete without losing accepted work.',
    blocking: true,
  },
] as const;

export function assertLaunchEvidence(
  evidenceByGate: Readonly<Record<string, boolean>>,
): void {
  const missing = SIMULATION_LAUNCH_GATES.filter(
    (gate) => evidenceByGate[gate.id] !== true,
  );
  if (missing.length > 0) {
    throw new Error(
      `Launch blocked: missing evidence for ${missing.map((gate) => gate.id).join(', ')}.`,
    );
  }
}

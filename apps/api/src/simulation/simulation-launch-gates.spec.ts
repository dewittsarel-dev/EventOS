import {
  assertLaunchEvidence,
  SIMULATION_LAUNCH_GATES,
} from './simulation-launch-gates';

describe('simulation launch gates', () => {
  it('requires all five non-functional assurance categories', () => {
    expect(
      new Set(SIMULATION_LAUNCH_GATES.map((gate) => gate.category)),
    ).toEqual(
      new Set([
        'performance',
        'security',
        'accessibility',
        'recovery',
        'upgrade',
      ]),
    );
    expect(SIMULATION_LAUNCH_GATES.every((gate) => gate.blocking)).toBe(true);
  });

  it('blocks release when any evidence is absent', () => {
    expect(() => assertLaunchEvidence({ 'PERF-001': true })).toThrow(/SEC-001/);
  });

  it('allows release only when every gate has evidence', () => {
    const evidence = Object.fromEntries(
      SIMULATION_LAUNCH_GATES.map((gate) => [gate.id, true]),
    );

    expect(() => assertLaunchEvidence(evidence)).not.toThrow();
  });
});

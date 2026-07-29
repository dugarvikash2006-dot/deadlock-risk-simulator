/**
 * Canonical identifiers for the six built-in scenarios (Phase 3 §10). Full
 * Scenario data (processes/resources/requests) is authored separately in
 * src/scenarios/ — this file exists so identifiers are defined once and
 * referenced everywhere else, rather than as ad hoc string literals.
 */
export const SCENARIO_IDS = {
  SIMPLE_ALLOCATION: 'simple-allocation',
  RESOURCE_STARVATION: 'resource-starvation',
  NEAR_CYCLE_TRAP: 'near-cycle-trap',
  TRUE_DEADLOCK: 'true-deadlock',
  HIGH_CONTENTION: 'high-contention',
  OSCILLATION_STRESS_TEST: 'oscillation-stress-test',
} as const

export type ScenarioId = (typeof SCENARIO_IDS)[keyof typeof SCENARIO_IDS]

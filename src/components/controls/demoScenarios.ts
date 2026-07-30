import { ProcessStatus, RequestStatus } from '@shared-types/domain'
import type { Scenario } from '@shared-types/simulation'
import { SCENARIO_IDS } from '@config/scenarios'
import type { ScenarioId } from '@config/scenarios'

/**
 * Kept separate from ScenarioSelector.tsx (which only exports the
 * component) so that file stays Fast-Refresh-safe — the same reasoning
 * as state/storeContext.ts in Step 10.
 */
export const ALL_SCENARIO_IDS: readonly ScenarioId[] = [
  SCENARIO_IDS.SIMPLE_ALLOCATION,
  SCENARIO_IDS.RESOURCE_STARVATION,
  SCENARIO_IDS.NEAR_CYCLE_TRAP,
  SCENARIO_IDS.TRUE_DEADLOCK,
  SCENARIO_IDS.HIGH_CONTENTION,
  SCENARIO_IDS.OSCILLATION_STRESS_TEST,
]

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  [SCENARIO_IDS.SIMPLE_ALLOCATION]: 'Simple Allocation',
  [SCENARIO_IDS.RESOURCE_STARVATION]: 'Resource Starvation',
  [SCENARIO_IDS.NEAR_CYCLE_TRAP]: 'Near-Cycle Trap',
  [SCENARIO_IDS.TRUE_DEADLOCK]: 'True Deadlock',
  [SCENARIO_IDS.HIGH_CONTENTION]: 'High Contention',
  [SCENARIO_IDS.OSCILLATION_STRESS_TEST]: 'Oscillation Stress Test',
}

/**
 * Builds a small, self-contained demo Scenario for a given canonical id.
 * src/scenarios/*.ts (the authoritative home for these six scenarios'
 * real, narratively-accurate content) is still empty — authoring that is
 * a separate, not-yet-assigned step. This is a deliberately minimal
 * stand-in so Initialize/Play/Tick are genuinely exercisable this step,
 * not a replacement for that future work: each process gets one request
 * for a shared resource, staggered by issuedTick, so ticking forward
 * visibly changes what the Process/Resource tables show.
 */
export function buildDemoScenario(id: ScenarioId): Scenario {
  const isHighContention =
    id === SCENARIO_IDS.HIGH_CONTENTION ||
    id === SCENARIO_IDS.OSCILLATION_STRESS_TEST
  const isScarce =
    id === SCENARIO_IDS.RESOURCE_STARVATION || id === SCENARIO_IDS.TRUE_DEADLOCK
  const processCount = isHighContention ? 4 : 2
  const resourceUnits = isScarce ? 1 : 2

  const processes = Array.from({ length: processCount }, (_, index) => ({
    id: `P${String(index)}`,
    arrivalTick: 0,
    maxClaim: { R: 1 },
    requestSequence: [`REQ${String(index)}`],
    status: ProcessStatus.Active,
  }))

  const requests = Array.from({ length: processCount }, (_, index) => ({
    id: `REQ${String(index)}`,
    processId: `P${String(index)}`,
    resourceId: 'R',
    unitsRequested: 1,
    issuedTick: index,
    status: RequestStatus.Pending,
    lastEvaluatedTick: null,
  }))

  return {
    id,
    label: SCENARIO_LABELS[id],
    description: `Demo fixture for "${SCENARIO_LABELS[id]}" — ${String(processCount)} process(es) contending for ${String(resourceUnits)} unit(s) of R.`,
    config: { maxProcesses: processCount, maxResourceTypes: 1, seed: id },
    processes,
    resources: [{ id: 'R', totalInstances: resourceUnits, label: 'R' }],
    requests,
  }
}

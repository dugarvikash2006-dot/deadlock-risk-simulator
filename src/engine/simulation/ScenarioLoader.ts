/**
 * Scenario validation and initial-state construction. Structural
 * validation only: counts within SIMULATION_LIMITS, unique ids, and every
 * request/requestSequence entry referencing a real process or resource.
 * Says nothing about whether a scenario is solvable, safe, or
 * deadlock-free — that's the decision engine's concern, not the loader's.
 */
import { SimulationStatus } from '@shared-types/simulation'
import type { Scenario, SimulationState } from '@shared-types/simulation'
import { validateProcessCount, validateResourceCount } from '@utils/validation'
import type { ValidationResult } from '@utils/validation'
import { unique } from '@utils/array'

export type ScenarioLoadResult =
  | { readonly loaded: true; readonly state: SimulationState }
  | { readonly loaded: false; readonly errors: readonly string[] }

/** Validates a scenario's structural well-formedness before it's turned into initial state. */
export function validateScenario(scenario: Scenario): ValidationResult {
  const errors: string[] = []

  const processCountResult = validateProcessCount(scenario.processes.length)
  if (!processCountResult.valid) {
    errors.push(...processCountResult.errors)
  }

  const resourceCountResult = validateResourceCount(scenario.resources.length)
  if (!resourceCountResult.valid) {
    errors.push(...resourceCountResult.errors)
  }

  const processIds = scenario.processes.map((process) => process.id)
  if (unique(processIds).length !== processIds.length) {
    errors.push('Process ids must be unique.')
  }

  const resourceIds = scenario.resources.map((resource) => resource.id)
  if (unique(resourceIds).length !== resourceIds.length) {
    errors.push('Resource ids must be unique.')
  }

  const requestIds = scenario.requests.map((request) => request.id)
  if (unique(requestIds).length !== requestIds.length) {
    errors.push('Request ids must be unique.')
  }

  const processIdSet = new Set(processIds)
  const resourceIdSet = new Set(resourceIds)
  const requestIdSet = new Set(requestIds)

  for (const request of scenario.requests) {
    if (!processIdSet.has(request.processId)) {
      errors.push(
        `Request "${request.id}" references unknown process "${request.processId}".`,
      )
    }
    if (!resourceIdSet.has(request.resourceId)) {
      errors.push(
        `Request "${request.id}" references unknown resource "${request.resourceId}".`,
      )
    }
  }

  for (const process of scenario.processes) {
    for (const requestId of process.requestSequence) {
      if (!requestIdSet.has(requestId)) {
        errors.push(
          `Process "${process.id}" references unknown request "${requestId}".`,
        )
      }
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

/** Builds the initial, tick-0 SimulationState for a validated scenario. The graph starts empty — building it is the graph engine's job, a later step. */
export function loadScenario(scenario: Scenario): ScenarioLoadResult {
  const validation = validateScenario(scenario)
  if (!validation.valid) {
    return { loaded: false, errors: validation.errors }
  }

  return {
    loaded: true,
    state: {
      tick: 0,
      status: SimulationStatus.Idle,
      processes: scenario.processes,
      resources: scenario.resources,
      allocations: [],
      requests: scenario.requests,
      graph: { nodes: [], edges: [], tick: 0 },
      decisions: [],
      events: [],
    },
  }
}

/**
 * Loads a scenario by id from a registry of built-ins. Takes the registry
 * as a parameter rather than importing scenario data directly, so this
 * module has no dependency on any specific scenario's authored content
 * (src/scenarios/* is authored in a separate step).
 */
export function loadBuiltInScenario(
  id: string,
  registry: Readonly<Record<string, Scenario>>,
): ScenarioLoadResult {
  if (!Object.hasOwn(registry, id)) {
    return { loaded: false, errors: [`Unknown scenario id "${id}".`] }
  }
  return loadScenario(registry[id])
}

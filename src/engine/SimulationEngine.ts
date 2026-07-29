/**
 * The top-level engine facade: owns the current SimulationState and its
 * history, and exposes the lifecycle operations the state layer drives
 * (initialize/start/pause/resume/reset/tick). Contains no process,
 * resource, or tick logic itself — everything is delegated to the
 * simulation/ and history/ modules. Holds no timer of its own: pacing
 * (when to call tick()) is the caller's concern, keeping this engine
 * deterministic and free of side effects.
 */
import { SimulationStatus } from '@shared-types/simulation'
import type { Scenario, SimulationState } from '@shared-types/simulation'
import type { HistorySnapshot } from '@shared-types/history'
import * as HistoryStore from './history/HistoryStore'
import * as ScenarioLoader from './simulation/ScenarioLoader'
import * as TickManager from './simulation/TickManager'

export interface SimulationEngine {
  /** Loads a scenario and resets state/history to its tick-0 snapshot. */
  initialize(scenario: Scenario): ScenarioLoader.ScenarioLoadResult
  start(): void
  pause(): void
  resume(): void
  /** Reloads the currently loaded scenario back to its tick-0 snapshot. No-op if nothing has been loaded yet. */
  reset(): void
  /** Advances one tick if Running; otherwise returns the current state unchanged. */
  tick(): SimulationState
  getState(): SimulationState
  getHistory(): readonly HistorySnapshot[]
}

function createEmptyState(): SimulationState {
  return {
    tick: 0,
    status: SimulationStatus.Idle,
    processes: [],
    resources: [],
    allocations: [],
    requests: [],
    graph: { nodes: [], edges: [], tick: 0 },
    decisions: [],
    events: [],
  }
}

/** Builds a fresh, idle SimulationEngine with no scenario loaded. */
export function createSimulationEngine(): SimulationEngine {
  let state: SimulationState = createEmptyState()
  let history: readonly HistorySnapshot[] = []
  let loadedScenario: Scenario | null = null

  function loadAndSnapshot(
    scenario: Scenario,
  ): ScenarioLoader.ScenarioLoadResult {
    const result = ScenarioLoader.loadScenario(scenario)
    if (result.loaded) {
      loadedScenario = scenario
      state = result.state
      history = HistoryStore.appendSnapshot(HistoryStore.clearHistory(), state)
    }
    return result
  }

  return {
    initialize(scenario) {
      return loadAndSnapshot(scenario)
    },
    start() {
      if (
        state.status === SimulationStatus.Idle ||
        state.status === SimulationStatus.Paused
      ) {
        state = { ...state, status: SimulationStatus.Running }
      }
    },
    pause() {
      if (state.status === SimulationStatus.Running) {
        state = { ...state, status: SimulationStatus.Paused }
      }
    },
    resume() {
      if (state.status === SimulationStatus.Paused) {
        state = { ...state, status: SimulationStatus.Running }
      }
    },
    reset() {
      if (loadedScenario) {
        loadAndSnapshot(loadedScenario)
      } else {
        state = createEmptyState()
        history = HistoryStore.clearHistory()
      }
    },
    tick() {
      if (state.status !== SimulationStatus.Running) {
        return state
      }
      state = TickManager.processTick(state)
      history = HistoryStore.appendSnapshot(history, state)
      return state
    },
    getState() {
      return state
    },
    getHistory() {
      return history
    },
  }
}

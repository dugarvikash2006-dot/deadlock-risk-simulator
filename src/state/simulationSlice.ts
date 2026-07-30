/**
 * SimulationStore: owns the single, persistent SimulationEngine instance
 * (Step 4) for the app and exposes it as reactive state. Every action
 * (initialize/reset/tick/play/pause) delegates directly to
 * SimulationEngine and then mirrors the engine's resulting state back
 * into React via setState — the engine is the single source of truth for
 * *what* the simulation state is; this slice only makes that state
 * observable to React and re-renders when it changes.
 *
 * No algorithm logic lives here: nothing in this file decides, allocates,
 * or computes anything the engine doesn't already compute. The engine
 * instance itself is created exactly once via useState's lazy
 * initializer (its setter is never called) so it survives re-renders
 * without being recreated — it owns real, stateful history, and
 * recreating it would lose the run in progress.
 */
import { useCallback, useMemo, useState } from 'react'
import { createSimulationEngine } from '@engine/SimulationEngine'
import type { SimulationEngine } from '@engine/SimulationEngine'
import type { Scenario, SimulationState } from '@shared-types/simulation'
import type { HistorySnapshot } from '@shared-types/history'
import type { ScenarioLoadResult } from '@engine/simulation/ScenarioLoader'

export interface SimulationSlice {
  readonly simulationState: SimulationState
  /** The full run history recorded so far by SimulationEngine — the single accumulated snapshot array HistoryStore (replaySlice.ts) reads, not a separate copy. */
  readonly history: readonly HistorySnapshot[]
  readonly initialize: (scenario: Scenario) => ScenarioLoadResult
  readonly reset: () => void
  readonly tick: () => void
  readonly play: () => void
  readonly pause: () => void
}

export function useSimulationSlice(): SimulationSlice {
  const [engine] = useState<SimulationEngine>(() => createSimulationEngine())

  const [simulationState, setSimulationState] = useState<SimulationState>(() =>
    engine.getState(),
  )
  const [history, setHistory] = useState<readonly HistorySnapshot[]>(() =>
    engine.getHistory(),
  )

  const sync = useCallback(() => {
    setSimulationState(engine.getState())
    setHistory(engine.getHistory())
  }, [engine])

  const initialize = useCallback(
    (scenario: Scenario): ScenarioLoadResult => {
      const result = engine.initialize(scenario)
      sync()
      return result
    },
    [engine, sync],
  )

  const reset = useCallback(() => {
    engine.reset()
    sync()
  }, [engine, sync])

  const tick = useCallback(() => {
    setSimulationState(engine.tick())
    setHistory(engine.getHistory())
  }, [engine])

  const play = useCallback(() => {
    engine.start()
    sync()
  }, [engine, sync])

  const pause = useCallback(() => {
    engine.pause()
    sync()
  }, [engine, sync])

  return useMemo(
    () => ({ simulationState, history, initialize, reset, tick, play, pause }),
    [simulationState, history, initialize, reset, tick, play, pause],
  )
}

/**
 * The single React Context Provider for the whole state layer. Creates
 * exactly one instance of each store — SimulationStore, ComparisonStore,
 * HistoryStore, SettingsStore — and combines them into one context value
 * (defined in storeContext.ts, kept separate for Fast Refresh).
 *
 * Ownership:
 * - SimulationStore (simulationSlice.ts) owns the SimulationEngine
 *   instance and is the single source of truth for SimulationState and
 *   its accumulated history.
 * - ComparisonStore (comparisonSlice.ts) owns the latest per-engine
 *   result (Banker's/WFG/CTI/Decision) and the latest ComparisonReport —
 *   set from outside this layer, never computed here.
 * - HistoryStore (replaySlice.ts) owns only replay position (Live vs
 *   Replay, scrub index); it reads SimulationStore's `history` rather
 *   than keeping its own copy, so there is exactly one accumulated
 *   snapshot array in the whole app.
 * - SettingsStore (settingsSlice.ts) owns user-adjustable settings.
 *
 * Data flow: components call hooks (useSimulation/usePlayback/
 * useComparison) → hooks read this context (storeContext.ts) → this
 * context is populated by the four store hooks below → those hooks
 * delegate to the existing engines (SimulationEngine, @engine/history)
 * for anything that isn't plain state storage. No component should
 * construct its own engine instance or duplicate this state.
 *
 * Analysis integration (Step 12): a single effect watches
 * simulation.simulationState and, whenever it changes, calls
 * AnalysisCoordinator's runAnalysis() and feeds the result into
 * ComparisonStore via applyAnalysisResult(). Since SimulationEngine
 * always returns a new SimulationState object (Step 4), this one effect
 * uniformly covers every trigger the task calls out — initialize, tick,
 * each auto-tick during play, and reset — without needing to distinguish
 * which action caused the change. This is coordination (call an existing
 * pure function, thread its result into a setter), not business logic;
 * the actual analysis work happens entirely inside runAnalysis() and the
 * engines it calls, not in this component.
 */
import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useSimulationSlice } from './simulationSlice'
import { useComparisonSlice } from './comparisonSlice'
import { useHistorySlice } from './replaySlice'
import { useSettingsSlice } from './settingsSlice'
import { StoreContext } from './storeContext'
import { runAnalysis } from './analysisCoordinator'

export function StoreProvider({ children }: { readonly children: ReactNode }) {
  const simulation = useSimulationSlice()
  const comparison = useComparisonSlice()
  const history = useHistorySlice(simulation.history)
  const settings = useSettingsSlice()

  const { simulationState } = simulation
  const { applyAnalysisResult } = comparison
  useEffect(() => {
    applyAnalysisResult(runAnalysis(simulationState))
  }, [simulationState, applyAnalysisResult])

  const value = useMemo(
    () => ({ simulation, comparison, history, settings }),
    [simulation, comparison, history, settings],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

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
 */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useSimulationSlice } from './simulationSlice'
import { useComparisonSlice } from './comparisonSlice'
import { useHistorySlice } from './replaySlice'
import { useSettingsSlice } from './settingsSlice'
import { StoreContext } from './storeContext'

export function StoreProvider({ children }: { readonly children: ReactNode }) {
  const simulation = useSimulationSlice()
  const comparison = useComparisonSlice()
  const history = useHistorySlice(simulation.history)
  const settings = useSettingsSlice()

  const value = useMemo(
    () => ({ simulation, comparison, history, settings }),
    [simulation, comparison, history, settings],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

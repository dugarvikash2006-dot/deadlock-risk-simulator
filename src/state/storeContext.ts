/**
 * The combined state-layer Context and its access hook, kept in their
 * own file (not co-located with the StoreProvider component) so React
 * Fast Refresh works correctly — a file that exports both a component
 * and other values breaks Vite's component-only Fast Refresh detection.
 */
import { createContext, useContext } from 'react'
import type { SimulationSlice } from './simulationSlice'
import type { ComparisonSlice } from './comparisonSlice'
import type { HistorySlice } from './replaySlice'
import type { SettingsSlice } from './settingsSlice'

export interface StoreContextValue {
  readonly simulation: SimulationSlice
  readonly comparison: ComparisonSlice
  readonly history: HistorySlice
  readonly settings: SettingsSlice
}

export const StoreContext = createContext<StoreContextValue | null>(null)

/** Reads the combined store context. Throws outside a StoreProvider — a caller bug, not an expected runtime condition. */
export function useStore(): StoreContextValue {
  const value = useContext(StoreContext)
  if (!value) {
    throw new Error('useStore must be used within a StoreProvider.')
  }
  return value
}

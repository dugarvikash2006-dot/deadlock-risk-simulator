/**
 * Replay/history models. Depends only on simulation.ts.
 */
import type { SimulationState } from './simulation'

/**
 * A stored snapshot is structurally identical to a live SimulationState —
 * aliased rather than redeclared to avoid two divergent copies of the same
 * shape (an explicit "no duplicate models" requirement for this step).
 */
export type HistorySnapshot = SimulationState

export interface HistorySeries {
  readonly snapshots: readonly HistorySnapshot[]
  readonly scenarioId: string
}

export const ReplayMode = {
  Live: 'Live',
  Replay: 'Replay',
} as const
export type ReplayMode = (typeof ReplayMode)[keyof typeof ReplayMode]

export interface ReplayState {
  readonly mode: ReplayMode
  /** Null while mode is Live; set to a snapshot index while Replay. */
  readonly scrubIndex: number | null
}

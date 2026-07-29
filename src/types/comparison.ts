/**
 * Comparison Mode models. Depends on decision.ts (PolicyType) and
 * history.ts (HistorySeries).
 */
import type { PolicyType } from './decision'
import type { HistorySeries } from './history'

export interface ComparisonMetrics {
  readonly averageWaitTicks: number
  readonly requestsGranted: number
  readonly requestsHeld: number
  readonly deadlocksOccurred: number
  /** Invariant: must be within [0, 1]. */
  readonly resourceUtilization: number
  readonly decisionCount: number
}

/** One policy's complete, independent run over an identical scenario. */
export interface PolicyRunResult {
  readonly policy: PolicyType
  readonly history: HistorySeries
  readonly metrics: ComparisonMetrics
}

export interface ComparisonResult {
  readonly scenarioId: string
  /** Always exactly 3 entries — one per PolicyType — once a comparison completes. */
  readonly runs: readonly PolicyRunResult[]
}

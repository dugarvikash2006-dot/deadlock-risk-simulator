/**
 * Replay history storage: pure functions over a readonly snapshot array.
 * No internal mutable state — the SimulationEngine facade owns the actual
 * array reference and threads it through these calls, keeping snapshot
 * storage itself as deterministic and side-effect-free as everything else
 * in the engine.
 */
import type { HistorySnapshot } from '@shared-types/history'
import { HISTORY_LIMITS } from '@constants/simulationLimits'

/** Appends a snapshot, dropping the oldest entries once HISTORY_LIMITS.MAX_SNAPSHOTS is exceeded (a bounded ring, not unbounded growth). */
export function appendSnapshot(
  history: readonly HistorySnapshot[],
  snapshot: HistorySnapshot,
): readonly HistorySnapshot[] {
  const next = [...history, snapshot]
  if (next.length <= HISTORY_LIMITS.MAX_SNAPSHOTS) {
    return next
  }
  return next.slice(next.length - HISTORY_LIMITS.MAX_SNAPSHOTS)
}

/** Empties the history. */
export function clearHistory(): readonly HistorySnapshot[] {
  return []
}

/** The snapshot at a given index, or undefined if out of range. */
export function snapshotAt(
  history: readonly HistorySnapshot[],
  index: number,
): HistorySnapshot | undefined {
  return history[index]
}

/** The most recently recorded snapshot, or undefined if history is empty. */
export function latestSnapshot(
  history: readonly HistorySnapshot[],
): HistorySnapshot | undefined {
  return history.length === 0 ? undefined : history[history.length - 1]
}

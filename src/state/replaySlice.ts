/**
 * HistoryStore: layers replay position (Live vs Replay, scrub index) on
 * top of the snapshot history SimulationStore's engine already
 * maintains — it does not maintain its own copy of the snapshots (see
 * simulationSlice.ts's `history`, passed in here as a parameter).
 * seek()/clear() only change *position*; deriving the actual snapshot at
 * that position reuses @engine/history's snapshotAt()/latestSnapshot()
 * (Step 4) rather than re-deriving that lookup here.
 */
import { useCallback, useMemo, useState } from 'react'
import { ReplayMode } from '@shared-types/history'
import type { HistorySnapshot, ReplayState } from '@shared-types/history'
import { latestSnapshot, snapshotAt } from '@engine/history/HistoryStore'
import { clamp } from '@utils/math'

export interface HistorySlice {
  readonly snapshots: readonly HistorySnapshot[]
  readonly replayState: ReplayState
  /** The snapshot at the current replay position: the scrubbed snapshot in Replay mode, the latest one in Live mode. */
  readonly currentSnapshot: HistorySnapshot | undefined
  readonly seek: (index: number) => void
  /** Returns to Live mode (clears the scrub position). Does not erase snapshot history — SimulationStore owns that. */
  readonly clear: () => void
}

export function useHistorySlice(
  snapshots: readonly HistorySnapshot[],
): HistorySlice {
  const [replayState, setReplayState] = useState<ReplayState>({
    mode: ReplayMode.Live,
    scrubIndex: null,
  })

  const seek = useCallback(
    (index: number) => {
      if (snapshots.length === 0) {
        return
      }
      const clamped = clamp(index, 0, snapshots.length - 1)
      setReplayState({ mode: ReplayMode.Replay, scrubIndex: clamped })
    },
    [snapshots.length],
  )

  const clear = useCallback(() => {
    setReplayState({ mode: ReplayMode.Live, scrubIndex: null })
  }, [])

  const currentSnapshot = useMemo(() => {
    if (
      replayState.mode === ReplayMode.Replay &&
      replayState.scrubIndex !== null
    ) {
      return snapshotAt(snapshots, replayState.scrubIndex)
    }
    return latestSnapshot(snapshots)
  }, [snapshots, replayState])

  return useMemo(
    () => ({ snapshots, replayState, currentSnapshot, seek, clear }),
    [snapshots, replayState, currentSnapshot, seek, clear],
  )
}

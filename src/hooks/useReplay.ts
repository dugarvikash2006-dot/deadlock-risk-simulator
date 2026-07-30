/**
 * usePlayback: the actual tick-pacing loop lives here. SettingsStore's
 * simulationSpeed (ticks per second) drives a setInterval that calls
 * SimulationStore's tick() repeatedly while the engine's status is
 * Running; the interval is torn down on pause/unmount. Also exposes
 * HistoryStore's replay controls (seek/clear), so one hook covers both
 * "run the simulation forward" and "scrub back through its history."
 *
 * No algorithm logic: this only decides *when* to call tick()/seek(),
 * never *what* a tick or a decision does — that all happens inside
 * SimulationEngine (Step 4), which this hook never bypasses.
 */
import { useEffect } from 'react'
import { useStore } from '@state/storeContext'
import { SimulationStatus } from '@shared-types/simulation'
import type { HistorySnapshot, ReplayState } from '@shared-types/history'

export interface PlaybackApi {
  readonly isPlaying: boolean
  readonly play: () => void
  readonly pause: () => void
  readonly tick: () => void
  readonly snapshots: readonly HistorySnapshot[]
  readonly replayState: ReplayState
  readonly currentSnapshot: HistorySnapshot | undefined
  readonly seek: (index: number) => void
  readonly clear: () => void
}

export function usePlayback(): PlaybackApi {
  const { simulation, history, settings } = useStore()
  const { tick } = simulation
  const isPlaying =
    simulation.simulationState.status === SimulationStatus.Running

  useEffect(() => {
    if (!isPlaying) {
      return
    }
    const intervalMs = 1000 / Math.max(settings.simulationSpeed, 1)
    const id = setInterval(() => {
      tick()
    }, intervalMs)
    return () => {
      clearInterval(id)
    }
  }, [isPlaying, settings.simulationSpeed, tick])

  return {
    isPlaying,
    play: simulation.play,
    pause: simulation.pause,
    tick: simulation.tick,
    snapshots: history.snapshots,
    replayState: history.replayState,
    currentSnapshot: history.currentSnapshot,
    seek: history.seek,
    clear: history.clear,
  }
}

/**
 * SettingsStore: pure storage for user-adjustable settings — simulation
 * speed, CTI indicator weights, visualization options, and playback
 * controls. No calculations happen here: usePlayback reads
 * simulationSpeed to decide tick timing, and a future UI reads
 * ctiWeights/visualization to drive display, but this store never
 * computes anything from the values it holds.
 */
import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_CTI_WEIGHTS } from '@config/ctiWeights'
import type { CTIWeightsConfig } from '@shared-types/config'

export interface VisualizationOptions {
  readonly showAnimations: boolean
  readonly showGraphLabels: boolean
}

export interface PlaybackOptions {
  readonly autoPlay: boolean
  readonly loop: boolean
}

export interface SettingsState {
  /** Ticks per second while playing — see usePlayback (useReplay.ts). */
  readonly simulationSpeed: number
  readonly ctiWeights: CTIWeightsConfig
  readonly visualization: VisualizationOptions
  readonly playback: PlaybackOptions
}

const INITIAL_SETTINGS_STATE: SettingsState = {
  simulationSpeed: 1,
  ctiWeights: DEFAULT_CTI_WEIGHTS,
  visualization: { showAnimations: true, showGraphLabels: true },
  playback: { autoPlay: false, loop: false },
}

export interface SettingsSlice extends SettingsState {
  readonly setSimulationSpeed: (speed: number) => void
  readonly setCtiWeights: (weights: CTIWeightsConfig) => void
  readonly setVisualizationOptions: (
    options: Partial<VisualizationOptions>,
  ) => void
  readonly setPlaybackOptions: (options: Partial<PlaybackOptions>) => void
  readonly reset: () => void
}

export function useSettingsSlice(): SettingsSlice {
  const [state, setState] = useState<SettingsState>(INITIAL_SETTINGS_STATE)

  const setSimulationSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, simulationSpeed: speed }))
  }, [])
  const setCtiWeights = useCallback((weights: CTIWeightsConfig) => {
    setState((prev) => ({ ...prev, ctiWeights: weights }))
  }, [])
  const setVisualizationOptions = useCallback(
    (options: Partial<VisualizationOptions>) => {
      setState((prev) => ({
        ...prev,
        visualization: { ...prev.visualization, ...options },
      }))
    },
    [],
  )
  const setPlaybackOptions = useCallback(
    (options: Partial<PlaybackOptions>) => {
      setState((prev) => ({
        ...prev,
        playback: { ...prev.playback, ...options },
      }))
    },
    [],
  )
  const reset = useCallback(() => {
    setState(INITIAL_SETTINGS_STATE)
  }, [])

  return useMemo(
    () => ({
      ...state,
      setSimulationSpeed,
      setCtiWeights,
      setVisualizationOptions,
      setPlaybackOptions,
      reset,
    }),
    [
      state,
      setSimulationSpeed,
      setCtiWeights,
      setVisualizationOptions,
      setPlaybackOptions,
      reset,
    ],
  )
}

/**
 * Configuration model shapes. Standalone — no dependencies on other type
 * modules. Default values that satisfy these shapes live under src/config/,
 * kept separate from these type definitions per the Phase 3 folder split.
 */

/** Maps a Risk Indicator id to its aggregation weight. */
export type CTIWeightsConfig = Readonly<Record<string, number>>

export interface AnimationConfig {
  readonly fastMs: number
  readonly moderateMs: number
  readonly emphasisMs: number
}

export interface ThemeColorTokens {
  readonly grant: string
  readonly hold: string
  readonly ctiLow: string
  readonly ctiModerate: string
  readonly ctiHigh: string
  readonly ctiCritical: string
}

export interface ThemeConfig {
  readonly colors: ThemeColorTokens
}

export interface DeveloperConfig {
  readonly seedOverride: string | null
  readonly verboseLogging: boolean
  readonly debugOverlaysEnabled: boolean
}

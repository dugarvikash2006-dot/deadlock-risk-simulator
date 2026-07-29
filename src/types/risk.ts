/**
 * Risk framework models — the Cyclic Tension Index (CTI).
 * Depends only on graph.ts and domain.ts (both lower in the dependency
 * order), so the risk layer never needs to know about decisions or
 * simulation state. This is deliberate: it keeps every Risk Indicator
 * composable and testable in isolation (Phase 2 §7 / Phase 3 §8).
 */
import type { Graph } from './graph'
import type { Request } from './domain'

export const CTIBand = {
  Low: 'Low',
  Moderate: 'Moderate',
  High: 'High',
  Critical: 'Critical',
} as const
export type CTIBand = (typeof CTIBand)[keyof typeof CTIBand]

/**
 * Context passed to a Risk Indicator. Deliberately minimal — it does not
 * carry Decision or SimulationState (that would create an upward
 * dependency from risk.ts onto decision.ts/simulation.ts). Indicators
 * that need short-term history (e.g. a deferred frequency indicator) use
 * recentRequestTicks rather than a full state/decision log.
 */
export interface RiskIndicatorContext {
  readonly graph: Graph
  readonly request: Request
  readonly currentTick: number
  /** Ticks at which this (process, resource) pair issued a request recently. */
  readonly recentRequestTicks: readonly number[]
}

/**
 * The common plugin contract every Risk Indicator implements (Open/Closed
 * Principle — new indicators register here without RiskEngine changing).
 * Method signatures only; no implementation logic belongs in this file.
 */
export interface RiskIndicator {
  readonly id: string
  readonly name: string
  readonly description: string
  /** Starting weight if not overridden by CTIWeightsConfig. */
  readonly defaultWeight: number
  computeRaw(context: RiskIndicatorContext): number
  /** Maps a raw signal to [0, 1]. */
  normalize(raw: number, context: RiskIndicatorContext): number
}

export interface RiskIndicatorResult {
  readonly indicatorId: string
  readonly rawValue: number
  /** Invariant: must be within [0, 1]. */
  readonly normalizedValue: number
  readonly weight: number
}

export interface CTIResult {
  readonly requestId: string
  /** Invariant: must be within [0, 100]. */
  readonly score: number
  readonly band: CTIBand
  readonly indicators: readonly RiskIndicatorResult[]
  readonly tick: number
}

/** Dashboard-level rollup across all currently pending requests' CTIs. */
export interface SystemTensionLevelResult {
  /** Invariant: must be within [0, 100]. */
  readonly value: number
  readonly band: CTIBand
  readonly tick: number
  readonly contributingRequestIds: readonly string[]
}

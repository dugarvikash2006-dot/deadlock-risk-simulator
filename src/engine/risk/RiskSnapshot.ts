/**
 * Produces one immutable RiskSnapshot per tick, tying together the three
 * risk indicators, CTIScorer, and STLCalculator into a single packaged
 * result suitable for storing in history and replaying later.
 * Orchestration only — every actual computation lives in the module it's
 * named after; this file just calls them in order and assembles the
 * result. Reads SimulationState, the current wait-for Graph, and its
 * GraphMetrics; never mutates any of them, and never touches
 * SimulationState's processes/resources/allocations/requests arrays.
 */
import type { SimulationState } from '@shared-types/simulation'
import type { Graph } from '@shared-types/graph'
import { computeGraphMetrics } from '@engine/graph'
import type { CTIWeightsConfig } from '@shared-types/config'
import { now } from '@utils/time'
import { analyzeCycleProximity } from './indicators/CycleProximityIndicator'
import { analyzeContentionDensity } from './indicators/ContentionDensityIndicator'
import { analyzeTemporalWaiting } from './indicators/TemporalWaitingIndicator'
import { computeCTIScore } from './RiskEngine'
import type { CTIIndicatorBreakdown } from './RiskEngine'
import { computeSystemTensionLevel } from './SystemTensionLevel'
import type { SystemTensionLevel } from './SystemTensionLevel'

export interface RiskSnapshot {
  readonly tick: number
  /** Wall-clock time this snapshot was computed, for display/debugging only — never an input to any value computed here. */
  readonly timestamp: number
  readonly cti: number
  readonly stl: SystemTensionLevel
  readonly indicators: readonly CTIIndicatorBreakdown[]
  readonly calculationTrace: readonly string[]
}

/**
 * Builds a complete RiskSnapshot for the given SimulationState and its
 * already-built wait-for graph. Deterministic with respect to every risk
 * value it computes — only `timestamp` depends on wall-clock time, and
 * it is informational metadata, never an input back into the scoring.
 */
export function buildRiskSnapshot(
  state: SimulationState,
  graph: Graph,
  weights?: CTIWeightsConfig,
): RiskSnapshot {
  const metrics = computeGraphMetrics(graph)

  const cycleProximity = analyzeCycleProximity(graph, metrics)
  const contentionDensity = analyzeContentionDensity(
    state.requests,
    state.resources,
    state.allocations,
    state.processes,
  )
  const temporalWaiting = analyzeTemporalWaiting(
    state.requests,
    state.processes,
    state.tick,
  )

  const ctiResult = computeCTIScore(
    [
      {
        id: 'cycleProximity',
        score: cycleProximity.score,
        explanation: cycleProximity.explanation,
      },
      {
        id: 'contentionDensity',
        score: contentionDensity.score,
        explanation: contentionDensity.explanation,
      },
      {
        id: 'temporalWaiting',
        score: temporalWaiting.score,
        explanation: temporalWaiting.explanation,
      },
    ],
    weights,
  )

  const stl = computeSystemTensionLevel(ctiResult.score)

  return {
    tick: state.tick,
    timestamp: now(),
    cti: ctiResult.score,
    stl,
    indicators: ctiResult.indicators,
    calculationTrace: [...ctiResult.calculationTrace, stl.explanation],
  }
}

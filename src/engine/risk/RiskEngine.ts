/**
 * CTIScorer: combines the implemented risk indicators
 * (CycleProximityIndicator, ContentionDensityIndicator,
 * TemporalWaitingIndicator) into a single [0, 100] Cyclic Tension Index
 * score. Pure combination only — it never computes an indicator's score
 * itself (that's each indicator module's job) and never decides
 * anything; it just answers "given these indicator scores and weights,
 * what's the overall CTI?"
 *
 * The score is a weighted average of the [0, 1] indicator scores, scaled
 * onto the [0, 100] CTI range via CTI_BAND_THRESHOLDS.CRITICAL_MAX — the
 * same constant STLCalculator.ts maps bands against, not an arbitrary
 * literal:
 *
 *   CTI = (sum of score_i * weight_i) / (sum of weight_i) * CRITICAL_MAX
 *
 * Deterministic: the same indicator scores and weights always produce
 * the same CTI, with no random or time-based input anywhere in the
 * calculation.
 */
import { CTI_BAND_THRESHOLDS } from '@constants/ctiBands'
import { DEFAULT_CTI_WEIGHTS } from '@config/ctiWeights'
import type { CTIWeightsConfig } from '@shared-types/config'

/** One indicator's already-computed result, ready to be weighted and combined. */
export interface CTIIndicatorInput {
  readonly id: string
  readonly score: number
  readonly explanation: string
}

export interface CTIIndicatorBreakdown {
  readonly indicatorId: string
  readonly score: number
  readonly weight: number
  readonly weightedContribution: number
  readonly explanation: string
}

export interface CTIScoreResult {
  /** Invariant: within [0, 100], matching CTIResult.score's documented range in types/risk.ts. */
  readonly score: number
  readonly indicators: readonly CTIIndicatorBreakdown[]
  readonly calculationTrace: readonly string[]
}

/**
 * Combines indicator results into a single weighted CTI score. An
 * indicator id with no matching entry in weights contributes 0 (excluded
 * from both numerator and denominator) rather than throwing — a caller
 * supplying a partial custom weights config simply zeroes out whichever
 * indicators it omits.
 */
export function computeCTIScore(
  indicatorResults: readonly CTIIndicatorInput[],
  weights: CTIWeightsConfig = DEFAULT_CTI_WEIGHTS,
): CTIScoreResult {
  const breakdown: CTIIndicatorBreakdown[] = []
  const trace: string[] = []
  let weightedSum = 0
  let weightSum = 0

  for (const indicator of indicatorResults) {
    const weight = Object.hasOwn(weights, indicator.id)
      ? weights[indicator.id]
      : 0
    const contribution = indicator.score * weight
    weightedSum += contribution
    weightSum += weight

    breakdown.push({
      indicatorId: indicator.id,
      score: indicator.score,
      weight,
      weightedContribution: contribution,
      explanation: indicator.explanation,
    })
    trace.push(
      `${indicator.id}: score ${indicator.score.toFixed(3)} * weight ${String(weight)} = ${contribution.toFixed(3)}.`,
    )
  }

  const scaleMax = CTI_BAND_THRESHOLDS.CRITICAL_MAX
  const score = weightSum === 0 ? 0 : (weightedSum / weightSum) * scaleMax

  trace.push(
    weightSum === 0
      ? 'No weighted indicators contributed; CTI defaults to 0.'
      : `CTI = (sum of score * weight) / (sum of weight) * ${String(scaleMax)} = ${score.toFixed(2)}.`,
  )

  return { score, indicators: breakdown, calculationTrace: trace }
}

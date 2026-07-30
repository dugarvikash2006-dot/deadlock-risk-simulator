/**
 * Compares what the three policies concluded for one decision point:
 * recommendation, reasoning, and agreement, alongside the shared ground
 * truths (Wait-for Graph safety, Banker's safety, detected cycles, CTI,
 * STL) those recommendations were made against. Deliberately surfaces
 * wfgSafe and bankerSafe as two separate fields rather than one "safe"
 * flag — the whole point of this project is that Banker's Algorithm and
 * classical Wait-for Graph cycle detection can disagree on safety for
 * the exact same request (see BankersPolicy.ts / ClassicalWfgPolicy.ts),
 * and collapsing that into a single boolean would hide it.
 *
 * Inputs: a UnifiedComparison (ComparisonRunner.ts) — already-computed
 * engine outputs for one decision point.
 * Outputs: PolicyComparisonResult — a row per policy plus the shared
 * ground-truth values, with each row flagging whether it agrees with the
 * selected recommendation.
 * Why: this is what makes the "compare three algorithms" premise of the
 * project visible and inspectable, rather than only ever seeing whichever
 * one recommendation ended up selected.
 */
import type { DecisionOutcome, PolicyType } from '@shared-types/decision'
import type { CycleResult } from '@shared-types/graph'
import type { CTIBand } from '@shared-types/risk'
import type { UnifiedComparison } from './ComparisonRunner'

export interface PolicyComparisonRow {
  readonly policy: PolicyType
  readonly recommendation: DecisionOutcome
  readonly reasoning: string
  readonly agreesWithSelected: boolean
}

export interface PolicyComparisonResult {
  readonly rows: readonly PolicyComparisonRow[]
  readonly selectedPolicy: PolicyType
  readonly confidence: number
  /** Whether the shared Safety Gate (Wait-for Graph cycle-freedom) says this request is safe. */
  readonly wfgSafe: boolean
  /** Whether Banker's Algorithm found a safe sequence for this request. */
  readonly bankerSafe: boolean
  readonly detectedCycles: readonly CycleResult[]
  readonly cti: number
  readonly stlBand: CTIBand
}

/** Builds the per-policy comparison table and shared ground-truth summary for one decision point. */
export function comparePolicies(
  comparison: UnifiedComparison,
): PolicyComparisonResult {
  const { decisionResult } = comparison

  const rows: PolicyComparisonRow[] = decisionResult.supportingEvidence.map(
    (decision) => ({
      policy: decision.policy,
      recommendation: decision.outcome,
      reasoning: decision.trace.summary,
      agreesWithSelected: decision.outcome === decisionResult.selected.outcome,
    }),
  )

  return {
    rows,
    selectedPolicy: decisionResult.selected.policy,
    confidence: decisionResult.confidence,
    wfgSafe: comparison.wfgResult.length === 0,
    bankerSafe: comparison.bankerResult.safe,
    detectedCycles: comparison.wfgResult,
    cti: comparison.ctiResult.cti,
    stlBand: comparison.ctiResult.stl.band,
  }
}

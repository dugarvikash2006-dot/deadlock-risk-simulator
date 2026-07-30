/**
 * Packages a DecisionAggregationResult into an immutable, identified,
 * timestamped record suitable for storing in history and replaying
 * later — the decision-engine analogue of RiskSnapshot.ts (Step 7).
 * Orchestration only: every actual decision was already made by
 * DecisionAggregator; this just adds identity and a wall-clock
 * timestamp.
 */
import type { Decision } from '@shared-types/decision'
import { now } from '@utils/time'
import type { DecisionAggregationResult } from './DecisionAggregator'

export interface DecisionTraceRecord {
  readonly requestId: string
  readonly tick: number
  /** Wall-clock time this record was built, for display/debugging only — never an input to any decision. */
  readonly timestamp: number
  readonly selected: Decision
  readonly supportingEvidence: readonly Decision[]
  readonly confidence: number
  readonly reasoningTrace: readonly string[]
}

/** Builds a replay-suitable record from an aggregation result. Deterministic with respect to every decision value; only `timestamp` depends on wall-clock time. */
export function buildDecisionTrace(
  aggregation: DecisionAggregationResult,
  requestId: string,
  tick: number,
): DecisionTraceRecord {
  return {
    requestId,
    tick,
    timestamp: now(),
    selected: aggregation.selected,
    supportingEvidence: aggregation.supportingEvidence,
    confidence: aggregation.confidence,
    reasoningTrace: aggregation.reasoningTrace,
  }
}

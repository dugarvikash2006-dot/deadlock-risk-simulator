/**
 * ComparisonEngine: assembles the two shapes of "compare the engines'
 * outputs" this project needs — a single unified bundle of one decision
 * point's already-computed raw results (collectEngineOutputs, consumed
 * by PolicyComparison.ts/DifferenceAnalyzer.ts), and a full-scenario
 * ComparisonResult across three complete, independent policy runs
 * (buildComparisonResult, matching types/comparison.ts exactly).
 *
 * Neither function computes anything: collectEngineOutputs only imports
 * *types* from @engine/banker, @shared-types/graph, @engine/risk, and
 * @engine/decision (for parameter shapes) and never calls into any of
 * those engines — the caller is responsible for having already run
 * SafetyGate/BankerEngine/RiskSnapshot/DecisionAggregator and handing in
 * the results. buildComparisonResult only reads already-recorded
 * HistorySeries via ComparisonMetrics.ts. This keeps the Comparison
 * Engine strictly an orchestrator of existing results, never a producer
 * of new ones.
 *
 * Inputs: already-computed results from the Banker's, Wait-for Graph,
 * CTI Risk, and Decision engines (per decision point), or three
 * complete HistorySeries (per full scenario run).
 * Outputs: UnifiedComparison / ComparisonResult.
 * Why: nothing upstream packages these together — every other engine
 * only knows about its own output.
 */
import { PolicyType } from '@shared-types/decision'
import type { CycleResult } from '@shared-types/graph'
import type { HistorySeries } from '@shared-types/history'
import type {
  ComparisonResult,
  PolicyRunResult,
} from '@shared-types/comparison'
import type { SafetyCheckResult } from '@engine/banker'
import type { RiskSnapshot } from '@engine/risk'
import type { DecisionAggregationResult } from '@engine/decision'
import { computeComparisonMetrics } from './ComparisonMetrics'

/** One decision point's raw outputs from each engine, already computed by the caller. */
export interface EngineOutputs {
  readonly bankerResult: SafetyCheckResult
  readonly wfgResult: readonly CycleResult[]
  readonly ctiResult: RiskSnapshot
  readonly decisionResult: DecisionAggregationResult
}

/** A single decision point's collected engine outputs, identified by scenario and tick. */
export interface UnifiedComparison extends EngineOutputs {
  readonly scenarioId: string
  readonly tick: number
}

/** Bundles one decision point's already-computed engine outputs into a single object. Pure packaging — collects, never computes. */
export function collectEngineOutputs(
  scenarioId: string,
  tick: number,
  outputs: EngineOutputs,
): UnifiedComparison {
  return { scenarioId, tick, ...outputs }
}

const ALL_POLICY_TYPES: readonly PolicyType[] = [
  PolicyType.Bankers,
  PolicyType.ClassicalWfg,
  PolicyType.CtiGraduated,
]

/**
 * Builds the full-scenario ComparisonResult from three already-completed,
 * independent policy runs' HistorySeries. Derives each run's
 * ComparisonMetrics via ComparisonMetrics.ts — never re-simulates or
 * re-decides anything.
 */
export function buildComparisonResult(
  scenarioId: string,
  histories: Readonly<Record<PolicyType, HistorySeries>>,
): ComparisonResult {
  const runs: PolicyRunResult[] = ALL_POLICY_TYPES.map((policy) => ({
    policy,
    history: histories[policy],
    metrics: computeComparisonMetrics(histories[policy]),
  }))

  return { scenarioId, runs }
}

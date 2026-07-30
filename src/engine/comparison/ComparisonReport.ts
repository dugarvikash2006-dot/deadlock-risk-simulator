/**
 * Packages a UnifiedComparison into a UI-ready report: structured data
 * only (plain interfaces, strings, arrays) — no HTML, no JSX, no
 * rendering of any kind. Orchestrates PolicyComparison.ts and
 * DifferenceAnalyzer.ts; computes nothing of its own beyond assembling
 * their outputs into report fields (executiveSummary and keyObservations
 * are template strings over already-computed values, not new analysis).
 *
 * Inputs: a UnifiedComparison (ComparisonRunner.ts).
 * Outputs: ComparisonReport — executiveSummary, policyTable,
 * keyObservations, disagreements, selectedPolicy, reasoningTrace.
 * Why: a UI panel (or a history/replay consumer) needs one object to
 * render, not four separate engine outputs it has to cross-reference
 * itself.
 */
import type { PolicyType } from '@shared-types/decision'
import { comparePolicies } from './PolicyComparison'
import type { PolicyComparisonRow } from './PolicyComparison'
import { analyzeDifferences } from './DifferenceAnalyzer'
import type { DifferenceAnalysis } from './DifferenceAnalyzer'
import type { UnifiedComparison } from './ComparisonRunner'

export interface ComparisonReport {
  readonly executiveSummary: string
  readonly policyTable: readonly PolicyComparisonRow[]
  readonly keyObservations: readonly string[]
  readonly disagreements: DifferenceAnalysis
  readonly selectedPolicy: PolicyType
  readonly reasoningTrace: readonly string[]
}

/** Builds a complete, UI-ready comparison report for one decision point. */
export function buildComparisonReport(
  comparison: UnifiedComparison,
): ComparisonReport {
  const policyComparison = comparePolicies(comparison)
  const differences = analyzeDifferences(policyComparison)

  const keyObservations: string[] = [
    `CTI ${comparison.ctiResult.cti.toFixed(1)} (${comparison.ctiResult.stl.band} tension).`,
    policyComparison.detectedCycles.length > 0
      ? `${String(policyComparison.detectedCycles.length)} wait-for cycle(s) detected.`
      : 'No wait-for cycle is currently present.',
    policyComparison.wfgSafe === policyComparison.bankerSafe
      ? `Wait-for Graph and Banker's Algorithm agree on safety (${policyComparison.wfgSafe ? 'safe' : 'unsafe'}).`
      : `Wait-for Graph and Banker's Algorithm disagree on safety (WFG: ${policyComparison.wfgSafe ? 'safe' : 'unsafe'}, Banker's: ${policyComparison.bankerSafe ? 'safe' : 'unsafe'}).`,
    differences.summary,
  ]

  const selected = comparison.decisionResult.selected
  const executiveSummary = `${selected.policy} recommends ${selected.outcome} at ${(comparison.decisionResult.confidence * 100).toFixed(0)}% confidence (${differences.level}).`

  return {
    executiveSummary,
    policyTable: policyComparison.rows,
    keyObservations,
    disagreements: differences,
    selectedPolicy: selected.policy,
    reasoningTrace: comparison.decisionResult.reasoningTrace,
  }
}

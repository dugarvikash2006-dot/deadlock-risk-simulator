/**
 * Derived-data selectors for the UI. Each one either re-projects an
 * already-stored value (comparison results) or calls an existing
 * engine's pure function to derive a value from SimulationState
 * (buildWaitForGraph) — never reimplementing what an engine already
 * computes. Only useCurrentGraph needs to be a hook: it's the one
 * genuinely expensive derivation, memoized via useMemo so it only
 * recomputes when simulationState's identity actually changes. The rest
 * are plain functions — projecting an already-stored field needs no
 * hook machinery of its own.
 */
import { useMemo } from 'react'
import { buildWaitForGraph } from '@engine/graph'
import type { Graph } from '@shared-types/graph'
import type { SimulationState } from '@shared-types/simulation'
import type { CTIBand } from '@shared-types/risk'
import type { Decision } from '@shared-types/decision'
import type { ComparisonReport } from '@engine/comparison'
import type { ComparisonState } from './comparisonSlice'

/** The current wait-for graph, derived from SimulationState via the existing Wait-for Graph engine. Memoized on simulationState's identity. */
export function useCurrentGraph(simulationState: SimulationState): Graph {
  return useMemo(() => buildWaitForGraph(simulationState), [simulationState])
}

/** The current CTI score, read from the latest stored RiskSnapshot (ComparisonStore) — never recomputed. */
export function selectCurrentCti(
  comparisonState: ComparisonState,
): number | null {
  return comparisonState.ctiResult ? comparisonState.ctiResult.cti : null
}

/** The current System Tension Level band, read from the latest stored RiskSnapshot. */
export function selectCurrentStl(
  comparisonState: ComparisonState,
): CTIBand | null {
  return comparisonState.ctiResult ? comparisonState.ctiResult.stl.band : null
}

/** The currently selected Decision, read from the latest stored DecisionAggregationResult. */
export function selectCurrentDecision(
  comparisonState: ComparisonState,
): Decision | null {
  return comparisonState.decisionResult
    ? comparisonState.decisionResult.selected
    : null
}

/** The latest stored ComparisonReport, passed through unchanged. */
export function selectCurrentComparisonReport(
  comparisonState: ComparisonState,
): ComparisonReport | null {
  return comparisonState.comparisonReport
}

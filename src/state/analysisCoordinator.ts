/**
 * AnalysisCoordinator: runs the existing analysis pipeline (Wait-for
 * Graph, Banker's Algorithm, CTI Risk Engine, Decision Engine,
 * Comparison Engine) against one SimulationState snapshot and bundles
 * every stage's already-computed output into a single AnalysisResult.
 *
 * Pure orchestration only: every step below is one call into an
 * existing engine's exported function — no algorithm is reimplemented
 * or recomputed here, this module holds no state of its own, and
 * nothing it touches (state, or any engine's return value) is mutated.
 * Banker's/Graph/CTI run at the system level (they don't need a specific
 * request); only the Decision/Comparison stages need one, so this picks
 * the single oldest currently-outstanding request as the one to evaluate
 * — ComparisonStore holds one "latest decision," not a list per request.
 */
import { RequestStatus } from '@shared-types/domain'
import type { Process, Request } from '@shared-types/domain'
import type { SimulationState } from '@shared-types/simulation'
import type { Graph } from '@shared-types/graph'
import type { CTIResult } from '@shared-types/risk'
import { buildWaitForGraph, findCycles } from '@engine/graph'
import type { CycleResult } from '@shared-types/graph'
import { createBankerSystemState, findSafeSequence } from '@engine/banker'
import type { SafetyCheckResult } from '@engine/banker'
import { buildBankerAdapterInputs } from '@engine/decision/BankerAdapter'
import { aggregateDecisions } from '@engine/decision'
import type { DecisionAggregationResult } from '@engine/decision'
import { buildRiskSnapshot } from '@engine/risk'
import type { RiskSnapshot } from '@engine/risk'
import { collectEngineOutputs, buildComparisonReport } from '@engine/comparison'
import type { ComparisonReport } from '@engine/comparison'

export interface AnalysisResult {
  readonly tick: number
  readonly graph: Graph
  /** Null only if Banker's system state genuinely couldn't be constructed (malformed dimensions) — not expected in normal operation. */
  readonly bankerResult: SafetyCheckResult | null
  readonly wfgResult: readonly CycleResult[]
  readonly ctiResult: RiskSnapshot
  /** Null when no request is currently outstanding — nothing for the Decision Engine to evaluate this tick. */
  readonly decisionResult: DecisionAggregationResult | null
  /** Null whenever decisionResult is (or bankerResult is) — the Comparison Engine needs both to have something to compare. */
  readonly comparisonReport: ComparisonReport | null
}

/**
 * A request counts as "currently outstanding" once it has arrived (left
 * its owning process's requestSequence) and hasn't been granted. Mirrors
 * the same arrival concept WaitForGraphBuilder.ts and the risk indicators
 * use internally — duplicated here as the same small (four-line)
 * predicate, not as a re-derivation of any indicator's actual scoring.
 */
function isOutstanding(
  request: Request,
  processes: readonly Process[],
): boolean {
  if (request.status === RequestStatus.Granted) {
    return false
  }
  const process = processes.find(
    (candidate) => candidate.id === request.processId,
  )
  return process !== undefined && !process.requestSequence.includes(request.id)
}

/** The outstanding request that's been waiting longest, or undefined if none. */
function findOldestOutstandingRequest(
  state: SimulationState,
): Request | undefined {
  return state.requests
    .filter((request) => isOutstanding(request, state.processes))
    .reduce<Request | undefined>(
      (oldest, request) =>
        !oldest || request.issuedTick < oldest.issuedTick ? request : oldest,
      undefined,
    )
}

/**
 * Runs the full analysis pipeline for one SimulationState snapshot. Pure:
 * the same input always produces the same output, and nothing here
 * mutates `state` or any engine's return value.
 */
export function runAnalysis(state: SimulationState): AnalysisResult {
  const graph = buildWaitForGraph(state)
  const wfgResult = findCycles(graph)

  const bankerInputs = buildBankerAdapterInputs(
    state.processes,
    state.resources,
    state.allocations,
  )
  const created = createBankerSystemState(
    bankerInputs.processIds,
    bankerInputs.resourceIds,
    bankerInputs.maximum,
    bankerInputs.allocation,
    bankerInputs.totalResources,
  )
  const bankerResult = created.created ? findSafeSequence(created.system) : null

  const ctiResult = buildRiskSnapshot(state, graph)

  const targetRequest = findOldestOutstandingRequest(state)
  let decisionResult: DecisionAggregationResult | null = null
  let comparisonReport: ComparisonReport | null = null

  if (targetRequest && bankerResult) {
    // No genuine per-request CTIResult exists (Step 7's CTI is system-wide
    // by design) -- reshape the already-computed system-wide score/band
    // into the shape DecisionContext.cti expects. Not a new calculation,
    // just relabeling an existing value for this specific request.
    // indicators is left empty rather than mapped from RiskSnapshot's
    // CTIIndicatorBreakdown[] -- that's a structurally different shape
    // (score/weight/weightedContribution/explanation, not
    // rawValue/normalizedValue), and CtiGraduatedPolicy only ever reads
    // .score/.band, never .indicators, so an honest empty array has no
    // effect on the decision.
    const requestCti: CTIResult = {
      requestId: targetRequest.id,
      score: ctiResult.cti,
      band: ctiResult.stl.band,
      indicators: [],
      tick: state.tick,
    }
    // Hysteresis continuity across ticks isn't threaded through here:
    // CtiGraduatedPolicy's resulting HysteresisState isn't exposed by
    // DecisionAggregationResult, and reconstructing it independently
    // would duplicate logic that already lives inside that policy. Each
    // run is evaluated fresh (null previous state) rather than
    // reimplementing hysteresis tracking here.
    decisionResult = aggregateDecisions(state, targetRequest, requestCti, null)

    const unified = collectEngineOutputs(String(state.tick), state.tick, {
      bankerResult,
      wfgResult,
      ctiResult,
      decisionResult,
    })
    comparisonReport = buildComparisonReport(unified)
  }

  return {
    tick: state.tick,
    graph,
    bankerResult,
    wfgResult,
    ctiResult,
    decisionResult,
    comparisonReport,
  }
}

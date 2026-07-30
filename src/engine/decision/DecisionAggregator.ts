/**
 * Runs every registered policy against one request and combines their
 * Decisions into a single structured recommendation. Orchestration only:
 * it builds the shared DecisionContext components once (Safety Gate,
 * wait-for graph, available units — see SafetyGate.ts), computed once per
 * request per tick and reused identically by all three policies exactly
 * as DecisionContext's own documentation specifies. Never mutates
 * SimulationState — every value here is freshly constructed and returned,
 * nothing is written back.
 *
 * Aggregation strategy: conservative consensus. If any policy recommends
 * Hold, that Hold is selected — deadlock avoidance is exactly the kind of
 * decision where a false "safe" is far more costly than an unnecessary
 * wait, so disagreement is resolved toward caution, not toward a majority
 * vote. Ties among multiple Hold recommendations are broken by the
 * project's canonical policy order (Bankers, then ClassicalWfg, then
 * CtiGraduated — see DecisionPolicy.ts), Banker's Algorithm being the
 * textbook reference algorithm. If every policy agrees on Grant, the
 * Bankers recommendation is selected for the same reason. `confidence` is
 * simply the fraction of the three policies whose outcome matches the
 * one selected — a 2-1 split that got resolved to the minority Hold
 * yields a lower confidence than a unanimous verdict, which is exactly
 * the signal a "graduated, risk-informed" tool should surface.
 */
import { DecisionOutcome, PolicyType } from '@shared-types/decision'
import type {
  Decision,
  DecisionContext,
  HysteresisState,
} from '@shared-types/decision'
import type { SimulationState } from '@shared-types/simulation'
import type { Request } from '@shared-types/domain'
import type { CTIResult } from '@shared-types/risk'
import { buildWaitForGraph } from '@engine/graph'
import {
  availableUnits,
  findResource,
} from '@engine/simulation/ResourceManager'
import { computeSafetyGate } from './SafetyGate'
import { ALL_POLICIES } from './DecisionPolicy'

export interface DecisionAggregationResult {
  readonly selected: Decision
  /** All three policies' decisions, in canonical order — full transparency, not just the ones that agree. */
  readonly supportingEvidence: readonly Decision[]
  /** Fraction (0 to 1) of the three policies whose outcome matches `selected.outcome`. */
  readonly confidence: number
  readonly reasoningTrace: readonly string[]
}

/**
 * Aggregates a decision for one request. `cti`/`hysteresisState` are only
 * threaded into CtiGraduatedPolicy's context — the other two policies
 * don't use them, matching DecisionContext's documented per-field intent.
 */
export function aggregateDecisions(
  state: SimulationState,
  request: Request,
  cti: CTIResult | null,
  hysteresisState: HysteresisState | null,
): DecisionAggregationResult {
  const graph = buildWaitForGraph(state)
  const isSafeToGrant = computeSafetyGate(state, request)
  const resource = findResource(state.resources, request.resourceId)
  const unitsAvailable = resource
    ? availableUnits(resource, state.allocations)
    : 0

  const sharedContext: DecisionContext = {
    request,
    graph,
    isSafeToGrant,
    availableUnits: unitsAvailable,
    cti: null,
    hysteresisState: null,
    currentTick: state.tick,
    processes: state.processes,
    resources: state.resources,
    allocations: state.allocations,
  }

  const decisions = ALL_POLICIES.map((policy) => {
    const context: DecisionContext =
      policy.type === PolicyType.CtiGraduated
        ? { ...sharedContext, cti, hysteresisState }
        : sharedContext
    return policy.decide(context)
  })

  const holdDecisions = decisions.filter(
    (d) => d.outcome === DecisionOutcome.Hold,
  )
  const selected = holdDecisions.length > 0 ? holdDecisions[0] : decisions[0]
  const agreementCount = decisions.filter(
    (d) => d.outcome === selected.outcome,
  ).length
  const confidence = agreementCount / decisions.length

  const reasoningTrace: string[] = decisions.map(
    (d) => `${d.policy}: ${d.outcome} — ${d.trace.summary}`,
  )
  reasoningTrace.push(
    holdDecisions.length > 0
      ? `Conservative consensus: ${String(holdDecisions.length)} of ${String(decisions.length)} polic(ies) recommend Hold; selected ${selected.policy}'s Hold.`
      : `All policies agree: Grant. Selected ${selected.policy}'s recommendation.`,
  )
  reasoningTrace.push(
    `Confidence ${(confidence * 100).toFixed(0)}%: ${String(agreementCount)} of ${String(decisions.length)} polic(ies) agree with the selected outcome.`,
  )

  return { selected, supportingEvidence: decisions, confidence, reasoningTrace }
}

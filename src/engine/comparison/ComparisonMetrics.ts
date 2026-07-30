/**
 * Derives ComparisonMetrics (types/comparison.ts) from an already-completed
 * policy run's HistorySeries. Every value here is a count, sum, or
 * average taken directly over data the Simulation and Decision engines
 * already produced (SimulationState.decisions/events/allocations across
 * the run's snapshots) — nothing is re-simulated or re-decided.
 *
 * Inputs: one policy's HistorySeries (the full sequence of
 * SimulationState snapshots recorded for that run).
 * Outputs: ComparisonMetrics — averageWaitTicks, requestsGranted,
 * requestsHeld, deadlocksOccurred, resourceUtilization, decisionCount.
 * Why: PolicyRunResult.metrics needs to be computed from *somewhere*
 * before ComparisonRunner.ts can assemble a full ComparisonResult; this
 * is that single, reusable place.
 */
import { DecisionOutcome } from '@shared-types/decision'
import type { HistorySeries } from '@shared-types/history'
import type { ComparisonMetrics } from '@shared-types/comparison'
import { sum } from '@utils/array'
import { average } from '@utils/math'

const EMPTY_METRICS: ComparisonMetrics = {
  averageWaitTicks: 0,
  requestsGranted: 0,
  requestsHeld: 0,
  deadlocksOccurred: 0,
  resourceUtilization: 0,
  decisionCount: 0,
}

/** Computes a run's ComparisonMetrics from its recorded snapshot history. */
export function computeComparisonMetrics(
  history: HistorySeries,
): ComparisonMetrics {
  const snapshots = history.snapshots
  if (snapshots.length === 0) {
    return EMPTY_METRICS
  }

  const allDecisions = snapshots.flatMap((snapshot) => snapshot.decisions)
  const requestsGranted = allDecisions.filter(
    (decision) => decision.outcome === DecisionOutcome.Grant,
  ).length
  const requestsHeld = allDecisions.filter(
    (decision) => decision.outcome === DecisionOutcome.Hold,
  ).length
  const decisionCount = allDecisions.length

  const deadlocksOccurred = snapshots
    .flatMap((snapshot) => snapshot.events)
    .filter((event) => event.type === 'DeadlockDetected').length

  const grantTickByRequestId = new Map<string, number>()
  for (const decision of allDecisions) {
    if (decision.outcome === DecisionOutcome.Grant) {
      grantTickByRequestId.set(decision.requestId, decision.tick)
    }
  }
  const canonicalRequests = snapshots[snapshots.length - 1].requests
  const waitTicks: number[] = []
  for (const request of canonicalRequests) {
    const grantTick = grantTickByRequestId.get(request.id)
    if (grantTick !== undefined) {
      waitTicks.push(Math.max(0, grantTick - request.issuedTick))
    }
  }
  const averageWaitTicks = average(waitTicks)

  const utilizationPerSnapshot = snapshots.map((snapshot) => {
    const capacity = sum(
      snapshot.resources.map((resource) => resource.totalInstances),
    )
    const held = sum(
      snapshot.allocations.map((allocation) => allocation.unitsHeld),
    )
    return capacity === 0 ? 0 : held / capacity
  })
  const resourceUtilization = average(utilizationPerSnapshot)

  return {
    averageWaitTicks,
    requestsGranted,
    requestsHeld,
    deadlocksOccurred,
    resourceUtilization,
    decisionCount,
  }
}

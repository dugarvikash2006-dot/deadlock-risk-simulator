/**
 * The shared ground-truth safety oracle: computes DecisionContext.isSafeToGrant
 * once per request per tick, reused identically by all three policies —
 * "would granting this request keep the wait-for graph acyclic?" Read-only
 * with respect to everything it touches: it builds a local hypothetical
 * SimulationState to test against, never mutates the real one, and never
 * modifies the Wait-for Graph engine it calls into.
 */
import { RequestStatus } from '@shared-types/domain'
import type { Request } from '@shared-types/domain'
import type { SimulationState } from '@shared-types/simulation'
import { buildWaitForGraph, hasCycle } from '@engine/graph'
import { allocate } from '@engine/simulation/AllocationManager'

/**
 * Simulates granting `request` — reusing AllocationManager.allocate() so
 * the same physical-capacity rules apply here as everywhere else — and
 * checks whether the resulting wait-for graph would be acyclic. Returns
 * false both when the request isn't even physically grantable and when
 * granting it would close a cycle; those are deliberately not
 * distinguished here (see DecisionReason.ResourceUnavailable, which
 * policies check separately via context.availableUnits).
 */
export function computeSafetyGate(
  state: SimulationState,
  request: Request,
): boolean {
  const allocationResult = allocate(
    request.processId,
    request.resourceId,
    request.unitsRequested,
    state.resources,
    state.allocations,
  )
  if (!allocationResult.granted) {
    return false
  }

  const hypotheticalRequests = state.requests.map((candidate) =>
    candidate.id === request.id
      ? { ...candidate, status: RequestStatus.Granted }
      : candidate,
  )
  const hypotheticalState: SimulationState = {
    ...state,
    allocations: allocationResult.allocations,
    requests: hypotheticalRequests,
  }

  return !hasCycle(buildWaitForGraph(hypotheticalState))
}

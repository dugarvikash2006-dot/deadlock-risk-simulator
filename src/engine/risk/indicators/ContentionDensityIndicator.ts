/**
 * Measures overall resource contention: how much outstanding demand
 * exists relative to what's actually free, averaged across every
 * resource type (not just the contended ones) so both how SEVERE and how
 * WIDESPREAD contention is shape the result.
 *
 * What it measures: demand-vs-supply pressure per resource, independent
 * of graph topology or timing.
 * Why it matters: high, broad contention is what creates the wait
 * relationships a cycle could form from in the first place (see
 * CycleProximityIndicator.ts for that structural angle, and
 * TemporalWaitingIndicator.ts for the timing angle).
 * Inputs: the current requests, resource definitions, allocations, and
 * processes — read directly from SimulationState. Processes are needed
 * only to determine which requests have actually arrived; nothing here
 * is ever mutated.
 * Output: a [0, 1] score and a human-readable explanation.
 */
import { RequestStatus } from '@shared-types/domain'
import type {
  Allocation,
  Process,
  Request,
  Resource,
} from '@shared-types/domain'
import { average } from '@utils/math'
import { sum, unique } from '@utils/array'

export interface ContentionDensityScore {
  readonly score: number
  readonly explanation: string
}

/**
 * A request counts as "currently outstanding" once it has arrived (left
 * its owning process's requestSequence) and hasn't been granted. Mirrors
 * the arrival concept WaitForGraphBuilder.ts uses internally — a request
 * still sitting in requestSequence hasn't arrived yet and creates no
 * contention.
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

function outstandingRequestsFor(
  resourceId: string,
  requests: readonly Request[],
  processes: readonly Process[],
): readonly Request[] {
  return requests.filter(
    (request) =>
      request.resourceId === resourceId && isOutstanding(request, processes),
  )
}

function heldUnitsFor(
  resourceId: string,
  allocations: readonly Allocation[],
): number {
  return sum(
    allocations
      .filter((allocation) => allocation.resourceId === resourceId)
      .map((allocation) => allocation.unitsHeld),
  )
}

/**
 * Per resource: demand / (demand + available), 0 when nothing is waiting
 * on it. Averaged across every resource type so a system where only one
 * of ten resource types is fought over scores lower overall than one
 * where all ten are, even at identical per-resource severity.
 */
export function analyzeContentionDensity(
  requests: readonly Request[],
  resources: readonly Resource[],
  allocations: readonly Allocation[],
  processes: readonly Process[],
): ContentionDensityScore {
  if (resources.length === 0) {
    return {
      score: 0,
      explanation: 'No resource types defined; no contention.',
    }
  }

  const perResourceContention = resources.map((resource) => {
    const outstanding = outstandingRequestsFor(resource.id, requests, processes)
    const demand = sum(outstanding.map((request) => request.unitsRequested))
    if (demand === 0) {
      return 0
    }
    const held = heldUnitsFor(resource.id, allocations)
    const available = Math.max(0, resource.totalInstances - held)
    return demand / (demand + available)
  })

  const score = average(perResourceContention)

  const waitingRequests = requests.filter((request) =>
    isOutstanding(request, processes),
  )
  const competingProcessCount = unique(
    waitingRequests.map((request) => request.processId),
  ).length
  const contendedResourceCount = resources.filter(
    (resource) =>
      outstandingRequestsFor(resource.id, requests, processes).length > 0,
  ).length

  return {
    score,
    explanation: `${String(waitingRequests.length)} outstanding request(s) from ${String(competingProcessCount)} process(es), contending across ${String(contendedResourceCount)} of ${String(resources.length)} resource type(s); average demand-to-supply pressure ${score.toFixed(2)}.`,
  }
}

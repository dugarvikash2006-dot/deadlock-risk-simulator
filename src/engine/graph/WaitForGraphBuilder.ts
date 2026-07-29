/**
 * Builds the directed wait-for graph from a SimulationState: one node per
 * non-completed process, and a directed edge P1 -> P2 whenever P1 has an
 * outstanding (already-arrived, not-yet-granted) request for a resource
 * that P2 currently holds units of. Construction only — cycle detection,
 * metrics, and validation are separate, deliberately decoupled concerns
 * (see CycleDetector.ts, GraphMetrics.ts, GraphValidation.ts).
 */
import { ProcessStatus, RequestStatus } from '@shared-types/domain'
import type { Allocation, Process, Request } from '@shared-types/domain'
import { NodeType } from '@shared-types/graph'
import type { Graph, GraphEdge, GraphNode } from '@shared-types/graph'
import type { SimulationState } from '@shared-types/simulation'
import { groupBy } from '@utils/array'

/**
 * A request counts as "waiting" once it has arrived — left its owning
 * process's requestSequence — and hasn't been granted. A request still
 * sitting in requestSequence hasn't arrived yet and creates no edge.
 */
function isWaitingRequest(request: Request, process: Process): boolean {
  return (
    request.status !== RequestStatus.Granted &&
    !process.requestSequence.includes(request.id)
  )
}

/** Deterministic edge id derived from its endpoints — never randomly generated, so identical SimulationState input always produces an identical Graph. */
function edgeId(
  fromProcessId: string,
  toProcessId: string,
  viaResourceId: string,
): string {
  return `${fromProcessId}->${toProcessId}via${viaResourceId}`
}

/** Ids of processes currently holding at least one unit of a resource. */
function currentHolders(
  resourceId: string,
  allocationsByResource: Readonly<Record<string, Allocation[]>>,
): readonly string[] {
  if (!Object.hasOwn(allocationsByResource, resourceId)) {
    return []
  }
  return allocationsByResource[resourceId].map(
    (allocation) => allocation.processId,
  )
}

/**
 * Builds the wait-for graph for the current tick. Completed processes are
 * ignored entirely — they hold nothing and wait for nothing. Does not
 * exclude a process holding the very resource it's also waiting on (a
 * self-loop); that's flagged, not silently dropped, by GraphValidation.
 */
export function buildWaitForGraph(state: SimulationState): Graph {
  const liveProcesses = state.processes.filter(
    (process) => process.status !== ProcessStatus.Completed,
  )

  const nodes: GraphNode[] = liveProcesses.map((process) => ({
    id: process.id,
    type: NodeType.Process,
  }))

  const allocationsByResource = groupBy(
    state.allocations.filter((allocation) => allocation.unitsHeld > 0),
    (allocation) => allocation.resourceId,
  )

  const edges: GraphEdge[] = []
  const seenEdgeIds = new Set<string>()

  for (const process of liveProcesses) {
    const outstandingRequests = state.requests.filter(
      (request) =>
        request.processId === process.id && isWaitingRequest(request, process),
    )
    for (const request of outstandingRequests) {
      for (const holderProcessId of currentHolders(
        request.resourceId,
        allocationsByResource,
      )) {
        const id = edgeId(process.id, holderProcessId, request.resourceId)
        if (seenEdgeIds.has(id)) {
          continue
        }
        seenEdgeIds.add(id)
        edges.push({
          id,
          fromProcessId: process.id,
          toProcessId: holderProcessId,
          viaResourceId: request.resourceId,
        })
      }
    }
  }

  return { nodes, edges, tick: state.tick }
}

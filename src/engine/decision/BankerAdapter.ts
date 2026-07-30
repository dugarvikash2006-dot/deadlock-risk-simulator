/**
 * Adapts id-keyed process/resource/allocation data into the positional
 * matrices @engine/banker expects. This conversion belongs here, not in
 * banker/ itself — banker/ stays decoupled from src/types/domain.ts (see
 * NeedMatrix.ts), so translating between the two representations is the
 * Decision Engine's job. Completed processes are excluded: they hold
 * nothing and claim nothing further, the same convention
 * WaitForGraphBuilder.ts uses for graph nodes.
 *
 * Shared by BankersPolicy.ts and AnalysisCoordinator.ts (Step 12) so this
 * conversion is written once — extracted from BankersPolicy.ts, which
 * originally had this as a private helper, specifically to avoid a second
 * copy when the coordinator needed the same adapter.
 */
import { ProcessStatus } from '@shared-types/domain'
import type { Allocation, Process, Resource } from '@shared-types/domain'
import type { Matrix, Vector } from '@engine/banker'
import { sum } from '@utils/array'

export interface BankerAdapterInputs {
  readonly processIds: readonly string[]
  readonly resourceIds: readonly string[]
  readonly maximum: Matrix
  readonly allocation: Matrix
  readonly totalResources: Vector
}

/** Builds Banker's Algorithm matrix inputs from live (non-Completed) processes, resources, and their current allocations. */
export function buildBankerAdapterInputs(
  processes: readonly Process[],
  resources: readonly Resource[],
  allocations: readonly Allocation[],
): BankerAdapterInputs {
  const liveProcesses = processes.filter(
    (process) => process.status !== ProcessStatus.Completed,
  )
  const processIds = liveProcesses.map((process) => process.id)
  const resourceIds = resources.map((resource) => resource.id)

  const maximum = liveProcesses.map((process) =>
    resourceIds.map((resourceId) =>
      Object.hasOwn(process.maxClaim, resourceId)
        ? process.maxClaim[resourceId]
        : 0,
    ),
  )
  const allocation = liveProcesses.map((process) =>
    resourceIds.map((resourceId) =>
      sum(
        allocations
          .filter(
            (candidate) =>
              candidate.processId === process.id &&
              candidate.resourceId === resourceId,
          )
          .map((candidate) => candidate.unitsHeld),
      ),
    ),
  )
  const totalResources = resources.map((resource) => resource.totalInstances)

  return { processIds, resourceIds, maximum, allocation, totalResources }
}

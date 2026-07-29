/**
 * Process-completion rule: an Active process is finished once it has
 * nothing left to do — no more scheduled requests, no outstanding
 * pending/held requests, and no held allocations. Purely a bookkeeping
 * check over existing state, not a scheduling or safety decision.
 */
import { ProcessStatus, RequestStatus } from '@shared-types/domain'
import type { Allocation, Process, Request } from '@shared-types/domain'
import * as ProcessManager from './ProcessManager'

/** Whether an Active process has no remaining work. Non-Active processes are never eligible (Held must return to Active first; Completed is already terminal). */
export function isFinished(
  process: Process,
  requests: readonly Request[],
  allocations: readonly Allocation[],
): boolean {
  if (process.status !== ProcessStatus.Active) {
    return false
  }
  if (process.requestSequence.length > 0) {
    return false
  }

  const hasOutstandingRequest = requests.some(
    (request) =>
      request.processId === process.id &&
      (request.status === RequestStatus.Pending ||
        request.status === RequestStatus.Held),
  )
  if (hasOutstandingRequest) {
    return false
  }

  const holdsAllocation = allocations.some(
    (allocation) =>
      allocation.processId === process.id && allocation.unitsHeld > 0,
  )
  return !holdsAllocation
}

/** Transitions a finished process to Completed. */
export function completeProcess(process: Process): Process {
  return ProcessManager.transitionProcess(process, ProcessStatus.Completed)
}

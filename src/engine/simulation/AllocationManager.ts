/**
 * Allocation bookkeeping: grant/release units of a resource to/from a
 * process. canAllocate() is a physical-capacity check only ("is there
 * enough free right now") — it makes no judgment about whether granting
 * is safe with respect to future deadlock. That judgment belongs to the
 * decision engine's policies (Banker's / CTI), not to this module.
 */
import type { Allocation, Resource } from '@shared-types/domain'
import { availableUnits, findResource } from './ResourceManager'

export type AllocationOutcome =
  | { readonly granted: true; readonly allocations: readonly Allocation[] }
  | { readonly granted: false; readonly reason: string }

/** Whether units of resource are physically free to grant right now. */
export function canAllocate(
  resource: Resource,
  allocations: readonly Allocation[],
  units: number,
): boolean {
  return units > 0 && units <= availableUnits(resource, allocations)
}

/**
 * Grants units of a resource to a process, merging into an existing
 * allocation for that (process, resource) pair if one exists. Returns a
 * rejection reason rather than throwing when capacity isn't available —
 * that's an ordinary, expected outcome, not a caller bug.
 */
export function allocate(
  processId: string,
  resourceId: string,
  units: number,
  resources: readonly Resource[],
  allocations: readonly Allocation[],
): AllocationOutcome {
  const resource = findResource(resources, resourceId)
  if (!resource) {
    return { granted: false, reason: `Unknown resource "${resourceId}".` }
  }
  if (!canAllocate(resource, allocations, units)) {
    return {
      granted: false,
      reason: `Requested ${String(units)} unit(s) of "${resourceId}" but only ${String(availableUnits(resource, allocations))} available.`,
    }
  }

  const existingIndex = allocations.findIndex(
    (allocation) =>
      allocation.processId === processId &&
      allocation.resourceId === resourceId,
  )
  if (existingIndex === -1) {
    return {
      granted: true,
      allocations: [
        ...allocations,
        { processId, resourceId, unitsHeld: units },
      ],
    }
  }
  const updated = allocations.map((allocation, index) =>
    index === existingIndex
      ? { ...allocation, unitsHeld: allocation.unitsHeld + units }
      : allocation,
  )
  return { granted: true, allocations: updated }
}

/**
 * Releases units of a resource from a process. Throws if the process
 * doesn't currently hold that many — an invariant violation, since
 * nothing in this engine should ever attempt to release more than it
 * holds.
 */
export function release(
  processId: string,
  resourceId: string,
  units: number,
  allocations: readonly Allocation[],
): readonly Allocation[] {
  const existing = allocations.find(
    (allocation) =>
      allocation.processId === processId &&
      allocation.resourceId === resourceId,
  )
  if (!existing || existing.unitsHeld < units) {
    throw new Error(
      `Cannot release ${String(units)} unit(s) of "${resourceId}" from process "${processId}": not currently held.`,
    )
  }

  const remaining = existing.unitsHeld - units
  if (remaining === 0) {
    return allocations.filter(
      (allocation) =>
        !(
          allocation.processId === processId &&
          allocation.resourceId === resourceId
        ),
    )
  }
  return allocations.map((allocation) =>
    allocation.processId === processId && allocation.resourceId === resourceId
      ? { ...allocation, unitsHeld: remaining }
      : allocation,
  )
}

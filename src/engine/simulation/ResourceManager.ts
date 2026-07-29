/**
 * Resource creation and availability queries. Available capacity is
 * always derived from resources + allocations, never stored as its own
 * field — that way it can never drift out of sync with what's actually
 * held.
 */
import type { Allocation, Resource } from '@shared-types/domain'
import { sum } from '@utils/array'

/** Constructs a new resource type. */
export function createResource(
  id: string,
  totalInstances: number,
  label: string,
): Resource {
  return { id, totalInstances, label }
}

/** Finds a resource by id. */
export function findResource(
  resources: readonly Resource[],
  resourceId: string,
): Resource | undefined {
  return resources.find((resource) => resource.id === resourceId)
}

/** Units of a resource currently held across all processes. */
export function heldUnits(
  resourceId: string,
  allocations: readonly Allocation[],
): number {
  return sum(
    allocations
      .filter((allocation) => allocation.resourceId === resourceId)
      .map((allocation) => allocation.unitsHeld),
  )
}

/** Units of a resource not currently held by any process. */
export function availableUnits(
  resource: Resource,
  allocations: readonly Allocation[],
): number {
  return resource.totalInstances - heldUnits(resource.id, allocations)
}

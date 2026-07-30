/**
 * Available vector: units of each resource type not currently allocated
 * to any process. Available = totalResources - column sums of Allocation
 * — the third input every Banker's Algorithm safety check needs.
 */
import { sum } from '@utils/array'
import type { Matrix, Vector } from './NeedMatrix'

export type AvailableVectorResult =
  | { readonly valid: true; readonly available: Vector }
  | { readonly valid: false; readonly errors: readonly string[] }

/**
 * Computes Available = totalResources - column sums of allocation.
 * Rejects when a resource's allocated total exceeds its declared
 * capacity — an invalid system state, not something to clamp silently.
 * Never mutates either input.
 */
export function computeAvailableVector(
  totalResources: Vector,
  allocation: Matrix,
): AvailableVectorResult {
  const errors: string[] = []
  const resourceCount = totalResources.length

  allocation.forEach((row, processIndex) => {
    if (row.length !== resourceCount) {
      errors.push(
        `Allocation row ${String(processIndex)} has ${String(row.length)} column(s), expected ${String(resourceCount)}.`,
      )
    }
  })
  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const available = totalResources.map((total, resourceIndex) => {
    const allocatedTotal = sum(allocation.map((row) => row[resourceIndex]))
    const remaining = total - allocatedTotal
    if (remaining < 0) {
      errors.push(
        `Resource ${String(resourceIndex)} is over-allocated: ${String(allocatedTotal)} allocated against a capacity of ${String(total)}.`,
      )
    }
    return remaining
  })

  return errors.length === 0
    ? { valid: true, available }
    : { valid: false, errors }
}

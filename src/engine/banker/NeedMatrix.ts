/**
 * Need matrix: how many more units of each resource a process may still
 * request before reaching its declared maximum claim. Need = Maximum -
 * Allocation, computed per (process, resource) cell — one of the three
 * inputs every Banker's Algorithm safety check needs (see
 * BankerEngine.ts). Matrices are plain row-major numeric arrays, indexed
 * by process/resource position rather than by domain id, so this layer
 * stays decoupled from src/types/domain.ts — the same convention already
 * used by utils/validation.ts's matrix validators.
 */
import type { ValidationResult } from '@utils/validation'

/** Row-major matrix: matrix[processIndex][resourceIndex]. */
export type Matrix = readonly (readonly number[])[]
/** Per-resource vector: vector[resourceIndex]. */
export type Vector = readonly number[]

export type NeedMatrixResult =
  | { readonly valid: true; readonly need: Matrix }
  | { readonly valid: false; readonly errors: readonly string[] }

/** Checks that a Need matrix is rectangular, matches the declared dimensions, and every cell is a finite number >= 0. */
export function validateNeedMatrix(
  need: Matrix,
  processCount: number,
  resourceCount: number,
): ValidationResult {
  const errors: string[] = []

  if (need.length !== processCount) {
    errors.push(
      `Need matrix has ${String(need.length)} row(s), expected ${String(processCount)}.`,
    )
  }
  need.forEach((row, processIndex) => {
    if (row.length !== resourceCount) {
      errors.push(
        `Need row ${String(processIndex)} has ${String(row.length)} column(s), expected ${String(resourceCount)}.`,
      )
    }
    row.forEach((cell, resourceIndex) => {
      if (!Number.isFinite(cell) || cell < 0) {
        errors.push(
          `Need[${String(processIndex)}][${String(resourceIndex)}] must be a finite number >= 0, got ${String(cell)}.`,
        )
      }
    })
  })

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

/**
 * Computes Need = Maximum - Allocation, cell by cell. Rejects (rather
 * than throwing) when the two matrices' dimensions disagree, or when a
 * cell would go negative — a process allocated more than its declared
 * maximum is an invalid system state, not something to clamp silently.
 * Never mutates either input.
 */
export function computeNeedMatrix(
  maximum: Matrix,
  allocation: Matrix,
): NeedMatrixResult {
  const errors: string[] = []

  if (maximum.length !== allocation.length) {
    errors.push(
      `Maximum has ${String(maximum.length)} row(s) but Allocation has ${String(allocation.length)}.`,
    )
    return { valid: false, errors }
  }

  const need: number[][] = []
  maximum.forEach((maxRow, processIndex) => {
    const allocRow = allocation[processIndex]
    if (maxRow.length !== allocRow.length) {
      errors.push(
        `Row ${String(processIndex)}: Maximum has ${String(maxRow.length)} column(s) but Allocation has ${String(allocRow.length)}.`,
      )
      return
    }
    const needRow = maxRow.map((maxValue, resourceIndex) => {
      const allocValue = allocRow[resourceIndex]
      const needValue = maxValue - allocValue
      if (needValue < 0) {
        errors.push(
          `Process ${String(processIndex)} holds more of resource ${String(resourceIndex)} (${String(allocValue)}) than its maximum claim (${String(maxValue)}).`,
        )
      }
      return needValue
    })
    need.push(needRow)
  })

  return errors.length === 0 ? { valid: true, need } : { valid: false, errors }
}

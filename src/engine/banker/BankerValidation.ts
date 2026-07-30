/**
 * Structural validation for classical Banker's Algorithm inputs: negative
 * values, inconsistent dimensions, allocation exceeding a process's
 * declared maximum, allocation exceeding total resource capacity, and
 * malformed resource vectors. Reports everything found rather than
 * throwing — a caller building a system state needs the full list, not
 * just the first problem.
 */
import type { ValidationResult } from '@utils/validation'
import { sum } from '@utils/array'
import type { Matrix, Vector } from './NeedMatrix'

function validateVector(vector: Vector, label: string): string[] {
  const errors: string[] = []
  vector.forEach((value, index) => {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(
        `${label}[${String(index)}] must be a finite number >= 0, got ${String(value)}.`,
      )
    }
  })
  return errors
}

function validateMatrixShape(
  matrix: Matrix,
  rowCount: number,
  columnCount: number,
  label: string,
): string[] {
  const errors: string[] = []
  if (matrix.length !== rowCount) {
    errors.push(
      `${label} has ${String(matrix.length)} row(s), expected ${String(rowCount)}.`,
    )
  }
  matrix.forEach((row, rowIndex) => {
    if (row.length !== columnCount) {
      errors.push(
        `${label} row ${String(rowIndex)} has ${String(row.length)} column(s), expected ${String(columnCount)}.`,
      )
    }
    errors.push(...validateVector(row, `${label}[${String(rowIndex)}]`))
  })
  return errors
}

/**
 * Full structural validation of a Banker's Algorithm input set:
 * dimension consistency across processIds/resourceIds/maximum/
 * allocation/totalResources, negative values, allocation exceeding a
 * process's maximum claim, and allocation exceeding total resource
 * capacity. Says nothing about safety — that's BankerEngine's concern.
 */
export function validateBankerInputs(
  processIds: readonly string[],
  resourceIds: readonly string[],
  maximum: Matrix,
  allocation: Matrix,
  totalResources: Vector,
): ValidationResult {
  const errors: string[] = []
  const processCount = processIds.length
  const resourceCount = resourceIds.length

  errors.push(...validateVector(totalResources, 'totalResources'))
  errors.push(
    ...validateMatrixShape(maximum, processCount, resourceCount, 'Maximum'),
  )
  errors.push(
    ...validateMatrixShape(
      allocation,
      processCount,
      resourceCount,
      'Allocation',
    ),
  )

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  maximum.forEach((maxRow, processIndex) => {
    const allocRow = allocation[processIndex]
    maxRow.forEach((maxValue, resourceIndex) => {
      const allocValue = allocRow[resourceIndex]
      if (allocValue > maxValue) {
        errors.push(
          `Process "${processIds[processIndex]}" allocation of resource "${resourceIds[resourceIndex]}" (${String(allocValue)}) exceeds its maximum claim (${String(maxValue)}).`,
        )
      }
    })
  })

  totalResources.forEach((total, resourceIndex) => {
    const allocatedTotal = sum(allocation.map((row) => row[resourceIndex]))
    if (allocatedTotal > total) {
      errors.push(
        `Resource "${resourceIds[resourceIndex]}" is over-allocated: ${String(allocatedTotal)} allocated against a capacity of ${String(total)}.`,
      )
    }
  })

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

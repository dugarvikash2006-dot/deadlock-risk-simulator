/**
 * Structural/bounds validation for scenario data. Returns a description of
 * every problem found rather than throwing — callers (scenario authoring,
 * UI forms) need to report all issues at once, not stop at the first one.
 * Deliberately stops at structural well-formedness: whether a request can
 * safely be granted is a runtime, policy-dependent question that belongs
 * to the engine's Safety Gate / decision policies, not here.
 */
import { SIMULATION_LIMITS } from '@constants/simulationLimits'

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly string[] }

function ok(): ValidationResult {
  return { valid: true }
}

function fail(errors: readonly string[]): ValidationResult {
  return { valid: false, errors }
}

/** Validates a process count sits within SIMULATION_LIMITS.MAX_PROCESSES. */
export function validateProcessCount(count: number): ValidationResult {
  const errors: string[] = []
  if (!Number.isInteger(count) || count < 1) {
    errors.push('Process count must be a positive integer.')
  } else if (count > SIMULATION_LIMITS.MAX_PROCESSES) {
    errors.push(
      `Process count ${String(count)} exceeds the maximum of ${String(SIMULATION_LIMITS.MAX_PROCESSES)}.`,
    )
  }
  return errors.length === 0 ? ok() : fail(errors)
}

/** Validates a resource-type count sits within SIMULATION_LIMITS.MAX_RESOURCE_TYPES. */
export function validateResourceCount(count: number): ValidationResult {
  const errors: string[] = []
  if (!Number.isInteger(count) || count < 1) {
    errors.push('Resource type count must be a positive integer.')
  } else if (count > SIMULATION_LIMITS.MAX_RESOURCE_TYPES) {
    errors.push(
      `Resource type count ${String(count)} exceeds the maximum of ${String(SIMULATION_LIMITS.MAX_RESOURCE_TYPES)}.`,
    )
  }
  return errors.length === 0 ? ok() : fail(errors)
}

/** Checks that every row of matrix has columnCount cells, each a finite number >= 0. */
function validateMatrixShape(
  matrix: readonly (readonly number[])[],
  columnCount: number,
  label: string,
): string[] {
  const errors: string[] = []
  matrix.forEach((row, rowIndex) => {
    if (row.length !== columnCount) {
      errors.push(
        `${label} row ${String(rowIndex)} has ${String(row.length)} column(s), expected ${String(columnCount)}.`,
      )
    }
    row.forEach((cell, columnIndex) => {
      if (!Number.isFinite(cell) || cell < 0) {
        errors.push(
          `${label} cell [${String(rowIndex)}][${String(columnIndex)}] must be a finite number >= 0, got ${String(cell)}.`,
        )
      }
    })
  })
  return errors
}

/**
 * Validates an allocation matrix (rows = processes, columns = resources;
 * cell = units of that resource held by that process): rectangular, every
 * cell a finite number >= 0, and each column's sum within the
 * corresponding resource's total instances.
 */
export function validateAllocationMatrix(
  matrix: readonly (readonly number[])[],
  resourceTotals: readonly number[],
): ValidationResult {
  const errors = validateMatrixShape(
    matrix,
    resourceTotals.length,
    'Allocation',
  )

  resourceTotals.forEach((total, columnIndex) => {
    const columnSum = matrix.reduce((rowTotal, row) => {
      const cell = columnIndex < row.length ? row[columnIndex] : 0
      return rowTotal + cell
    }, 0)
    if (columnSum > total) {
      errors.push(
        `Allocation column ${String(columnIndex)} sums to ${String(columnSum)}, exceeding the resource's ${String(total)} total instances.`,
      )
    }
  })

  return errors.length === 0 ? ok() : fail(errors)
}

/**
 * Validates a request matrix (rows = processes, columns = resources; cell
 * = units of that resource currently requested by that process):
 * rectangular and every cell a finite number >= 0. Column sums are not
 * bounded against resource capacity — a pending request legitimately may
 * exceed availability; that is a decision for the engine, not a structural
 * validity concern.
 */
export function validateRequestMatrix(
  matrix: readonly (readonly number[])[],
  resourceCount: number,
): ValidationResult {
  const errors = validateMatrixShape(matrix, resourceCount, 'Request')
  return errors.length === 0 ? ok() : fail(errors)
}

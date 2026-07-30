/**
 * The classical Banker's Algorithm safety check, plus hypothetical
 * request/release simulation built on top of it. Pure analysis: this
 * module never touches SimulationState, never grants or denies anything
 * for real, and has no scheduling opinion — it only answers "is this
 * system state safe?" and "would it stay safe if X happened?". Wiring
 * its verdicts into an actual grant/hold decision is the Decision
 * Engine's job, a separate, later step.
 */
import { computeAvailableVector } from './AvailableVector'
import { computeNeedMatrix } from './NeedMatrix'
import type { Matrix, Vector } from './NeedMatrix'

/** The complete state a Banker's Algorithm safety check runs against. */
export interface BankerSystemState {
  readonly processIds: readonly string[]
  readonly resourceIds: readonly string[]
  readonly maximum: Matrix
  readonly allocation: Matrix
  readonly need: Matrix
  readonly available: Vector
}

export interface SafetyCheckResult {
  readonly safe: boolean
  /** Process ids in the order they can safely finish; empty when unsafe. */
  readonly safeSequence: readonly string[]
  /** Work vector after each step; index 0 is the initial Available. */
  readonly workHistory: readonly Vector[]
  /** Finish vector after each step; index 0 is all-false. */
  readonly finishHistory: readonly (readonly boolean[])[]
  /** Human-readable log of each step's reasoning. */
  readonly reasoningTrace: readonly string[]
}

export type CreateSystemStateResult =
  | { readonly created: true; readonly system: BankerSystemState }
  | { readonly created: false; readonly errors: readonly string[] }

/** Assembles a BankerSystemState from raw inputs, deriving Need and Available via NeedMatrix.ts / AvailableVector.ts. */
export function createBankerSystemState(
  processIds: readonly string[],
  resourceIds: readonly string[],
  maximum: Matrix,
  allocation: Matrix,
  totalResources: Vector,
): CreateSystemStateResult {
  const needResult = computeNeedMatrix(maximum, allocation)
  if (!needResult.valid) {
    return { created: false, errors: needResult.errors }
  }
  const availableResult = computeAvailableVector(totalResources, allocation)
  if (!availableResult.valid) {
    return { created: false, errors: availableResult.errors }
  }
  return {
    created: true,
    system: {
      processIds,
      resourceIds,
      maximum,
      allocation,
      need: needResult.need,
      available: availableResult.available,
    },
  }
}

function addVectors(a: Vector, b: Vector): number[] {
  return a.map((value, index) => value + b[index])
}

function fitsWithin(need: Vector, work: Vector): boolean {
  return need.every((value, index) => value <= work[index])
}

/**
 * The classical Banker's safety algorithm. Repeatedly scans for any
 * unfinished process whose Need fits within the current Work, "runs" it
 * (folding its Allocation back into Work), and marks it Finished — then
 * repeats from the start of the scan. If every process finishes, the
 * state is safe and the finish order is a safe sequence; if a full scan
 * finds no eligible process, the remaining unfinished processes can never
 * proceed and the state is unsafe.
 *
 * Deterministic by construction: eligible processes are always scanned in
 * a fixed, ascending index order, so a given BankerSystemState always
 * yields the same safe/unsafe verdict and the same safe sequence — the
 * algorithm's order-independence for the safe/unsafe verdict is a
 * standard property of Banker's Algorithm; fixing the scan order just
 * makes the specific sequence reproducible too. Never mutates the input.
 */
export function findSafeSequence(system: BankerSystemState): SafetyCheckResult {
  const { processIds, need, allocation, available } = system
  const processCount = processIds.length

  let work: Vector = [...available]
  const finish: boolean[] = processIds.map(() => false)
  const safeSequence: string[] = []
  const workHistory: Vector[] = [work]
  const finishHistory: (readonly boolean[])[] = [[...finish]]
  const reasoningTrace: string[] = [`Initial Work = [${work.join(', ')}].`]

  let progressed = true
  while (progressed && safeSequence.length < processCount) {
    progressed = false
    for (let i = 0; i < processCount; i += 1) {
      if (finish[i]) {
        continue
      }
      if (fitsWithin(need[i], work)) {
        const workBefore = work
        work = addVectors(work, allocation[i])
        finish[i] = true
        safeSequence.push(processIds[i])
        workHistory.push(work)
        finishHistory.push([...finish])
        reasoningTrace.push(
          `Process "${processIds[i]}" can proceed (Need [${need[i].join(', ')}] <= Work [${workBefore.join(', ')}]); Work becomes [${work.join(', ')}].`,
        )
        progressed = true
        break
      }
    }
  }

  const safe = safeSequence.length === processCount
  if (safe) {
    reasoningTrace.push('All processes can finish. State is safe.')
  } else {
    const stuck = processIds.filter((_, index) => !finish[index])
    reasoningTrace.push(
      `No remaining process's Need fits within Work [${work.join(', ')}]; unfinished: ${stuck.join(', ')}. State is unsafe.`,
    )
  }

  return { safe, safeSequence, workHistory, finishHistory, reasoningTrace }
}

/** Whether the system state is safe (some safe sequence exists). */
export function isSafeState(system: BankerSystemState): boolean {
  return findSafeSequence(system).safe
}

export type BankerSimulationResult =
  | {
      readonly applied: true
      readonly safety: SafetyCheckResult
      readonly resultingState: BankerSystemState
    }
  | { readonly applied: false; readonly errors: readonly string[] }

/**
 * Answers exactly one question: "if this request were granted right now,
 * would the resulting state remain safe?" Applies the classical
 * request-time preconditions (Request <= Need, Request <= Available)
 * before building the hypothetical resulting state and running the
 * safety algorithm on it. Never mutates the input system, never touches
 * SimulationState, and never grants anything for real — that decision
 * belongs to the Decision Engine.
 */
export function simulateAllocation(
  system: BankerSystemState,
  processId: string,
  request: Vector,
): BankerSimulationResult {
  const processIndex = system.processIds.indexOf(processId)
  if (processIndex === -1) {
    return { applied: false, errors: [`Unknown process id "${processId}".`] }
  }

  const resourceCount = system.resourceIds.length
  if (request.length !== resourceCount) {
    return {
      applied: false,
      errors: [
        `Request has ${String(request.length)} value(s), expected ${String(resourceCount)}.`,
      ],
    }
  }

  const need = system.need[processIndex]
  const errors: string[] = []
  request.forEach((value, resourceIndex) => {
    if (value < 0) {
      errors.push(`Request for resource ${String(resourceIndex)} is negative.`)
    }
    if (value > need[resourceIndex]) {
      errors.push(
        `Request exceeds process "${processId}"'s remaining need for resource ${String(resourceIndex)} (requested ${String(value)}, need ${String(need[resourceIndex])}).`,
      )
    }
    if (value > system.available[resourceIndex]) {
      errors.push(
        `Request exceeds availability for resource ${String(resourceIndex)} (requested ${String(value)}, available ${String(system.available[resourceIndex])}).`,
      )
    }
  })
  if (errors.length > 0) {
    return { applied: false, errors }
  }

  const resultingState: BankerSystemState = {
    ...system,
    allocation: system.allocation.map((row, index) =>
      index === processIndex ? addVectors(row, request) : row,
    ),
    need: system.need.map((row, index) =>
      index === processIndex
        ? row.map((value, ri) => value - request[ri])
        : row,
    ),
    available: system.available.map((value, ri) => value - request[ri]),
  }

  return {
    applied: true,
    safety: findSafeSequence(resultingState),
    resultingState,
  }
}

/**
 * Hypothetically releases units of resources a process currently holds
 * and reports whether the resulting state is safe. Releasing can only
 * grow Available (and that process's Need), so it can never turn a safe
 * state unsafe — but the full safety algorithm still runs, so callers get
 * the same structured result shape as simulateAllocation(). Never
 * mutates the input system or touches SimulationState.
 */
export function simulateRelease(
  system: BankerSystemState,
  processId: string,
  release: Vector,
): BankerSimulationResult {
  const processIndex = system.processIds.indexOf(processId)
  if (processIndex === -1) {
    return { applied: false, errors: [`Unknown process id "${processId}".`] }
  }

  const resourceCount = system.resourceIds.length
  if (release.length !== resourceCount) {
    return {
      applied: false,
      errors: [
        `Release has ${String(release.length)} value(s), expected ${String(resourceCount)}.`,
      ],
    }
  }

  const currentAllocation = system.allocation[processIndex]
  const errors: string[] = []
  release.forEach((value, resourceIndex) => {
    if (value < 0) {
      errors.push(`Release for resource ${String(resourceIndex)} is negative.`)
    }
    if (value > currentAllocation[resourceIndex]) {
      errors.push(
        `Release exceeds process "${processId}"'s current allocation for resource ${String(resourceIndex)} (releasing ${String(value)}, holds ${String(currentAllocation[resourceIndex])}).`,
      )
    }
  })
  if (errors.length > 0) {
    return { applied: false, errors }
  }

  const resultingState: BankerSystemState = {
    ...system,
    allocation: system.allocation.map((row, index) =>
      index === processIndex
        ? row.map((value, ri) => value - release[ri])
        : row,
    ),
    need: system.need.map((row, index) =>
      index === processIndex ? addVectors(row, release) : row,
    ),
    available: system.available.map((value, ri) => value + release[ri]),
  }

  return {
    applied: true,
    safety: findSafeSequence(resultingState),
    resultingState,
  }
}

/**
 * Process lifecycle primitives: creation, legal state-transition rules,
 * and request-sequence advancement. Pure — no allocation or decision
 * logic lives here, only the mechanics of moving a Process between its
 * three ProcessStatus values and shrinking its requestSequence over time.
 */
import { ProcessStatus } from '@shared-types/domain'
import type { Process, Request, ResourceVector } from '@shared-types/domain'

/**
 * Legal ProcessStatus transitions. Held <-> Active models a process being
 * blocked on / unblocked from a request; Completed is terminal. There is
 * no Ready/Running split in the shared domain model — Active covers both,
 * since ProcessStatus (types/domain.ts) is frozen for this step.
 */
const LEGAL_TRANSITIONS: Readonly<
  Record<ProcessStatus, readonly ProcessStatus[]>
> = {
  [ProcessStatus.Active]: [ProcessStatus.Held, ProcessStatus.Completed],
  [ProcessStatus.Held]: [ProcessStatus.Active],
  [ProcessStatus.Completed]: [],
}

/** Whether a ProcessStatus transition is legal. */
export function canTransition(from: ProcessStatus, to: ProcessStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to)
}

/**
 * Applies a status transition, returning a new Process. Throws on an
 * illegal transition — that represents a caller bug (e.g. transitioning a
 * Completed process), not an expected runtime condition.
 */
export function transitionProcess(
  process: Process,
  to: ProcessStatus,
): Process {
  if (!canTransition(process.status, to)) {
    throw new Error(
      `Illegal process transition: ${process.status} -> ${to} (process "${process.id}").`,
    )
  }
  return { ...process, status: to }
}

export interface CreateProcessParams {
  readonly id: string
  readonly arrivalTick: number
  readonly maxClaim: ResourceVector
  readonly requestSequence: readonly string[]
}

/** Constructs a new process. Always starts Active — a process only becomes Held once one of its requests is put on hold. */
export function createProcess(params: CreateProcessParams): Process {
  return {
    id: params.id,
    arrivalTick: params.arrivalTick,
    maxClaim: params.maxClaim,
    requestSequence: params.requestSequence,
    status: ProcessStatus.Active,
  }
}

export interface RequestSequenceAdvance {
  readonly process: Process
  /** Ids of requests that reached their issuedTick this call, in order. */
  readonly arrivedRequestIds: readonly string[]
}

/**
 * Pops requests off the front of an Active process's requestSequence as
 * their issuedTick is reached, in order. Does not evaluate or grant
 * anything — it only marks a request as now in play, for the tick loop to
 * report as an arrival event.
 */
export function advanceRequestSequence(
  process: Process,
  requests: readonly Request[],
  currentTick: number,
): RequestSequenceAdvance {
  if (process.status !== ProcessStatus.Active) {
    return { process, arrivedRequestIds: [] }
  }

  const arrivedRequestIds: string[] = []
  let remaining = process.requestSequence
  while (remaining.length > 0) {
    const nextId = remaining[0]
    const request = requests.find((candidate) => candidate.id === nextId)
    if (!request || request.issuedTick > currentTick) {
      break
    }
    arrivedRequestIds.push(nextId)
    remaining = remaining.slice(1)
  }

  if (arrivedRequestIds.length === 0) {
    return { process, arrivedRequestIds: [] }
  }
  return {
    process: { ...process, requestSequence: remaining },
    arrivedRequestIds,
  }
}

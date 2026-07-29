/**
 * Core domain models: processes, resources, allocations, and requests.
 * This file has no dependencies on any other type module — it is the
 * foundation every other type file builds on.
 */

/** Maps a resource id to a unit count. Values must be >= 0. */
export type ResourceVector = Readonly<Record<string, number>>

export const ProcessStatus = {
  Active: 'Active',
  Held: 'Held',
  Completed: 'Completed',
} as const
export type ProcessStatus = (typeof ProcessStatus)[keyof typeof ProcessStatus]

export interface Process {
  readonly id: string
  readonly arrivalTick: number
  /** Per-resource maximum demand vector (Banker's Algorithm precondition). */
  readonly maxClaim: ResourceVector
  /** Ordered ids of requests this process has not yet issued. Shrinks over time. */
  readonly requestSequence: readonly string[]
  readonly status: ProcessStatus
}

export interface Resource {
  readonly id: string
  /** Total instances of this resource type. Must be > 0. */
  readonly totalInstances: number
  readonly label: string
}

export interface Allocation {
  readonly processId: string
  readonly resourceId: string
  /**
   * Invariant: for a given resourceId, the sum of unitsHeld across all
   * allocations must never exceed that resource's totalInstances.
   */
  readonly unitsHeld: number
}

export const RequestStatus = {
  /** Arrived this tick, awaiting a decision. */
  Pending: 'Pending',
  /** Terminal — resources were allocated. */
  Granted: 'Granted',
  /** Evaluated and queued for re-evaluation on a later tick. */
  Held: 'Held',
} as const
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export interface Request {
  readonly id: string
  readonly processId: string
  readonly resourceId: string
  /**
   * Invariant: must never exceed the owning process's remaining max claim
   * for this resource, minus units it already holds.
   */
  readonly unitsRequested: number
  /** Tick this request entered the pending queue. */
  readonly issuedTick: number
  readonly status: RequestStatus
  /** Null until the Decision Engine evaluates this request for the first time. */
  readonly lastEvaluatedTick: number | null
}

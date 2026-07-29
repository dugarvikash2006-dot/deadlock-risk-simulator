/**
 * Simulation core models. Depends on domain.ts, graph.ts, and decision.ts —
 * one direction down the dependency order.
 */
import type { Process, Resource, Allocation, Request } from './domain'
import type { Graph } from './graph'
import type { Decision, PolicyType } from './decision'

export const SimulationStatus = {
  Idle: 'Idle',
  Running: 'Running',
  Paused: 'Paused',
  Completed: 'Completed',
} as const
export type SimulationStatus =
  (typeof SimulationStatus)[keyof typeof SimulationStatus]

/**
 * What happened during a tick, independent of any specific request's
 * decision (arrivals, process completion, ground-truth deadlock). Request
 * grant/hold outcomes live on Decision, not here — they carry richer,
 * policy-specific reasoning that this lightweight union isn't meant to hold.
 */
export type SimulationEvent =
  | {
      readonly type: 'RequestArrived'
      readonly requestId: string
      readonly tick: number
    }
  | {
      readonly type: 'ProcessCompleted'
      readonly processId: string
      readonly tick: number
    }
  | {
      readonly type: 'DeadlockDetected'
      readonly involvedProcessIds: readonly string[]
      readonly tick: number
    }

/**
 * A lightweight per-tick descriptor (index + what happened), distinct from
 * SimulationState's full snapshot. Used where only the event summary is
 * needed — e.g. a compact event feed — without paying for the full state
 * payload.
 */
export interface SimulationTick {
  readonly index: number
  readonly events: readonly SimulationEvent[]
}

/**
 * The full immutable state of the simulation at a single tick. Every tick
 * produces a new SimulationState rather than mutating the previous one —
 * this is what makes deterministic replay (NFR-2) possible.
 */
export interface SimulationState {
  readonly tick: number
  readonly status: SimulationStatus
  readonly processes: readonly Process[]
  readonly resources: readonly Resource[]
  readonly allocations: readonly Allocation[]
  /** Canonical record of every request in the scenario; current queue state is a filtered view of this, not separately stored. */
  readonly requests: readonly Request[]
  readonly graph: Graph
  /** Decisions made during this tick only, not cumulative. */
  readonly decisions: readonly Decision[]
  /** Non-decision events that occurred during this tick only. */
  readonly events: readonly SimulationEvent[]
}

export interface SimulationConfig {
  readonly seed: string
  readonly maxTicks: number
  readonly tickIntervalMs: number
  readonly policy: PolicyType
}

export interface ScenarioConfig {
  readonly maxProcesses: number
  readonly maxResourceTypes: number
  readonly seed: string
}

/**
 * The declarative, deterministic definition of a scenario — used
 * identically for hand-authored and randomly generated scenarios.
 */
export interface Scenario {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly config: ScenarioConfig
  readonly processes: readonly Process[]
  readonly resources: readonly Resource[]
  readonly requests: readonly Request[]
}

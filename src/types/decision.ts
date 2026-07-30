/**
 * Decision Engine models. Depends on domain.ts, graph.ts, and risk.ts —
 * one direction down the dependency order, never the reverse.
 */
import type { Allocation, Process, Request, Resource } from './domain'
import type { Graph } from './graph'
import type { CTIResult } from './risk'

/**
 * Terminal decision outcomes. Only two — per the approved Phase 2
 * modification, an OS-modeled resource manager never "rejects" a
 * request; it grants it or makes the process wait (Hold).
 */
export const DecisionOutcome = {
  Grant: 'Grant',
  Hold: 'Hold',
} as const
export type DecisionOutcome =
  (typeof DecisionOutcome)[keyof typeof DecisionOutcome]

/** The three compared strategies, implemented as interchangeable policies. */
export const PolicyType = {
  Bankers: 'Bankers',
  ClassicalWfg: 'ClassicalWfg',
  CtiGraduated: 'CtiGraduated',
} as const
export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType]

export const DecisionReason = {
  SafetyGateUnsafe: 'SafetyGateUnsafe',
  /** Classical WFG baseline grants: the shared Safety Gate found no resulting cycle. Added alongside SafetyGateUnsafe, which already covers that policy's Hold case. */
  WfgSafeState: 'WfgSafeState',
  BankersSafeState: 'BankersSafeState',
  BankersUnsafeState: 'BankersUnsafeState',
  ResourceUnavailable: 'ResourceUnavailable',
  CtiBandGrant: 'CtiBandGrant',
  CtiBandHold: 'CtiBandHold',
  InsufficientHeadroom: 'InsufficientHeadroom',
} as const
export type DecisionReason =
  (typeof DecisionReason)[keyof typeof DecisionReason]

/**
 * The reasoning trace behind a single decision. Modeled as a discriminated
 * union rather than one flat shape with nullable fields: CTI-related data
 * only exists on the branch where it's actually meaningful, so a Banker's
 * or Classical WFG decision can never be constructed with a dangling
 * `cti: null` — an invalid state that a flatter shape would allow.
 */
export type DecisionTrace =
  | {
      readonly reason:
        | typeof DecisionReason.SafetyGateUnsafe
        | typeof DecisionReason.WfgSafeState
        | typeof DecisionReason.BankersSafeState
        | typeof DecisionReason.BankersUnsafeState
        | typeof DecisionReason.ResourceUnavailable
      readonly summary: string
    }
  | {
      readonly reason:
        | typeof DecisionReason.CtiBandGrant
        | typeof DecisionReason.CtiBandHold
        | typeof DecisionReason.InsufficientHeadroom
      readonly summary: string
      readonly cti: CTIResult
      readonly hysteresisSuppressed: boolean
    }

export interface Decision {
  readonly requestId: string
  readonly outcome: DecisionOutcome
  readonly policy: PolicyType
  readonly trace: DecisionTrace
  readonly tick: number
}

/**
 * The bundle a DecisionPolicy resolves against. isSafeToGrant is the
 * Safety Gate's precomputed ground-truth result — shared by all three
 * policies, computed once per request per tick, not re-derived per policy.
 */
export interface DecisionContext {
  readonly request: Request
  readonly graph: Graph
  readonly isSafeToGrant: boolean
  readonly availableUnits: number
  /** Present only when the active policy is CtiGraduated. */
  readonly cti: CTIResult | null
  readonly hysteresisState: HysteresisState | null
  readonly currentTick: number
  /**
   * Full process/resource/allocation state, needed by BankersPolicy to run
   * genuine per-process Need/Max Banker's-algorithm math (Need = Maximum -
   * Allocation across every process and resource, not just the single
   * resource `request` targets) — data isSafeToGrant's WFG-only ground
   * truth doesn't carry. Kept as three flat domain-typed fields rather than
   * an embedded SimulationState: simulation.ts already depends on this
   * file for Decision/PolicyType, so embedding SimulationState here would
   * create a circular type dependency; a flat field also avoids a second,
   * potentially-divergent copy of data already represented by `request`
   * and `graph` above.
   */
  readonly processes: readonly Process[]
  readonly resources: readonly Resource[]
  readonly allocations: readonly Allocation[]
}

/**
 * The common Strategy interface all three policies implement (Phase 2
 * headline decision — guarantees a fair, apples-to-apples comparison
 * since they share one simulation core). Method signature only.
 */
export interface DecisionPolicy {
  readonly type: PolicyType
  decide(context: DecisionContext): Decision
}

export interface HysteresisState {
  readonly requestId: string
  readonly lastOutcome: DecisionOutcome
  readonly lastChangedTick: number
  /** Invariant: must be >= 0. Counts down to 0 before a flip is permitted. */
  readonly dwellTicksRemaining: number
}

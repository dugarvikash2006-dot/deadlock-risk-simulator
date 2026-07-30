/**
 * BankersPolicy: runs the classical Banker's Algorithm (via @engine/banker)
 * against the full process/resource/allocation picture in context, and
 * recommends Grant only when doing so leaves the system in a safe state
 * (some safe sequence exists). Interprets Banker's results only — it
 * never allocates or releases anything itself; @engine/banker's
 * simulateAllocation() already guarantees that by construction (Step 6).
 */
import {
  DecisionOutcome,
  DecisionReason,
  PolicyType,
} from '@shared-types/decision'
import type {
  Decision,
  DecisionContext,
  DecisionPolicy,
} from '@shared-types/decision'
import { createBankerSystemState, simulateAllocation } from '@engine/banker'
import { buildBankerAdapterInputs } from '../BankerAdapter'

function decision(
  context: DecisionContext,
  outcome: DecisionOutcome,
  reason:
    | typeof DecisionReason.SafetyGateUnsafe
    | typeof DecisionReason.BankersSafeState
    | typeof DecisionReason.BankersUnsafeState
    | typeof DecisionReason.ResourceUnavailable,
  summary: string,
): Decision {
  return {
    requestId: context.request.id,
    outcome,
    policy: PolicyType.Bankers,
    trace: { reason, summary },
    tick: context.currentTick,
  }
}

export const BankersPolicy: DecisionPolicy = {
  type: PolicyType.Bankers,

  decide(context: DecisionContext): Decision {
    if (!context.isSafeToGrant) {
      return decision(
        context,
        DecisionOutcome.Hold,
        DecisionReason.SafetyGateUnsafe,
        "Granting would immediately create a wait-for cycle; held before Banker's Algorithm is even consulted.",
      )
    }

    const { processIds, resourceIds, maximum, allocation, totalResources } =
      buildBankerAdapterInputs(
        context.processes,
        context.resources,
        context.allocations,
      )
    const created = createBankerSystemState(
      processIds,
      resourceIds,
      maximum,
      allocation,
      totalResources,
    )
    if (!created.created) {
      return decision(
        context,
        DecisionOutcome.Hold,
        DecisionReason.ResourceUnavailable,
        `Banker's system state could not be constructed: ${created.errors.join(' ')}`,
      )
    }

    const resourceIndex = resourceIds.indexOf(context.request.resourceId)
    const requestVector = resourceIds.map((_, index) =>
      index === resourceIndex ? context.request.unitsRequested : 0,
    )

    const simulation = simulateAllocation(
      created.system,
      context.request.processId,
      requestVector,
    )
    if (!simulation.applied) {
      return decision(
        context,
        DecisionOutcome.Hold,
        DecisionReason.ResourceUnavailable,
        `Request cannot be evaluated against Banker's preconditions: ${simulation.errors.join(' ')}`,
      )
    }

    if (simulation.safety.safe) {
      return decision(
        context,
        DecisionOutcome.Grant,
        DecisionReason.BankersSafeState,
        `Granting keeps the system in a safe state; safe sequence: ${simulation.safety.safeSequence.join(' -> ')}.`,
      )
    }

    return decision(
      context,
      DecisionOutcome.Hold,
      DecisionReason.BankersUnsafeState,
      "Granting would leave no safe sequence under Banker's Algorithm; held to avoid entering an unsafe state.",
    )
  },
}

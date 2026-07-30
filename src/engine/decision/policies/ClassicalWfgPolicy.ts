/**
 * WaitForGraphPolicy: the classical baseline. Its entire criterion is the
 * shared Safety Gate (context.isSafeToGrant) — does granting keep the
 * wait-for graph acyclic, right now, with no notion of risk gradation or
 * future headroom. Never modifies the graph itself; SafetyGate.ts already
 * computed the verdict this policy interprets, using @engine/graph's
 * read-only buildWaitForGraph/hasCycle.
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

export const ClassicalWfgPolicy: DecisionPolicy = {
  type: PolicyType.ClassicalWfg,

  decide(context: DecisionContext): Decision {
    if (context.isSafeToGrant) {
      return {
        requestId: context.request.id,
        outcome: DecisionOutcome.Grant,
        policy: PolicyType.ClassicalWfg,
        trace: {
          reason: DecisionReason.WfgSafeState,
          summary:
            'Granting would not create a wait-for cycle; the classical cycle-detection baseline grants on that basis alone.',
        },
        tick: context.currentTick,
      }
    }

    return {
      requestId: context.request.id,
      outcome: DecisionOutcome.Hold,
      policy: PolicyType.ClassicalWfg,
      trace: {
        reason: DecisionReason.SafetyGateUnsafe,
        summary:
          'Granting would create a wait-for cycle; the classical cycle-detection baseline holds until it would not.',
      },
      tick: context.currentTick,
    }
  },
}

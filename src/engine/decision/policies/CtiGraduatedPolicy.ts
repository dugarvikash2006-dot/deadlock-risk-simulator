/**
 * CtiGraduatedPolicy: recommends Grant/Hold from the request's CTI band
 * rather than a hard safe/unsafe verdict alone — the "graduated" approach
 * this project proposes as an alternative to Banker's Algorithm's
 * conservatism and the classical WFG baseline's all-or-nothing cycle
 * check. Still respects the shared Safety Gate as a hard floor (never
 * grants into an actual cycle, regardless of CTI) and physical
 * availability as a hard floor (never grants what doesn't exist), and
 * applies hysteresis so the recommendation doesn't thrash as CTI wobbles
 * near a band boundary. Interprets CTI/STL only — it never computes them
 * itself (see @engine/risk) and never grants or releases anything.
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
import { DEFAULT_GRADUATED_POLICY_CONFIG } from '@config/graduatedPolicy'
import type { GraduatedPolicyConfig } from '@config/graduatedPolicy'
import { evaluateHysteresis } from '../HysteresisController'

/** Builds the policy so a non-default GraduatedPolicyConfig can be substituted (e.g. for testing threshold changes) without touching this module. */
export function createCtiGraduatedPolicy(
  config: GraduatedPolicyConfig = DEFAULT_GRADUATED_POLICY_CONFIG,
): DecisionPolicy {
  return {
    type: PolicyType.CtiGraduated,

    decide(context: DecisionContext): Decision {
      if (!context.isSafeToGrant) {
        return {
          requestId: context.request.id,
          outcome: DecisionOutcome.Hold,
          policy: PolicyType.CtiGraduated,
          trace: {
            reason: DecisionReason.SafetyGateUnsafe,
            summary:
              'Granting would immediately create a wait-for cycle; held regardless of CTI — the safety floor overrides risk tolerance.',
          },
          tick: context.currentTick,
        }
      }

      if (!context.cti) {
        return {
          requestId: context.request.id,
          outcome: DecisionOutcome.Hold,
          policy: PolicyType.CtiGraduated,
          trace: {
            reason: DecisionReason.ResourceUnavailable,
            summary:
              'No CTI was supplied for this request; held defensively (this policy cannot reason about risk without it).',
          },
          tick: context.currentTick,
        }
      }

      if (context.availableUnits < context.request.unitsRequested) {
        return {
          requestId: context.request.id,
          outcome: DecisionOutcome.Hold,
          policy: PolicyType.CtiGraduated,
          trace: {
            reason: DecisionReason.InsufficientHeadroom,
            summary: `Only ${String(context.availableUnits)} unit(s) available for a request of ${String(context.request.unitsRequested)}; held regardless of CTI band — there is nothing to grant.`,
            cti: context.cti,
            hysteresisSuppressed: false,
          },
          tick: context.currentTick,
        }
      }

      const proposedOutcome = config.grantBands.includes(context.cti.band)
        ? DecisionOutcome.Grant
        : DecisionOutcome.Hold

      const hysteresis = evaluateHysteresis(
        context.hysteresisState,
        context.request.id,
        proposedOutcome,
        context.currentTick,
        config.minDwellTicks,
      )

      const reason =
        hysteresis.outcome === DecisionOutcome.Grant
          ? DecisionReason.CtiBandGrant
          : DecisionReason.CtiBandHold

      const bandSummary = `CTI ${context.cti.score.toFixed(1)} is in the ${context.cti.band} band (grant bands: ${config.grantBands.join(', ')}).`
      const hysteresisSummary = hysteresis.suppressed
        ? ` A flip to ${proposedOutcome} was proposed but suppressed (dwell period not yet elapsed); kept at ${hysteresis.outcome}.`
        : ''

      return {
        requestId: context.request.id,
        outcome: hysteresis.outcome,
        policy: PolicyType.CtiGraduated,
        trace: {
          reason,
          summary: `${bandSummary}${hysteresisSummary}`,
          cti: context.cti,
          hysteresisSuppressed: hysteresis.suppressed,
        },
        tick: context.currentTick,
      }
    },
  }
}

export const CtiGraduatedPolicy: DecisionPolicy = createCtiGraduatedPolicy()

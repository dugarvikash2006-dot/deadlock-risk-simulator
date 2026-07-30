/**
 * Prevents Grant/Hold thrashing: if a proposed outcome differs from a
 * request's last decided outcome, the flip is suppressed until
 * minDwellTicks have elapsed since the last actual change. Used by
 * CtiGraduatedPolicy, whose band-driven recommendation can otherwise
 * oscillate as CTI wobbles near a band boundary; the other two policies
 * (ground-truth safety, not risk tolerance) don't use this.
 *
 * dwellTicksRemaining is derived from lastChangedTick and the current
 * tick rather than manually decremented — a pure function of its inputs,
 * so it can never drift out of sync with lastChangedTick.
 */
import { DecisionOutcome } from '@shared-types/decision'
import type { HysteresisState } from '@shared-types/decision'

export interface HysteresisEvaluation {
  /** The outcome to actually use — proposedOutcome, unless suppressed. */
  readonly outcome: DecisionOutcome
  readonly state: HysteresisState
  /** True when a flip was requested but suppressed because the dwell period hadn't elapsed. */
  readonly suppressed: boolean
}

/** Evaluates whether a proposed outcome flip is allowed yet, given the request's prior hysteresis state. */
export function evaluateHysteresis(
  previous: HysteresisState | null,
  requestId: string,
  proposedOutcome: DecisionOutcome,
  currentTick: number,
  minDwellTicks: number,
): HysteresisEvaluation {
  if (!previous) {
    return {
      outcome: proposedOutcome,
      state: {
        requestId,
        lastOutcome: proposedOutcome,
        lastChangedTick: currentTick,
        dwellTicksRemaining: minDwellTicks,
      },
      suppressed: false,
    }
  }

  const ticksSinceChange = currentTick - previous.lastChangedTick
  const dwellRemaining = Math.max(0, minDwellTicks - ticksSinceChange)

  if (proposedOutcome === previous.lastOutcome) {
    return {
      outcome: previous.lastOutcome,
      state: { ...previous, dwellTicksRemaining: dwellRemaining },
      suppressed: false,
    }
  }

  if (dwellRemaining > 0) {
    return {
      outcome: previous.lastOutcome,
      state: { ...previous, dwellTicksRemaining: dwellRemaining },
      suppressed: true,
    }
  }

  return {
    outcome: proposedOutcome,
    state: {
      requestId,
      lastOutcome: proposedOutcome,
      lastChangedTick: currentTick,
      dwellTicksRemaining: minDwellTicks,
    },
    suppressed: false,
  }
}

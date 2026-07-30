/**
 * Tunable defaults for CtiGraduatedPolicy: which CTI bands result in a
 * Grant recommendation, and how many ticks a recommendation must hold
 * before a flip to the opposite outcome is permitted (hysteresis dwell —
 * prevents rapid Grant/Hold thrashing as CTI oscillates near a band
 * boundary). Kept in config/, not constants/, per this project's
 * established split: these are tuned defaults, not fixed truths.
 */
import { CTIBand } from '@shared-types/risk'

export interface GraduatedPolicyConfig {
  /** CTI bands that result in a Grant recommendation; anything else holds. */
  readonly grantBands: readonly CTIBand[]
  /** Minimum ticks between outcome flips for the same request (see HysteresisController.ts). */
  readonly minDwellTicks: number
}

export const DEFAULT_GRADUATED_POLICY_CONFIG: GraduatedPolicyConfig = {
  grantBands: [CTIBand.Low, CTIBand.Moderate],
  minDwellTicks: 3,
}

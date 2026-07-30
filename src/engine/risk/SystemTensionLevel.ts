/**
 * STLCalculator: maps a CTI score onto one of the four predefined tension
 * bands from CTI_BAND_THRESHOLDS. Pure mapping — it never computes CTI
 * itself (that's CTIScorer's job, in RiskEngine.ts) and never decides
 * anything from the band; it just answers "which band does this score
 * fall in, and why?"
 *
 * Returns a local SystemTensionLevel shape (cti/band/explanation) rather
 * than reusing types/risk.ts's SystemTensionLevelResult: that shared type
 * is a rollup across multiple pending requests' CTIResults
 * (contributingRequestIds), a per-request model reserved for the
 * Decision Engine's future CtiGraduatedPolicy integration — a different
 * shape from this step's single, per-tick system-wide CTI.
 */
import { CTIBand } from '@shared-types/risk'
import { CTI_BAND_THRESHOLDS } from '@constants/ctiBands'

export interface SystemTensionLevel {
  readonly cti: number
  readonly band: CTIBand
  readonly explanation: string
}

/** Maps a [0, 100] CTI score onto its tension band using CTI_BAND_THRESHOLDS — the single source of truth for band boundaries. */
export function computeSystemTensionLevel(cti: number): SystemTensionLevel {
  let band: CTIBand
  if (cti <= CTI_BAND_THRESHOLDS.LOW_MAX) {
    band = CTIBand.Low
  } else if (cti <= CTI_BAND_THRESHOLDS.MODERATE_MAX) {
    band = CTIBand.Moderate
  } else if (cti <= CTI_BAND_THRESHOLDS.HIGH_MAX) {
    band = CTIBand.High
  } else {
    band = CTIBand.Critical
  }

  return {
    cti,
    band,
    explanation: `CTI ${cti.toFixed(2)} falls in the ${band} tension band (Low <= ${String(CTI_BAND_THRESHOLDS.LOW_MAX)}, Moderate <= ${String(CTI_BAND_THRESHOLDS.MODERATE_MAX)}, High <= ${String(CTI_BAND_THRESHOLDS.HIGH_MAX)}, Critical <= ${String(CTI_BAND_THRESHOLDS.CRITICAL_MAX)}).`,
  }
}

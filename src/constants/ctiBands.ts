/**
 * CTI band thresholds (Phase 1). Fixed truths, not meant to be tuned —
 * that's what distinguishes constants/ from config/ in this project.
 * Deliberately has zero imports: the score-to-band mapping function that
 * uses these thresholds belongs in the risk engine (a later step), not here.
 */
export const CTI_BAND_THRESHOLDS = {
  LOW_MAX: 25,
  MODERATE_MAX: 50,
  HIGH_MAX: 75,
  CRITICAL_MAX: 100,
} as const

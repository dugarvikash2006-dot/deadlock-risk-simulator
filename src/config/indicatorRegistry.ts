/**
 * Which Risk Indicators are active (Phase 3 §9 / Phase 4 §9 MVP cut).
 * Deferred indicators stay registered — present, disabled, and honestly
 * surfaced as "designed, not yet active" — rather than invisible.
 */
export const INDICATOR_ENABLEMENT: Readonly<Record<string, boolean>> = {
  cycleProximity: true,
  contentionDensity: true,
  temporalWaiting: true,
  dependencyDepth: false,
  requestFrequency: false,
  connectivity: false,
}

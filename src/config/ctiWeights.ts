import type { CTIWeightsConfig } from '@shared-types/config'

/**
 * Default per-indicator weight, equal across all six registered Risk
 * Indicators (Phase 2 §7). Which of these are actually active is a
 * separate concern — see indicatorRegistry.ts. Keys match the indicatorId
 * each Risk Indicator module will expose.
 */
export const DEFAULT_CTI_WEIGHTS: CTIWeightsConfig = {
  cycleProximity: 1,
  contentionDensity: 1,
  temporalWaiting: 1,
  dependencyDepth: 1,
  requestFrequency: 1,
  connectivity: 1,
}

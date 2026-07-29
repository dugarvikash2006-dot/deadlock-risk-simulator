/**
 * Pure display-formatting helpers shared across the engine, state, and UI
 * layers. riskLevelLabel() only maps an already-computed CTIBand to a
 * label — the score-to-band mapping itself belongs to the risk engine
 * (see the note in constants/ctiBands.ts), not to this presentation layer.
 */
import type { CTIBand } from '@shared-types/risk'
import { roundTo } from './math'

/** Formats a [0, 1] fraction as a percentage string, e.g. 0.4567 -> "45.7%". */
export function percentage(fraction: number, decimals = 1): string {
  return `${String(roundTo(fraction * 100, decimals))}%`
}

/** Formats a number to a fixed number of decimal places as a display string. */
export function decimal(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

const RISK_LEVEL_LABELS: Readonly<Record<CTIBand, string>> = {
  Low: 'Low Risk',
  Moderate: 'Moderate Risk',
  High: 'High Risk',
  Critical: 'Critical Risk',
}

/** Human-readable display label for a CTI band. */
export function riskLevelLabel(band: CTIBand): string {
  return RISK_LEVEL_LABELS[band]
}

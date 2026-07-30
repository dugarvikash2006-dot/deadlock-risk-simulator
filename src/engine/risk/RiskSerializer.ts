/**
 * JSON round-tripping for a RiskSnapshot, for history and replay
 * consumers. Deliberately shallow: confirms a parsed value is shaped
 * correctly, not that it's a value buildRiskSnapshot() itself would
 * produce.
 */
import { CTIBand } from '@shared-types/risk'
import type { RiskSnapshot } from './RiskSnapshot'
import type { CTIIndicatorBreakdown } from './RiskEngine'
import type { SystemTensionLevel } from './SystemTensionLevel'

export type RiskDeserializeResult =
  | { readonly deserialized: true; readonly snapshot: RiskSnapshot }
  | { readonly deserialized: false; readonly errors: readonly string[] }

/** Serializes a RiskSnapshot to a JSON string. */
export function serializeRiskSnapshot(snapshot: RiskSnapshot): string {
  return JSON.stringify(snapshot)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  )
}

function isCTIBand(value: unknown): value is CTIBand {
  return (
    value === CTIBand.Low ||
    value === CTIBand.Moderate ||
    value === CTIBand.High ||
    value === CTIBand.Critical
  )
}

function isSystemTensionLevel(value: unknown): value is SystemTensionLevel {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.cti === 'number' &&
    isCTIBand(candidate.band) &&
    typeof candidate.explanation === 'string'
  )
}

function isIndicatorBreakdown(value: unknown): value is CTIIndicatorBreakdown {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.indicatorId === 'string' &&
    typeof candidate.score === 'number' &&
    typeof candidate.weight === 'number' &&
    typeof candidate.weightedContribution === 'number' &&
    typeof candidate.explanation === 'string'
  )
}

/** Parses a JSON string back into a RiskSnapshot, reporting why it failed rather than throwing on malformed input. */
export function deserializeRiskSnapshot(json: string): RiskDeserializeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { deserialized: false, errors: ['Input is not valid JSON.'] }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { deserialized: false, errors: ['Parsed value is not an object.'] }
  }

  const candidate = parsed as Record<string, unknown>
  const errors: string[] = []

  if (typeof candidate.tick !== 'number') {
    errors.push('"tick" must be a number.')
  }
  if (typeof candidate.timestamp !== 'number') {
    errors.push('"timestamp" must be a number.')
  }
  if (typeof candidate.cti !== 'number') {
    errors.push('"cti" must be a number.')
  }
  if (!isSystemTensionLevel(candidate.stl)) {
    errors.push('"stl" is not a well-formed SystemTensionLevel.')
  }
  if (
    !Array.isArray(candidate.indicators) ||
    !candidate.indicators.every(isIndicatorBreakdown)
  ) {
    errors.push('"indicators" must be an array of CTIIndicatorBreakdown.')
  }
  if (!isStringArray(candidate.calculationTrace)) {
    errors.push('"calculationTrace" must be an array of strings.')
  }

  if (errors.length > 0) {
    return { deserialized: false, errors }
  }

  return {
    deserialized: true,
    snapshot: {
      tick: candidate.tick as number,
      timestamp: candidate.timestamp as number,
      cti: candidate.cti as number,
      stl: candidate.stl as SystemTensionLevel,
      indicators: candidate.indicators as CTIIndicatorBreakdown[],
      calculationTrace: candidate.calculationTrace as string[],
    },
  }
}

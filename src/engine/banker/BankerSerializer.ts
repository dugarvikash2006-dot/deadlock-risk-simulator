/**
 * JSON round-tripping for a complete Banker's Algorithm analysis (the
 * system state analyzed, plus its SafetyCheckResult), for history and
 * replay consumers. Deliberately shallow: it confirms a parsed value is
 * shaped correctly, not that it's a value BankerEngine itself would
 * produce.
 */
import type { BankerSystemState, SafetyCheckResult } from './BankerEngine'

/** A complete, self-contained Banker's Algorithm analysis: what was analyzed and what the safety check found. */
export interface BankerAnalysis {
  readonly system: BankerSystemState
  readonly result: SafetyCheckResult
}

export type BankerDeserializeResult =
  | { readonly deserialized: true; readonly analysis: BankerAnalysis }
  | { readonly deserialized: false; readonly errors: readonly string[] }

/** Serializes a complete Banker's analysis (system state + safety result) to a JSON string. */
export function serializeBankerResult(analysis: BankerAnalysis): string {
  return JSON.stringify(analysis)
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'number')
  )
}

function isBooleanArray(value: unknown): value is boolean[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'boolean')
  )
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  )
}

function isMatrix(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every(isNumberArray)
}

function isSystemState(value: unknown): value is BankerSystemState {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    isStringArray(candidate.processIds) &&
    isStringArray(candidate.resourceIds) &&
    isMatrix(candidate.maximum) &&
    isMatrix(candidate.allocation) &&
    isMatrix(candidate.need) &&
    isNumberArray(candidate.available)
  )
}

function isSafetyResult(value: unknown): value is SafetyCheckResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.safe === 'boolean' &&
    isStringArray(candidate.safeSequence) &&
    Array.isArray(candidate.workHistory) &&
    candidate.workHistory.every(isNumberArray) &&
    Array.isArray(candidate.finishHistory) &&
    candidate.finishHistory.every(isBooleanArray) &&
    isStringArray(candidate.reasoningTrace)
  )
}

/** Parses a JSON string back into a BankerAnalysis, reporting why it failed rather than throwing on malformed input. */
export function deserializeBankerResult(json: string): BankerDeserializeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { deserialized: false, errors: ['Input is not valid JSON.'] }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { deserialized: false, errors: ['Parsed value is not an object.'] }
  }

  const candidate = parsed as { system?: unknown; result?: unknown }
  const errors: string[] = []
  if (!isSystemState(candidate.system)) {
    errors.push('"system" is not a well-formed BankerSystemState.')
  }
  if (!isSafetyResult(candidate.result)) {
    errors.push('"result" is not a well-formed SafetyCheckResult.')
  }
  if (errors.length > 0) {
    return { deserialized: false, errors }
  }

  return {
    deserialized: true,
    analysis: {
      system: candidate.system as BankerSystemState,
      result: candidate.result as SafetyCheckResult,
    },
  }
}
